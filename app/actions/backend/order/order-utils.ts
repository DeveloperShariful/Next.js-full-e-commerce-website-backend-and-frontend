//app/actions/admin/order/order-utils.ts

import { db } from "@/lib/prisma";
import { sendNotification } from "@/app/api/email/send-notification";
import { Prisma } from "@prisma/client";
import { getStoreTimezone } from "@/lib/get-store-timezone";
import { storeDateKey } from "@/lib/store-time";

export const safeFloat = (val: unknown): number => {
  if (val === null || val === undefined || val === "") return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

export const toDecimal = (val: number | string | Prisma.Decimal): number => {
  return Number(val);
};

export const add = (a: number, b: number): number => {
  return Math.round((a + b) * 100) / 100;
};

export const sub = (a: number, b: number): number => {
  return Math.round((a - b) * 100) / 100;
};

export const mul = (a: number, b: number): number => {
  return Math.round((a * b) * 100) / 100;
};

export const div = (a: number, b: number): number => {
  if (b === 0) return 0;
  return Math.round((a / b) * 100) / 100;
};

export const round = (num: number): number => {
  return Math.round(num * 100) / 100;
};

// 🔥 FIXED: Changed 'totalSales' to 'netSales' and 'grossSales' to match schema
export async function updateAnalytics(amount: number) {
    const timezone = await getStoreTimezone();
    const today = storeDateKey(new Date(), timezone);
    try {
        await db.analytics.upsert({
            where: { date: today },
            update: { 
              netSales: { increment: amount }, 
              grossSales: { increment: amount }, 
              totalOrders: { increment: 1 } 
            },
            create: { 
              date: today, 
              netSales: amount, 
              grossSales: amount, 
              totalOrders: 1, 
              totalVisitors: 0 // FIXED: Changed visitors to totalVisitors based on schema
            }
        });
    } catch (error) {
        console.error("Analytics Error:", error);
    }
}

export async function restockInventory(orderId: string) {
    const order = await db.order.findUnique({
        where: { id: orderId },
        include: { items: true }
    });
    if (!order) return;

    for (const item of order.items) {
        const inventory = await db.inventoryLevel.findFirst({
            where: { productId: item.productId || "", variantId: item.variantId }
        });

        if (inventory) {
            await db.inventoryLevel.update({
                where: { id: inventory.id }, data: { quantity: { increment: item.quantity } }
            });
        } else if (item.productId) {
            await db.product.update({
                where: { id: item.productId }, data: { stock: { increment: item.quantity } }
            });
        }
    }
}

// এই ৩টা trigger-এর ইমেইলে real Booking ID/postcode/track-order লিংক দেখাতে
// হয় — Transdirect status-poll pipeline (shipment.ts) ছাড়াও admin manually
// tracking যোগ করলে (fulfillment.ts) বা status bulk-update করলে (bulk-update.ts,
// update-status.ts) একই trigger-গুলো ফায়ার হয়, কিন্তু ওই caller-গুলো এই extra
// ডেটা পাস করে না। তাই এখানেই auto-compute করা হচ্ছে (caller explicit
// extraData দিলে সেটাই প্রাধান্য পাবে) — যাতে কোথাও থেকে ইমেইল গেলেই ঠিক তথ্য
// থাকে, কোনো caller "ভুলে গেলে" customer literal "N/A" না দেখে।
const SHIPPING_EVENTS_NEEDING_TRACK_LINK = ["ORDER_SHIPPED", "ORDER_IN_TRANSIT", "ORDER_DELIVERED", "ORDER_READY_FOR_PICKUP"];

async function buildTrackOrderEmailData(orderId: string): Promise<Record<string, string>> {
    const order = await db.order.findUnique({
        where: { id: orderId },
        select: { transdirectQuoteId: true, shippingAddress: true },
    });
    const shipping = order?.shippingAddress as { postcode?: string } | null;
    const postcode = shipping?.postcode || "";
    if (!order?.transdirectQuoteId || !postcode) return {};

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://gobike.au").replace(/\/+$/, "");
    return {
        real_booking_id: order.transdirectQuoteId,
        delivery_postcode: postcode,
        track_order_url: `${siteUrl}/track-order?booking=${order.transdirectQuoteId}&postcode=${encodeURIComponent(postcode)}`,
    };
}

export async function sendOrderEmail(orderId: string, eventType: string, extraData?: Record<string, unknown>) {
    try {
        const [order, settings, emailConfig] = await Promise.all([
            db.order.findUnique({
                where: { id: orderId },
                select: { user: true, guestEmail: true, orderNumber: true }
            }),
            db.storeSettings.findUnique({
                where: { id: "settings" },
                select: { storeEmail: true }
            }),
            db.emailConfiguration.findUnique({
                where: { id: "email_config" },
                select: { senderEmail: true }
            })
        ]);

        if (!order) {
            return;
        }

        const customerEmail = order.user?.email || order.guestEmail;
        const adminEmail = settings?.storeEmail || emailConfig?.senderEmail;

        let finalData: Record<string, unknown> = extraData || {};
        if (SHIPPING_EVENTS_NEEDING_TRACK_LINK.includes(eventType) && !finalData.real_booking_id) {
            finalData = { ...(await buildTrackOrderEmailData(orderId)), ...finalData };
        }

        if (customerEmail) {
            await sendNotification({
                trigger: eventType,
                recipient: customerEmail,
                orderId: orderId,
                data: finalData
            });
        }

        if (adminEmail) {
            let adminTrigger = `ADMIN_${eventType}`;
            
            if (eventType === "ORDER_CREATED") {
                adminTrigger = "ORDER_CREATED_ADMIN";
            }

            await sendNotification({
                trigger: adminTrigger,
                recipient: adminEmail, 
                orderId: orderId,
                data: {}
            });
        } 

    } catch (error) {
        console.error("EMAIL_TRIGGER_ERROR:", error);
    }
}