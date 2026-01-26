// middleware.ts

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// ১. প্রোটেক্টেড রাউটস (যেখানে লগইন ছাড়া যাওয়া যাবে না)
const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/profile(.*)",
  "/api/admin(.*)",
  "/affiliates(.*)" // এফিলিয়েট ড্যাশবোর্ডও প্রোটেক্টেড হওয়া উচিত
]);

// ২. পাবলিক রাউটস (অথেন্টিকেশন দরকার নেই)
const isPublicRoute = createRouteMatcher([
  "/",
  "/shop(.*)",
  "/product(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/tracking(.*)", // ট্র্যাকিং API পাবলিক হতে হবে
  "/api/webhooks(.*)"
]);

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl;
  const searchParams = url.searchParams;
  const referralCode = searchParams.get("ref"); // ?ref=rakib

  // --- AFFILIATE TRACKING LOGIC ---
  // যদি URL এ 'ref' থাকে, আমরা একটি কুকি সেট করব
  let response = NextResponse.next();

  if (referralCode) {
    // কুকি সেট করা (মেয়াদ: ৩০ দিন)
    // নোট: আমরা এখানে ডাটাবেস কল করছি না (Edge Runtime এর কারণে)। 
    // ডাটাবেস এন্ট্রি হবে ক্লায়েন্ট সাইড বা API এর মাধ্যমে।
    response.cookies.set("affiliate_token", referralCode, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // ৩০ দিন (সেকেন্ডে)
      httpOnly: false, // ক্লায়েন্ট সাইড থেকে পড়ার জন্য false রাখা হলো (Analytics এর জন্য)
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  // --- CLERK AUTH LOGIC ---
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  return response;
});

export const config = {
  matcher: [
    // Next.js internals এবং static files বাদে সব রাউট ম্যাচ করবে
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};