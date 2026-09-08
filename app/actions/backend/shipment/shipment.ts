// File: app/actions/backend/shipment/shipment.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ShipmentQueryParams, GetShipmentsResponse } from "@/app/(backend)/admin/shipments/types";
import { OrderStatus, FulfillmentStatus } from "@prisma/client";
import { logActivity } from "@/lib/activity-logger";
import { sendOrderEmail } from "@/app/actions/backend/order/order-utils";
import { getStoreTimezone } from "@/lib/get-store-timezone";
import { toZonedTime } from "date-fns-tz";

// --- 1. GET SHIPMENTS WITH PAGINATION, SEARCH & COUNTS ---
export async function getShipments(params: ShipmentQueryParams): Promise<GetShipmentsResponse> {
  try {
    const { search = "", status = "ALL", page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    // ডায়নামিক Where কন্ডিশন তৈরি
    const whereCondition: any = {};

    // Search Logic
    if (search) {
      whereCondition.OR = [
        { trackingNumber: { contains: search, mode: "insensitive" } },
        { courier: { contains: search, mode: "insensitive" } },
        { connote: { contains: search, mode: "insensitive" } }, // Transdirect Connote
        { order: { orderNumber: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Status Filter Logic
    if (status === "DELIVERED") {
      whereCondition.lastTrackingStatus = { in: ["delivered", "Delivered"] };
    } else if (status === "CANCELLED") {
      whereCondition.lastTrackingStatus = { in: ["cancelled", "Cancelled"] };
    } else if (status === "IN_TRANSIT") {
      // ✅ FIX: SQL-এর NOT IN ফিল্টার NULL value silently বাদ দিয়ে দেয়, কিন্তু
      // নিচের counts.IN_TRANSIT (JS filter) null/UNKNOWN status-কেও "in transit"
      // ধরে নেয় — এই mismatch-এর কারণেই ট্যাবে ৫৩ দেখাতো কিন্তু তালিকায় ৩টা।
      // whereCondition.OR search-এর জন্য আগে থেকেই ব্যবহৃত, তাই আলাদা AND-এ
      // নিজস্ব OR বসানো হলো যাতে দুটো সাংঘর্ষিক না হয়।
      whereCondition.deliveredDate = null;
      whereCondition.AND = [
        {
          OR: [
            { lastTrackingStatus: { notIn: ["delivered", "Delivered", "cancelled", "Cancelled"] } },
            { lastTrackingStatus: null },
          ],
        },
      ];
    } else if (status === "SYNC_FAILED") {
      whereCondition.syncedToGateway = false;
    }

    // ডেটা এবং কাউন্ট একই সাথে ফেচ করা (প্যারালাল কুয়েরি)
    const [shipments, totalRecords, allShipments] = await Promise.all([
      db.shipment.findMany({
        where: whereCondition,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              shippingAddress: true,
              guestEmail: true,
              user: { select: { name: true, email: true, phone: true } },
            },
          },
        },
        orderBy: { shippedDate: "desc" },
        skip,
        take: limit,
      }),
      db.shipment.count({ where: whereCondition }),
      
      // কাউন্ট বের করার জন্য শুধু id এবং স্ট্যাটাসের ফিল্ডগুলো আনা হচ্ছে (হালকা কুয়েরি)
      db.shipment.findMany({
        select: { deliveredDate: true, syncedToGateway: true, lastTrackingStatus: true }
      })
    ]);

    // স্ট্যাটাস অনুযায়ী কাউন্ট ক্যালকুলেশন
    const counts = {
      ALL:        allShipments.length,
      IN_TRANSIT: allShipments.filter(s => {
        const st = (s.lastTrackingStatus || "").toLowerCase();
        return st !== "delivered" && st !== "cancelled";
      }).length,
      DELIVERED:  allShipments.filter(s => (s.lastTrackingStatus || "").toLowerCase() === "delivered").length,
      CANCELLED:  allShipments.filter(s => (s.lastTrackingStatus || "").toLowerCase() === "cancelled").length,
      SYNC_FAILED: allShipments.filter(s => s.syncedToGateway === false).length,
    };

    return {
      success: true,
      data: JSON.parse(JSON.stringify(shipments)), // Fix Next.js Date/Decimal warning
      meta: {
        total: totalRecords,
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit) || 1,
        limit,
      },
      counts,
    };
  } catch (error) {
    console.error("GET_SHIPMENTS_ERROR", error);
    return { success: false, error: "Failed to fetch shipments." };
  }
}

// --- 2. UPDATE SINGLE TRACKING INFO (From Edit Modal) ---
export async function updateTracking(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const courier = formData.get("courier") as string;
    const trackingNumber = formData.get("trackingNumber") as string;
    const trackingUrl = formData.get("trackingUrl") as string;
    const numberOfParcels = Number(formData.get("numberOfParcels")) || 1;

    if (!id) return { success: false, error: "Shipment ID is required." };

    await db.shipment.update({
      where: { id },
      data: { courier, trackingNumber, trackingUrl, numberOfParcels },
    });

    await logActivity({
      action: 'SHIPMENT_TRACKING_UPDATED',
      entityType: 'Shipment',
      entityId: id,
      details: { courier, trackingNumber },
    });

    revalidatePath("/admin/shipments");
    return { success: true, message: "Tracking updated successfully." };
  } catch (error) {
    console.error("UPDATE_TRACKING_ERROR", error);
    return { success: false, error: "Failed to update tracking info." };
  }
}

