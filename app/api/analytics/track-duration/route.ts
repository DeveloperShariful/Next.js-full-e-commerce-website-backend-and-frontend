// app/api/analytics/track-duration/route.ts
// sendBeacon()-এর জন্য আলাদা lightweight API route — Server Action-কে sendBeacon
// দিয়ে সরাসরি কল করা যায় না (এর নিজস্ব encoding/header দরকার হয়)। পেজ hide/close
// হওয়ার মুহূর্তে ব্রাউজার এই কলটা background-এ পাঠায়, response-এর জন্য অপেক্ষা করে
// না — তাই এটা navigation/unload-কে কখনো block করে না।

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

const MAX_DURATION_SECONDS = 24 * 60 * 60; // ২৪ ঘণ্টা cap — ট্যাব খোলা রেখে চলে গেলে outlier আটকাতে

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    const body = JSON.parse(raw) as { visitId?: string; durationSeconds?: number };

    if (!body.visitId || typeof body.durationSeconds !== "number" || body.durationSeconds <= 0) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const durationSeconds = Math.min(Math.round(body.durationSeconds), MAX_DURATION_SECONDS);

    await db.siteVisit.update({
      where: { id: body.visitId },
      data: { durationSeconds },
    });

    return NextResponse.json({ success: true });
  } catch {
    // visitId ভুল/পুরনো হলে (row না থাকলে) নীরবে fail — sendBeacon-এর response
    // দেখারই সুযোগ নেই ব্রাউজারে, তাই error surface করার দরকার নেই।
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
