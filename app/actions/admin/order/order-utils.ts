import { db } from "@/lib/prisma";
// ✅ FIX: আপনার নির্দেশ অনুযায়ী সঠিক পাথ
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

// 3. EMAIL TRIGGER (UPDATED)
export async function sendOrderEmail(orderId: string, eventType: string) {
    console.log(`📩 [1/3] sendOrderEmail Called. Event: ${eventType}, OrderID: ${orderId}`);

    try {
        // ১. অর্ডার এবং সেটিংস (Admin Email) একসাথে খোঁজা
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
            console.error("❌ Order not found for email.");
            return;
        }

        // কাস্টমার ইমেইল
        const customerEmail = order.user?.email || order.guestEmail;

        // ✅ অ্যাডমিন ইমেইল লজিক:
        // প্রথমে Store Settings এর মেইল দেখবে, না পেলে Email Config এর Sender Email দেখবে।
        const adminEmail = settings?.storeEmail || emailConfig?.senderEmail;

        // ============================================================
        // 📧 CUSTOMER EMAIL SENDING
        // ============================================================
        if (customerEmail) {
            await sendNotification({
                trigger: eventType, // যেমন: ORDER_PLACED
                recipient: customerEmail,
                orderId: orderId, 
                data: {}
            });
            console.log(`✅ Customer email queued for: ${customerEmail}`);
        }

        // ============================================================
        // 👮 ADMIN EMAIL SENDING (Explicitly Set)
        // ============================================================
        if (adminEmail) {
            // অ্যাডমিন ট্রিগার নাম সেট করা (যেমন: ADMIN_ORDER_PLACED)
            let adminTrigger = `ADMIN_${eventType}`;
            
            if (eventType === "ORDER_CREATED") {
                adminTrigger = "ORDER_CREATED_ADMIN";
            }

            // ✅ এখানে সরাসরি Admin Email বসিয়ে দিলাম (আর ফাঁকা স্ট্রিং নয়)
            await sendNotification({
                trigger: adminTrigger,
                recipient: adminEmail, 
                orderId: orderId,
                data: {}
            });
            console.log(`✅ Admin email queued for: ${adminEmail}`);
        } else {
            console.warn("⚠️ No Admin email found in Store Settings or Email Config.");
        }

    } catch (error) {
        console.error("🔥 EMAIL_TRIGGER_ERROR:", error);
    }
}