// --- 3. BACKFILL — Create Shipment records for already-booked TransDirect orders ---
export async function backfillTransdirectShipments(): Promise<{ success: boolean; created: number; error?: string }> {
  try {
    // Find all orders booked in TransDirect but missing a Shipment record
    const bookedOrders = await db.order.findMany({
      where: { transdirectOrderStatus: "booked" },
      include: {
        items: true,
        shipments: { select: { id: true } },
      },
    });

    const ordersWithoutShipment = bookedOrders.filter(o => o.shipments.length === 0);
    if (ordersWithoutShipment.length === 0) {
      return { success: true, created: 0 };
    }

    let created = 0;
    for (const order of ordersWithoutShipment) {
      const shipmentItems = order.items.map(i => ({
        productName: (i as any).productName || "Product",
        quantity:    (i as any).quantity    || 1,
      }));

      await db.shipment.create({
        data: {
          orderId:         order.id,
          courier:         order.selectedCourierCode || null,
          transdirectId:   order.transdirectBookingId || null,
          labelUrl:        order.transdirectLabelUrl  || null,
          invoiceUrl:      order.transdirectInvoiceUrl || null,
          items:           shipmentItems,
          shippedDate:     order.updatedAt,
          syncedToGateway: true,
          lastSyncedAt:    new Date(),
        },
      });
      created++;
    }

    revalidatePath("/admin/shipments");
    return { success: true, created };
  } catch (error) {
    console.error("BACKFILL_SHIPMENTS_ERROR", error);
    return { success: false, created: 0, error: "Backfill failed." };
  }
}

