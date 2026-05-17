// File Location: app/actions/order/create_order/validate-discount.ts

"use server";

import { db } from "@/lib/prisma";

export async function validateDiscount(code: string, cartTotal: number) {
    const discount = await db.discount.findUnique({
        where: { code, isActive: true }
    });

    if (!discount) return { success: false, message: "Invalid or inactive code" };

    // তারিখ চেক
    const now = new Date();
    if (discount.startDate > now || (discount.endDate && discount.endDate < now)) {
        return { success: false, message: "Coupon expired" };
    }

    // মিনিমাম স্পেন্ড চেক (FIXED HERE)
    // discount.minSpend হলো Decimal, তাই .toNumber() ব্যবহার করা হয়েছে
    if (discount.minSpend && cartTotal < discount.minSpend.toNumber()) {
        return { success: false, message: `Min spend ${discount.minSpend} required` };
    }

    return { success: true, discount };
}