// File: app/actions/backend/shipment/shipment.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ShipmentQueryParams, GetShipmentsResponse } from "@/app/(backend)/admin/shipments/types";
import { OrderStatus } from "@prisma/client";
import { logActivity } from "@/lib/activity-logger";

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
      whereCondition.lastTrackingStatus = { notIn: ["delivered", "Delivered", "cancelled", "Cancelled"], };
      whereCondition.deliveredDate = null;
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

// --- 4. REFRESH LIVE STATUS FROM TRANSDIRECT API ---
export async function refreshTransdirectStatuses(): Promise<{ success: boolean; updated: number; error?: string }> {
  try {
    const config = await db.transdirectConfig.findUnique({ where: { id: "transdirect_config" } });
    if (!config?.apiKey) return { success: false, updated: 0, error: "TransDirect API Key missing." };
    const apiKey = config.apiKey;

    const shipments = await db.shipment.findMany({
      where: { transdirectId: { not: null } },
      select: { id: true, transdirectId: true },
    });

    if (shipments.length === 0) return { success: true, updated: 0 };

    // Parallel API calls — max 5 at a time to avoid rate limiting
    const BATCH_SIZE = 5;
    let updated = 0;

    for (let i = 0; i < shipments.length; i += BATCH_SIZE) {
      const batch = shipments.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (ship) => {
          const res = await fetch(`https://www.transdirect.com.au/api/bookings/${ship.transdirectId}`, {
            method: "GET",
            headers: { "Api-Key": apiKey, "Accept": "application/json" },
          });

          if (!res.ok) return null;
          const data = await res.json();

          const rawStatus: string = (data.status || data.booking_status || data.state || "").toLowerCase().trim();
          if (!rawStatus) return null;

          // TransDirect status → our display value
          let displayStatus = rawStatus;
          if (["new", "pending_order", "pending order"].includes(rawStatus)) displayStatus = "pending";
          else if (rawStatus === "booked")                                    displayStatus = "booked";
          else if (["dispatched", "picked_up"].includes(rawStatus))          displayStatus = "dispatched";
          else if (["in_transit", "in transit"].includes(rawStatus))         displayStatus = "in_transit";
          else if (rawStatus === "delivered")                                 displayStatus = "delivered";
          else if (["cancelled", "canceled"].includes(rawStatus))            displayStatus = "cancelled";

          console.log(`[TD Status] ID ${ship.transdirectId} → raw="${rawStatus}" → display="${displayStatus}"`);

          await db.shipment.update({
            where: { id: ship.id },
            data: {
              lastTrackingStatus: displayStatus,
              lastSyncedAt:       new Date(),
              deliveredDate:      displayStatus === "delivered" ? new Date() : undefined,
            },
          });
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