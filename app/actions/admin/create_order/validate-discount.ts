// File Location: app/actions/create_order/validate-discount.ts

"use server";

import { db } from "@/lib/db";

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

    // মিনিমাম স্পেন্ড চেক
    if (discount.minSpend && cartTotal < discount.minSpend) {
        return { success: false, message: `Min spend ${discount.minSpend} required` };
    }

    return { success: true, discount };
}