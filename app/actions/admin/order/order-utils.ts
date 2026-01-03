// File Location: app/actions/admin/order/order-utils.ts

import { db } from "@/lib/prisma";
// ✅ FIX: সঠিক ইমপোর্ট পাথ (আপনার ফাইল লোকেশন অনুযায়ী)
import { sendNotification } from "@/app/api/email/send-notification";

// 1. ANALYTICS
export async function updateAnalytics(amount: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    try {
        await db.analytics.upsert({
            where: { date: today },
            update: { totalSales: { increment: amount }, totalOrders: { increment: 1 } },
            create: { date: today, totalSales: amount, totalOrders: 1, visitors: 0 }
        });
    } catch (error) {
        console.error("❌ Analytics Error:", error);
    }
}

// 2. RESTOCK
export async function restockInventory(orderId: string) {
    console.log(`📦 Restocking Inventory for Order: ${orderId}`);
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

// 3. EMAIL TRIGGER (UPDATED: Customer + Admin)
export async function sendOrderEmail(orderId: string, eventType: string) {
    console.log(`📩 [1/3] sendOrderEmail Called. Event: ${eventType}, OrderID: ${orderId}`);

    try {
        const order = await db.order.findUnique({
            where: { id: orderId },
            select: { user: true, guestEmail: true }
        });

        if (!order) {
            console.error("❌ Order not found for email.");
            return;
        }

        const recipientEmail = order.user?.email || order.guestEmail;
        console.log(`📩 [2/3] Recipient Found: ${recipientEmail}`);

        if (!recipientEmail) {
            console.error("❌ No recipient email found.");
            return;
        }

        // ✅ ১. কাস্টমারকে মেইল পাঠানো (Queue তে জমা হবে)
        await sendNotification({
            trigger: eventType,
            recipient: recipientEmail,
            orderId: orderId, 
            data: {}
        });

        // ✅ ২. অ্যাডমিনকে মেইল পাঠানো (Queue তে জমা হবে)
        // লজিক: ইভেন্টের নামের আগে 'ADMIN_' যোগ করা হলো (যেমন: ADMIN_ORDER_PLACED)
        // recipient: "" ফাঁকা রাখা হলো, যাতে Worker স্টোর সেটিংস থেকে মেইল নেয়।
        await sendNotification({
            trigger: `${eventType}_ADMIN`,
            recipient: "admin", 
            orderId: orderId,
            data: {}
        });
        
        console.log("📩 [3/3] Notifications queued for both Customer & Admin.");

    } catch (error) {
        console.error("🔥 EMAIL_TRIGGER_ERROR:", error);
    }
}