// app/actions/coupon.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { DiscountType } from "@prisma/client";

// --- TYPES ---
export interface CouponData {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  usageLimit: number | null;
  usedCount: number;
  minSpend: number | null;
  endDate: Date | null;
  isActive: boolean;
}

// --- 1. GET COUPONS ---
export async function getCoupons() {
  try {
    const coupons = await db.discount.findMany({
      // ✅ FIX: 'createdAt' নেই, তাই 'startDate' দিয়ে সর্ট করা হলো
      orderBy: { startDate: 'desc' } 
    });
    return { success: true, data: coupons };
  } catch (error) {
    return { success: false, error: "Failed to fetch coupons" };
  }
}

// --- 2. CREATE / UPDATE COUPON ---
export async function saveCoupon(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const code = (formData.get("code") as string).toUpperCase().trim();
    const type = formData.get("type") as DiscountType;
    const value = parseFloat(formData.get("value") as string);
    const minSpend = formData.get("minSpend") ? parseFloat(formData.get("minSpend") as string) : null;
    const usageLimit = formData.get("usageLimit") ? parseInt(formData.get("usageLimit") as string) : null;
    const endDate = formData.get("endDate") ? new Date(formData.get("endDate") as string) : null;
    const isActive = formData.get("isActive") === "true";

    if (!code || !value) return { success: false, error: "Code and Value required" };

    const data = {
      code,
      type,
      value,
      minSpend: minSpend || null,
      usageLimit: usageLimit || null,
      endDate,
      isActive
    };

    if (id) {
      // Update
      await db.discount.update({
        where: { id },
        data
      });
    } else {
      // Create (Check unique)
      const existing = await db.discount.findUnique({ where: { code } });
      if (existing) return { success: false, error: "Coupon code already exists!" };

      await db.discount.create({ data });
    }

    revalidatePath("/admin/coupons");
    return { success: true, message: id ? "Coupon updated successfully" : "Coupon created successfully" };

  } catch (error: any) {
    console.error("SAVE_COUPON_ERROR", error);
    return { success: false, error: "Operation failed" };
  }
}

// --- 3. DELETE COUPON ---
export async function deleteCoupon(id: string) {
  try {
    await db.discount.delete({ where: { id } });
    revalidatePath("/admin/coupons");
    return { success: true, message: "Coupon deleted successfully" };
  } catch (error) {
    return { success: false, error: "Delete failed" };
  }
}