// --- 4. REFRESH LIVE STATUS FROM TRANSDIRECT API (+ Order sync + customer email) ---
//
// এই function দুই জায়গা থেকে কল হয়:
//   ১. Admin Shipments পেজের "Refresh Status" বাটন (manual)
//   ২. app/api/cron/transdirect-status-sync/route.ts (প্রতি ৩০ মিনিটে automatic)
// দুই ক্ষেত্রেই status বদলালে identical আচরণ — Order status update + customer
// email — যাতে দুইটা আলাদা code path maintain করতে না হয়। Transdirect-এর
// কোনো webhook নেই (নিশ্চিত হওয়া গেছে তাদের public API docs দেখে), তাই polling-ই
// একমাত্র উপায়।
export async function refreshTransdirectStatuses(
  opts: { enforceBusinessHours?: boolean } = {}
): Promise<{ success: boolean; updated: number; error?: string }> {
  try {
    // 🕙 Business-hours guard — শুধু automatic cron-এর জন্য (enforceBusinessHours:
    // true পাঠিয়ে কল করা হয়), admin-এর manual "Refresh Status" বাটনে এই guard
    // প্রযোজ্য না (default false) — যাতে admin যেকোনো সময় নিজে থেকে চেক করতে
    // পারেন। Store-এর নিজস্ব configured timezone (getStoreTimezone — সাধারণত
    // "Australia/Sydney") আর date-fns-tz-এর toZonedTime ব্যবহার হচ্ছে (analytics
    // date-key হিসাবের মতোই, দেখুন lib/store-time.ts) — যাতে AEST/AEDT (daylight
    // saving) automatic ভাবে সঠিক থাকে, শুধু fixed UTC অফসেট বসালে বছরের একটা
    // অংশে ১ ঘণ্টা ভুল পড়তো। সকাল ১০টা-সন্ধ্যা ৬টার মধ্যেই cron চলবে — দিনের
    // বেলা এমনিতেই DB compute হচ্ছে (real traffic), তাই এই সময় polling করলে
    // বাড়তি খরচ নেই, কিন্তু রাতে অকারণ DB compute বাড়বে না। vercel.json-এর cron
    // window (UTC 23:00-08:00) এটার চেয়ে চওড়া — সেটা শুধু invocation সংখ্যা
    // কমায়, আসল নির্ভুল সীমানা এখানেই।
    if (opts.enforceBusinessHours) {
      const storeTimezone = await getStoreTimezone();
      const localHour = toZonedTime(new Date(), storeTimezone).getHours();
      if (localHour < 10 || localHour >= 18) {
        console.log(`[TD Status] Outside business hours (${storeTimezone} ${localHour}:00) — skipping poll.`);
        return { success: true, updated: 0 };
      }
    }

    const config = await db.transdirectConfig.findUnique({ where: { id: "transdirect_config" } });
    if (!config?.apiKey) return { success: false, updated: 0, error: "TransDirect API Key missing." };
    const apiKey = config.apiKey;

    // শুধু active (এখনো delivered/cancelled/refunded/returned/failed না হওয়া)
    // order-এর shipment poll করা হচ্ছে — terminal অবস্থার shipment বারবার চেক
    // করার দরকার নেই। ✅ FIX: আগে কোনো take/orderBy ছিল না, তাই ~২৫০+ shipment
    // একবারে প্রসেস করতে গিয়ে ৬০-সেকেন্ড Vercel timeout-এ কেটে যেত, আর সবসময়
    // একই (প্রথম দিকের) subset-ই প্রসেস হতো, বাকিগুলো কখনো পৌঁছাতোই না। এখন
    // ছোট batch + lastSyncedAt ascending — প্রতিটা ৩০-মিনিটের run আলাদা batch
    // cover করে, সময়ের সাথে সব shipment একে একে cover হয়ে যায়।
    const BATCH_LIMIT = 40;
    const shipments = await db.shipment.findMany({
      where: {
        transdirectId: { not: null },
        order: {
          status: { notIn: [OrderStatus.DELIVERED, OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.REFUNDED, OrderStatus.RETURNED, OrderStatus.FAILED] },
          deletedAt: null,
        },
      },
      select: {
        id: true, transdirectId: true, orderId: true, lastTrackingStatus: true,
        courier: true, trackingNumber: true, trackingUrl: true,
        order: { select: { transdirectQuoteId: true } },
      },
      orderBy: { lastSyncedAt: "asc" },
      take: BATCH_LIMIT,
    });

    if (shipments.length === 0) return { success: true, updated: 0 };

    // Parallel API calls — max 5 at a time to avoid rate limiting
    const BATCH_SIZE = 5;
    let updated = 0;

    for (let i = 0; i < shipments.length; i += BATCH_SIZE) {
      const batch = shipments.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (ship) => {
          // ── ধাপ ১: real Transdirect Booking ID ────────────────────────────
          // আগে এটা আলাদা GET /api/orders/{id} কল করে বের করা হতো, কিন্তু live
          // যাচাই করে দেখা গেছে booking তৈরির সময়ই quote-step-এ এই একই মান
          // Order.transdirectQuoteId-তে সরাসরি সেভ হয়ে যায় (transdirect-sync-order.ts
          // দেখুন) — তাই আলাদা API call করার দরকারই নেই, সরাসরি DB থেকে পড়লেই হয়।
          const realBookingId: number | null = ship.order?.transdirectQuoteId
            ? parseInt(ship.order.transdirectQuoteId, 10)
            : null;
          if (!realBookingId) return null; // এখনো booking-ই হয়নি

          // ── ধাপ ২: booking-এর নিজস্ব status (Confirmed/Cancelled ইত্যাদি) —
          // এটা সবসময় fetch করা হয়, শুধু tracking event history থেকে "cancelled"
          // বোঝা যায় না (courier কখনো cancelled booking-এর জন্য event পাঠায়ই না) —
          // এই একই কলে connote/courier-ও পাওয়া যায়।
          let bookingStatus = "";
          let connote: string | undefined;
          let courierFromBooking: string | undefined;
          try {
            const bookingRes = await fetch(`https://www.transdirect.com.au/api/bookings/${realBookingId}`, {
              method: "GET",
              headers: { "Api-Key": apiKey, "Accept": "application/json" },
            });
            if (bookingRes.ok) {
              const bookingData = await bookingRes.json();
              bookingStatus = String(bookingData?.status || "").toLowerCase();
              connote = bookingData?.connote || undefined;
              courierFromBooking = bookingData?.courier || undefined;
            }
          } catch {
            // best-effort — না পেলে চুপচাপ বাদ, feature ভাঙবে না
          }

          let displayStatus: string | null = null;

          if (bookingStatus.includes("cancel")) {
            displayStatus = "cancelled";
          } else {
            // ── ধাপ ৩: real Booking ID দিয়ে সম্পূর্ণ tracking event history আনা ──
            const trackRes = await fetch(`https://www.transdirect.com.au/api/bookings/track/${realBookingId}`, {
              method: "GET",
              headers: { "Api-Key": apiKey, "Accept": "application/json" },
            });

            if (trackRes.ok) {
              const trackData: unknown = await trackRes.json();
              // এখনো কোনো tracking event তৈরি হয়নি (courier এখনো pickup করেনি) —
              // Transdirect তখন প্লেইন স্ট্রিং ("No booking matched.") ফেরত দেয়, object না
              if (trackData && typeof trackData === "object") {
                const events = Object.values(trackData as Record<string, unknown>)[0] as
                  | Array<{ status?: string; track_status?: string; date?: string }>
                  | undefined;

                if (events && events.length > 0) {
                  // events তালিকা chronological (পুরনো → নতুন) — সবচেয়ে শেষ entry-ই বর্তমান status
                  const latestEvent = events[events.length - 1];
                  const trackStatusCode = String(latestEvent.track_status || "");
                  const statusText = (latestEvent.status || "").toLowerCase();

                  if (trackStatusCode === "1" || statusText.includes("picked up")) displayStatus = "dispatched";
                  else if (trackStatusCode === "2" || trackStatusCode === "3" || statusText.includes("transit") || statusText.includes("onboard")) displayStatus = "in_transit";
                  else if (trackStatusCode === "4" || statusText.includes("delivered")) displayStatus = "delivered";
                }
              }
            }

            // ── ধাপ ৪: courier-এর কাছ থেকে এখনো কোনো tracking event আসেনি —
            // কিন্তু booking real/confirmed (connote assigned, status "new" না,
            // যেটা মানে এখনো manually "Book Now" করাই হয়নি) হলে বোঝা যায় courier
            // booking আসলেই হয়েছে, শুধু pickup বাকি। "new" বাদ দেওয়া জরুরি —
            // নাহলে এখনো Transdirect-এ "Pending" পড়ে থাকা order-কেও ভুলভাবে
            // "booked, waiting pickup" দেখিয়ে দেবে।
            if (!displayStatus && connote && bookingStatus && !bookingStatus.includes("new")) {
              displayStatus = "awaiting_pickup";
            }
          }

          if (!displayStatus) return null;

          console.log(`[TD Status] Shipment ${ship.id} (real booking ${realBookingId}) → booking status="${bookingStatus}" → display="${displayStatus}"`);

          const previousStatus = ship.lastTrackingStatus;

          await db.shipment.update({
            where: { id: ship.id },
            data: {
              lastTrackingStatus: displayStatus,
              lastSyncedAt:       new Date(),
              deliveredDate:      displayStatus === "delivered" ? new Date() : undefined,
              // Transdirect-এর নিজস্ব public tracking পেজ — TrackOrderForm.tsx-এর
              // "Verify on Transdirect" বাটনেও একই URL pattern ব্যবহার হয়
              ...(connote ? { trackingNumber: connote, connote, trackingUrl: `https://www.transdirect.com.au/track/?tn=${connote}` } : {}),
              ...(courierFromBooking && !ship.courier ? { courier: courierFromBooking } : {}),
            },
          });

          // status সত্যিই বদলেছে তখনই Order-level side effect (status/note/email) —
          // নাহলে প্রতি ৩০ মিনিটের poll-এই একই ইমেইল বারবার পাঠানো হয়ে যেত
          if (displayStatus !== previousStatus) {
            await applyTransdirectStatusTransition({
              orderId: ship.orderId,
              displayStatus,
              courier: courierFromBooking || ship.courier,
              trackingNumber: connote || ship.trackingNumber,
              trackingUrl: ship.trackingUrl,
              realBookingId,
            });
          }

          return ship.id;
        })
      );

      updated += results.filter(r => r.status === "fulfilled" && r.value !== null).length;
    }

    revalidatePath("/admin/shipments");
    return { success: true, updated };
  } catch (error) {
    console.error("REFRESH_STATUSES_ERROR", error);
    return { success: false, updated: 0, error: "Failed to refresh statuses." };
  }
}

