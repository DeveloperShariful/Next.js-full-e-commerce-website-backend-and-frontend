//app/actions/admin/order/order-utils.ts

import { db } from "@/lib/prisma";
import { sendNotification } from "@/app/api/email/send-notification";
import { Prisma } from "@prisma/client";

export const safeFloat = (val: any): number => {
  if (!val) return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

export const toDecimal = (val: number | string | Prisma.Decimal): number => {
  return Number(val);
};

export const add = (a: number, b: number): number => {
  return Math.round((a + b) + Number.EPSILON * 100) / 100;
};

export const sub = (a: number, b: number): number => {
  return Math.round((a - b) + Number.EPSILON * 100) / 100;
};

export const mul = (a: number, b: number): number => {
  return Math.round((a * b) + Number.EPSILON * 100) / 100;
};

export const div = (a: number, b: number): number => {
  if (b === 0) return 0;
  return Math.round((a / b) + Number.EPSILON * 100) / 100;
};

export const round = (num: number): number => {
  return Math.round(num * 100) / 100;
};

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

export async function sendOrderEmail(orderId: string, eventType: string) {
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

        if (customerEmail) {
            await sendNotification({
                trigger: eventType, 
                recipient: customerEmail,
                orderId: orderId, 
                data: {}
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