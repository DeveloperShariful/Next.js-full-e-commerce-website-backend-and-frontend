// app/api/email/track-open/[id]/route.ts
//
// Email open-tracking pixel — generateEmailHtml() প্রতিটা real পাঠানো email-এর
// শেষে এই URL দিয়ে একটা অদৃশ্য ১x১ ছবি বসিয়ে দেয়। Email client যখন সেই ছবি
// লোড করে (email খোলা হলে), এই route হিট হয় আর EmailLog.openedAt সেট হয়।
//
// ⚠️ সততার নোট: Apple Mail Privacy Protection delivery-র সময়ই সব ছবি preload
// করে ফেলে (customer আসলে খুলুক বা না খুলুক), আর Gmail নিজের proxy দিয়ে cache
// করে রাখে — তাই এটা "সম্ভবত দেখেছে" বোঝায়, ১০০% নিশ্চিত না। বেশি নির্ভরযোগ্য
// signal-এর জন্য দেখুন track-click/[id]/route.ts।

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

// 1x1 transparent GIF — সব email client-ই সমর্থন করে, PNG-এর চেয়ে ছোট
const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==", "base64");

const PIXEL_RESPONSE_INIT = {
  status: 200,
  headers: {
    "Content-Type": "image/gif",
    "Content-Length": String(PIXEL.length),
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    Pragma: "no-cache",
  },
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // শুধু প্রথমবার open-এই সেট করা হয় (openedAt: null হলেই) — পরবর্তী প্রতিটা
    // proxy-refetch/re-open-এ বারবার সময় update করার দরকার নেই, প্রথম "দেখেছে"
    // মুহূর্তটাই গুরুত্বপূর্ণ।
    await db.emailLog.updateMany({
      where: { id, openedAt: null },
      data: { openedAt: new Date() },
    });
  } catch (error) {
    // best-effort — ট্র্যাকিং fail হলেও ছবি ঠিকই ফেরত যাবে, email-এ broken
    // icon দেখাবে না
    console.error("EMAIL_TRACK_OPEN_ERROR", error);
  }

  return new NextResponse(PIXEL, PIXEL_RESPONSE_INIT);
}