// Shipment-এর status সত্যিই বদলালে Order-এর status/fulfillmentStatus আপডেট, একটা
// audit OrderNote, আর customer-কে সঠিক ইমেইল পাঠানো — একটা জায়গায় centralize করা,
// যাতে ভবিষ্যতে নতুন status-mapping যোগ করা সহজ হয় এবং duplicate logic না থাকে।
async function applyTransdirectStatusTransition(params: {
  orderId: string;
  displayStatus: string;
  courier: string | null;
  trackingNumber: string | null | undefined;
  trackingUrl: string | null | undefined;
  realBookingId: number | null;
}) {
  const { orderId, displayStatus, courier, trackingNumber, trackingUrl, realBookingId } = params;

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { status: true, deletedAt: true, orderDate: true, shippingAddress: true },
  });
  if (!order || order.deletedAt) return;

  // ইমেইলে দেখানোর জন্য — real Booking ID + delivery postcode + pre-filled
  // track-order লিংক (customer এক ক্লিকেই status দেখতে পারবে, নিজে থেকে টাইপ
  // করতে হবে না)
  const shipping = order.shippingAddress as { postcode?: string } | null;
  const deliveryPostcode = shipping?.postcode || "";
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://gobike.au").replace(/\/+$/, "");
  const emailExtraData = realBookingId && deliveryPostcode
    ? {
        real_booking_id: String(realBookingId),
        delivery_postcode: deliveryPostcode,
        track_order_url: `${siteUrl}/track-order?booking=${realBookingId}&postcode=${encodeURIComponent(deliveryPostcode)}`,
      }
    : {};

  // Cancelled/refunded/returned/failed/completed order — courier থেকে নতুন
  // status এলেও Order.status "resurrect" করা হবে না, কোনো customer email-ও
  // না, শুধু admin-এর জন্য একটা note রাখা হবে। COMPLETED-ও এখানে অন্তর্ভুক্ত —
  // এটাও একটা চূড়ান্ত ("no more email") অবস্থা, DELIVERED-এর মতোই।
  const TERMINAL_STATUSES: OrderStatus[] = [
    OrderStatus.CANCELLED,
    OrderStatus.REFUNDED,
    OrderStatus.RETURNED,
    OrderStatus.FAILED,
    OrderStatus.COMPLETED,
  ];
  const isTerminal = TERMINAL_STATUSES.includes(order.status);

  // 🛡️ ইতিহাস-backfill সুরক্ষা: পুরনো order (যেমন একবার Booking ID backfill বা
  // নতুন feature চালু হওয়ার পর প্রথমবার poll হওয়া মাসখানেক আগের order) হঠাৎ
  // "first transition" হিসেবে ধরা পড়লে customer-কে ভুলভাবে "আপনার পার্সেল
  // এইমাত্র পৌঁছেছে" ইমেইল যাওয়া উচিত না — তারা হয়তো সপ্তাহ/মাস আগেই পেয়ে গেছে।
  // Order/Shipment status ঠিকই আপডেট হবে (silently, ডেটা সঠিক থাকুক), শুধু
  // customer-facing ইমেইল বন্ধ থাকবে পুরনো order-এ। ২১ দিন = বাস্তবসম্মত সর্বোচ্চ
  // shipping window (দেখুন email template-এ থাকা courier estimate গুলো)।
  const RECENT_ORDER_WINDOW_DAYS = 21;
  const orderAgeDays = (Date.now() - new Date(order.orderDate).getTime()) / (1000 * 60 * 60 * 24);
  const isRecentOrder = orderAgeDays <= RECENT_ORDER_WINDOW_DAYS;

  // Terminal order (cancelled/refunded/returned/failed/completed) — courier
  // থেকে যেকোনো নতুন progress event এলেও Order.status বদলানো বা customer email
  // পাঠানো হবে না, শুধু admin-এর জন্য একটা note রেখে থেমে যাওয়া হবে। ব্যতিক্রম:
  // "cancelled" branch (নিচে) — সেটা terminal check-এর বাইরে, কারণ ওটা নিজেই
  // সবসময় শুধু একটা admin-alert note রাখে, কখনো email পাঠায় না।
  if (isTerminal && displayStatus !== "cancelled") {
    await db.orderNote.create({
      data: {
        orderId,
        content: `ℹ️ Transdirect reported status "${displayStatus}" but this order is already ${order.status} — status update and customer email skipped.`,
        isSystem: true,
      },
    });
    return;
  }

  if (displayStatus === "awaiting_pickup") {
    // Courier booking confirmed (real connote assigned) কিন্তু এখনো কোনো pickup
    // event আসেনি — READY_FOR_PICKUP enum value পুনর্ব্যবহার করা হচ্ছে, তবে
    // label/email এখন "Waiting for Pickup" (courier-pickup অর্থে) — পুরনো
    // "গ্রাহক নিজে store-এ এসে নিয়ে যাবে" অর্থ আর ব্যবহার হচ্ছে না।
    if (order.status !== OrderStatus.SHIPPED && order.status !== OrderStatus.DELIVERED) {
      await db.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.READY_FOR_PICKUP,
          ...(courier ? { shippingMethod: courier } : {}),
        },
      });
    }
    await db.orderNote.create({
      data: {
        orderId,
        content: isRecentOrder
          ? `📋 Booking confirmed with ${courier || "the courier"} — waiting for pickup from our warehouse.`
          : `📋 Booking confirmed with ${courier || "the courier"} — waiting for pickup. Order is ${Math.round(orderAgeDays)} days old — customer email skipped (historical catch-up, not a real-time event).`,
        isSystem: true,
      },
    });
    if (isRecentOrder) await sendOrderEmail(orderId, "ORDER_READY_FOR_PICKUP", emailExtraData);
  } else if (displayStatus === "dispatched") {
    if (order.status !== OrderStatus.DELIVERED) {
      await db.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.SHIPPED,
          fulfillmentStatus: FulfillmentStatus.FULFILLED,
          ...(courier ? { shippingMethod: courier } : {}),
          ...(trackingNumber ? { shippingTrackingNumber: trackingNumber } : {}),
          ...(trackingUrl ? { shippingTrackingUrl: trackingUrl } : {}),
        },
      });
    }
    await db.orderNote.create({
      data: {
        orderId,
        content: isRecentOrder
          ? `📦 Courier picked up the parcel (Transdirect status: dispatched).`
          : `📦 Courier picked up the parcel (Transdirect status: dispatched). Order is ${Math.round(orderAgeDays)} days old — customer email skipped (historical catch-up, not a real-time event).`,
        isSystem: true,
      },
    });
    if (isRecentOrder) await sendOrderEmail(orderId, "ORDER_SHIPPED", emailExtraData);
  } else if (displayStatus === "in_transit") {
    // ORDER_IN_TRANSIT টেমপ্লেট আগে থেকে না থাকলে self-seed — admin আলাদা করে
    // "Sync Templates" না চাপলেও ইমেইল কাজ করবে (daily-report-reminder cron-এর
    // মতোই pattern)।
    await db.emailTemplate.upsert({
      where: { triggerEvent: "ORDER_IN_TRANSIT" },
      update: {},
      create: {
        slug: "order_in_transit",
        name: "Order In Transit",
        triggerEvent: "ORDER_IN_TRANSIT",
        recipientType: "customer",
        subject: "Your GoBike Order #{order_number} is on its way — In Transit 🚚",
        heading: "Order In Transit",
        content:
          "<p>Hi {customer_name},</p><p>Quick update — your order <strong>#{order_number}</strong> is now in transit with <strong>{courier}</strong> and getting closer to you.</p><p><strong>Tracking Number:</strong> {tracking_number}</p><p>We'll let you know as soon as it's delivered!</p>",
        isEnabled: true,
      },
    });
    await db.orderNote.create({
      data: {
        orderId,
        content: isRecentOrder
          ? `🚚 Parcel is in transit (Transdirect status: in_transit).`
          : `🚚 Parcel is in transit (Transdirect status: in_transit). Order is ${Math.round(orderAgeDays)} days old — customer email skipped (historical catch-up, not a real-time event).`,
        isSystem: true,
      },
    });
    if (isRecentOrder) await sendOrderEmail(orderId, "ORDER_IN_TRANSIT", emailExtraData);
  } else if (displayStatus === "delivered") {
    // isTerminal ইতিমধ্যে উপরে চেক হয়ে গেছে (early return) — এখানে পৌঁছালে
    // মানে order নিশ্চিতভাবেই non-terminal
    await db.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.DELIVERED },
    });
    await db.orderNote.create({
      data: {
        orderId,
        content: isRecentOrder
          ? `✅ Parcel delivered (Transdirect status: delivered).`
          : `✅ Parcel delivered (Transdirect status: delivered). Order is ${Math.round(orderAgeDays)} days old — customer email skipped (historical catch-up, not a real-time event).`,
        isSystem: true,
      },
    });
    if (isRecentOrder) await sendOrderEmail(orderId, "ORDER_DELIVERED", emailExtraData);
  } else if (displayStatus === "cancelled") {
    await db.orderNote.create({
      data: { orderId, content: `⚠️ Transdirect reports this booking as CANCELLED — please review manually.`, isSystem: true },
    });
    // ইচ্ছাকৃতভাবে কোনো customer email না — booking বাতিল হওয়া rare/সন্দেহজনক ঘটনা,
    // admin আগে যাচাই করুক তারপর প্রয়োজনে নিজে থেকে customer-কে জানাক
  }
  // 'pending' / 'booked' — কোনো নতুন customer-facing action দরকার নেই, booking
  // তৈরির সময়ই ORDER_PROCESSING ইমেইল ইতিমধ্যে পাঠানো হয়ে গেছে
}

