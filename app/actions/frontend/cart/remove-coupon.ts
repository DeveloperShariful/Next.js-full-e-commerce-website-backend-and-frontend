// File: app/actions/storefront/checkout/remove-coupon.ts
"use server";

import { cookies } from "next/headers";

export async function removeCoupon() {
  try {
    const cookieStore = await cookies();
    // কুপন কুকি ডিলিট করা হচ্ছে
    cookieStore.delete("coupon");
    return { success: true, message: "Coupon removed successfully" };
  } catch (error) {
    return { success: false, error: "Failed to remove coupon" };
  }
}