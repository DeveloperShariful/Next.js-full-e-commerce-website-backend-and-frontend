//File Path: app/api/auth/google/route.ts

import { NextResponse } from "next/server";
import { processGoogleCallback } from "@/app/actions/backend/marketing/gmc-auth.actions";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    // ১. গুগল যদি কোনো এরর পাঠায় (যেমন: ইউজার Cancel করে দিয়েছে)
    if (error) {
      console.warn("Google OAuth Error:", error);
      // WooCommerce স্টাইলে নোটিফিকেশন দেখানোর জন্য URL এ প্যারামিটার পাঠানো
      return NextResponse.redirect(
        new URL(`/admin/marketing/merchant-center?status=error&message=${error}`, request.url)
      );
    }

    // ২. যদি কোড না পাওয়া যায়
    if (!code) {
      return NextResponse.redirect(
        new URL(`/admin/marketing/merchant-center?status=error&message=no_code_provided`, request.url)
      );
    }

    // ৩. Server Action কল করে টোকেন জেনারেট এবং ডাটাবেসে সেভ করা
    const result = await processGoogleCallback(code);

    if (result.success) {
      // 🟢 সাকসেস হলে ড্যাশবোর্ডে রিডাইরেক্ট (সাথ্যে success মেসেজ)
      return NextResponse.redirect(
        new URL(`/admin/marketing/merchant-center?status=success&message=connected`, request.url)
      );
    } else {
      // 🔴 ফেইল হলে ড্যাশবোর্ডে রিডাইরেক্ট (সাথে error মেসেজ)
      const encodedError = encodeURIComponent(result.error || "Unknown Error");
      return NextResponse.redirect(
        new URL(`/admin/marketing/merchant-center?status=error&message=${encodedError}`, request.url)
      );
    }
  } catch (error) {
    console.error("API Callback Exception:", error);
    return NextResponse.redirect(
      new URL(`/admin/marketing/merchant-center?status=error&message=server_error`, request.url)
    );
  }
}