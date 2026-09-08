// app/api/email/track-click/[id]/route.ts
//
// Email click-tracking redirect — generateEmailHtml() action button-এর আসল
// href-কে এই URL দিয়ে wrap করে দেয় (?to=<আসল-লিংক>)। ক্লিক করলে এই route
// EmailLog.clickedAt সেট করে, তারপর সাথে সাথেই আসল destination-এ redirect
// করে দেয় — customer কিছুই টের পায় না, শুধু এক মুহূর্তের bounce।
//
// pixel-based openedAt-এর চেয়ে এটা অনেক বেশি নির্ভরযোগ্য — ক্লিক মানেই real,
// ইচ্ছাকৃত customer action, কোনো email-client image-preload-এর false positive
// নেই।

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

const FALLBACK_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://gobike.au").replace(/\/+$/, "");

// ✅ FIX: এই codebase-এ NEXT_PUBLIC_APP_URL আর NEXT_PUBLIC_SITE_URL দুটো আলাদা
// env var — track_order_url (shipment.ts, order-utils.ts) SITE_URL দিয়ে তৈরি
// হয়, কিন্তু আগে এখানে শুধু APP_URL-এর সাথে origin মিলিয়ে দেখা হতো। .env-এ
// এই দুটো ভিন্ন হলে (এখনই ভিন্ন: gobike.au বনাম localhost) real "Track My
// Order" লিংক ভুলভাবে "cross-origin" ধরে homepage-এ পাঠিয়ে দিতো — তাই এখন
// দুটো origin-ই allow করা হচ্ছে।
const ALLOWED_ORIGINS = new Set(
  [process.env.NEXT_PUBLIC_APP_URL, process.env.NEXT_PUBLIC_SITE_URL, "https://gobike.au"]
    .filter((v): v is string => !!v)
    .map((v) => {
      try { return new URL(v).origin; } catch { return null; }
    })
    .filter((v): v is string => !!v)
);

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const requestedUrl = searchParams.get("to");

  // 🛡️ Open-redirect সুরক্ষা — শুধু আমাদের নিজের (একাধিক সম্ভাব্য) domain-এই
  // redirect করা হবে, যেকোনো বাইরের URL না। নাহলে কেউ এই tracking link
  // ব্যবহার করে ভুয়া phishing redirect বানিয়ে ফেলতে পারতো।
  let destination = FALLBACK_URL;
  if (requestedUrl) {
    try {
      const parsed = new URL(requestedUrl);
      if (ALLOWED_ORIGINS.has(parsed.origin)) {
        destination = requestedUrl;
      }
    } catch {
      // malformed URL — fallback-এই থাকবে
    }
  }

  try {
    // ✅ FIX: আগে findUnique + update — দুটো আলাদা DB round-trip, প্রতিটা
    // ক্লিকে অতিরিক্ত latency যোগ করতো। এখন একটা raw SQL দিয়ে একবারেই —
    // COALESCE দিয়ে openedAt আগে থেকে সেট থাকলে অক্ষত থাকে (প্রথম real open
    // সময়টাই সংরক্ষিত থাকে), না থাকলে এখনই সেট হয়ে যায়।
    await db.$executeRaw`
      UPDATE "EmailLog"
      SET "clickedAt" = NOW(), "openedAt" = COALESCE("openedAt", NOW())
      WHERE id = ${id}
    `;
  } catch (error) {
    // best-effort — ট্র্যাকিং fail হলেও redirect ঠিকই হবে, customer কখনো আটকে
    // থাকবে না একটা ব্যর্থ tracking write-এর জন্য
    console.error("EMAIL_TRACK_CLICK_ERROR", error);
  }

  return NextResponse.redirect(destination, { status: 302 });
}