// --- 5. BULK ACTIONS (WooCommerce Style) ---
export async function bulkUpdateShipments(ids: string[], action: string) {
  try {
    if (ids.length === 0) return { success: false, error: "No items selected." };

    if (action === "delete") {
      await db.shipment.deleteMany({ where: { id: { in: ids } } });
      
    } else if (action === "mark_delivered") {
      
      // ১. শিপমেন্ট টেবিল আপডেট
      await db.shipment.updateMany({
        where: { id: { in: ids } },
        data: { deliveredDate: new Date() },
      });

      // ২. যেসব শিপমেন্ট মার্ক করা হলো, তাদের অর্ডারগুলোর ID বের করা
      const updatedShipments = await db.shipment.findMany({
        where: { id: { in: ids } },
        select: { orderId: true },
      });

      const orderIds = updatedShipments.map((s) => s.orderId);

      // ৩. ঐ অর্ডারগুলোর স্ট্যাটাসও DELIVERED করে দেওয়া (আপনার রিকোয়ারমেন্ট অনুযায়ী)
      await db.order.updateMany({
        where: { id: { in: orderIds } },
        data: { status: OrderStatus.DELIVERED },
      });
    }

    await logActivity({
      action: 'SHIPMENT_BULK_UPDATED',
      entityType: 'Shipment',
      details: { count: ids.length, action },
    });

    revalidatePath("/admin/shipments");
    return { success: true, message: "Bulk action applied successfully." };
  } catch (error) {
    console.error("BULK_ACTION_ERROR", error);
    return { success: false, error: "Failed to perform bulk action." };
  }
}