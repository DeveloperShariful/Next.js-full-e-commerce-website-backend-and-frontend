// app/actions/frontend/track-order/trackOrderAction.ts
//
// আগে এটা app/api/track-order/route.ts (একটা API route) ছিল, যা শুধু আমাদের
// নিজস্ব TrackOrderForm.tsx-ই কল করে — কোনো বাইরের সিস্টেম না। তাই Server
// Action-এ কনভার্ট করা হলো: Next.js নিজে থেকেই origin/CSRF protection দেয়
// (raw API route-এ যা থাকে না), আর কোড সহজও হয়।
//
// 🛡️ Postcode verification: Transdirect Booking ID ক্রমিক সংখ্যা (৩৩xxxxxx
// রেঞ্জ) — যাচাই ছাড়া শুধু ID দিয়ে receiver-এর নাম/ইমেইল/ফোন/ঠিকানা ফেরত
// দিলে যে কেউ script দিয়ে একের পর এক ID চেষ্টা করে অন্য customer-দের ব্যক্তিগত
// তথ্য হারভেস্ট করে ফেলতে পারতো। তাই booking-এর real receiver postcode-এর
// সাথে customer-এর দেওয়া postcode না মিললে কিছুই ফেরত দেওয়া হয় না
// (Australia Post-এর মতো established pattern)।

"use server";

import { db } from "@/lib/prisma";

interface TrackOrderResult {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

export async function trackOrderAction(bookingIdRaw: string, postcodeRaw: string): Promise<TrackOrderResult> {
  const bookingId = String(bookingIdRaw || "").trim();
  const inputPostcode = String(postcodeRaw || "").trim();

  if (!bookingId || !/^\d+$/.test(bookingId)) {
    return { success: false, error: "Please enter a valid Booking ID (numbers only)." };
  }
  if (!inputPostcode) {
    return { success: false, error: "Please enter the delivery postcode for verification." };
  }

  const config = await db.transdirectConfig.findUnique({ where: { id: "transdirect_config" } });
  if (!config?.apiKey) {
    return { success: false, error: "Tracking is temporarily unavailable. Please try again later." };
  }
  const apiKey = config.apiKey;

  // ── ধাপ ১: Booking detail ──────────────────────────────────────────────
  let booking: Record<string, unknown>;
  try {
    const bookingRes = await fetch(`https://www.transdirect.com.au/api/bookings/${bookingId}`, {
      method: "GET",
      headers: { "Api-Key": apiKey, "Accept": "application/json" },
      cache: "no-store",
    });
    if (!bookingRes.ok) {
      return { success: false, error: "No booking found with that Booking ID. Please check and try again." };
    }
    booking = await bookingRes.json();
  } catch (error) {
    console.error("TRACK_ORDER_BOOKING_FETCH_ERROR", error);
    return { success: false, error: "Tracking is temporarily unavailable. Please try again later." };
  }

  // 🛡️ Postcode verification — ব্যক্তিগত তথ্য PII leak/brute-force আটকাতে
  const receiver = booking?.receiver as { postcode?: string } | undefined;
  const actualPostcode = String(receiver?.postcode || "").trim();
  if (!actualPostcode || actualPostcode !== inputPostcode) {
    return { success: false, error: "Booking ID and postcode don't match. Please double-check and try again." };
  }

  // ── ধাপ ২: সম্পূর্ণ tracking event history — best-effort ────────────────
  try {
    const trackRes = await fetch(`https://www.transdirect.com.au/api/bookings/track/${bookingId}`, {
      method: "GET",
      headers: { "Api-Key": apiKey, "Accept": "application/json" },
      cache: "no-store",
    });
    if (trackRes.ok) {
      const trackData = await trackRes.json();
      if (trackData && typeof trackData === "object" && !Array.isArray(trackData)) {
        const events = Object.values(trackData as Record<string, unknown>)[0];
        if (Array.isArray(events) && events.length > 0) {
          booking.tracking_events = events;
          const latestEvent = events[events.length - 1] as { status?: string; description?: string; date?: string };
          booking.latest_status = latestEvent.status;
          booking.latest_description = latestEvent.description;
          booking.latest_event_date = latestEvent.date;
        }
      }
    }
  } catch (trackError) {
    console.error("⚠️ Tracking history fetch failed, showing booking info only.", trackError);
  }

  // ── ধাপ ৩: এখনো delivered না হলে — আমাদের নিজের সেভ করা transit-time
  // estimate দিয়ে আনুমানিক delivery window বের করা (Transdirect real ডেটা
  // দেয় না — আগে verify করা হয়েছে, তাই এটা স্পষ্টভাবে "estimated" হিসেবেই
  // পাঠানো হচ্ছে, real Transdirect তারিখ হিসেবে না)।
  const alreadyDelivered = (booking.latest_status as string | undefined)?.toLowerCase().includes("delivered");
  if (!alreadyDelivered) {
    try {
      const orderInfo = booking.order as { order_id?: string } | undefined;
      const ourOrderId = orderInfo?.order_id ? parseInt(orderInfo.order_id, 10) : null;
      if (ourOrderId) {
        const order = await db.order.findFirst({
          where: { transdirectBookingId: ourOrderId },
          select: { estimatedTransitTime: true },
        });
        const transit = parseTransitDays(order?.estimatedTransitTime);
        const pickupWindow = booking.pickup_window as [string, string] | undefined;
        const baseDateStr = pickupWindow?.[0] || (booking.booked_at as string | undefined);
        if (transit && baseDateStr) {
          const base = new Date(baseDateStr);
          if (!isNaN(base.getTime())) {
            const fmt = (days: number) => {
              const d = new Date(base);
              d.setDate(d.getDate() + days);
              return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
            };
            booking.estimated_delivery_range =
              transit.min === transit.max ? fmt(transit.min) : `${fmt(transit.min)} – ${fmt(transit.max)}`;
          }
        }
      }
    } catch (estimateError) {
      console.error("⚠️ Estimated delivery calc failed — skipping, not blocking the response.", estimateError);
    }
  }

  return { success: true, data: booking };
}

// courier-quoted transit-time টেক্সট (যেমন "3-5 Days", "Aramex (2 Days)") থেকে
// দিনের সংখ্যা বের করা — সংখ্যাই না পেলে null (কখনো আন্দাজি সংখ্যা বসানো হয় না)
function parseTransitDays(text: string | null | undefined): { min: number; max: number } | null {
  if (!text) return null;
  const numbers = text.match(/\d+/g)?.map(Number) ?? [];
  if (numbers.length === 0) return null;
  if (numbers.length === 1) return { min: numbers[0], max: numbers[0] };
  return { min: Math.min(...numbers), max: Math.max(...numbers) };
}
