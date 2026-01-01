"use server";

import { cookies } from "next/headers";

export async function removeCoupon() {
  const cookieStore = await cookies();
  cookieStore.delete("coupon");
  return { success: true, message: "Coupon removed" };
}