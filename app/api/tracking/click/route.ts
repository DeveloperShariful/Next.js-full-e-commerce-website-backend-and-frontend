// app/api/tracking/click/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { slug, path, referrer } = body;

    if (!slug) {
      return NextResponse.json({ error: "Slug required" }, { status: 400 });
    }

    // ১. এফিলিয়েট খুঁজে বের করা
    const affiliate = await db.affiliateAccount.findUnique({
      where: { slug },
      select: { id: true, status: true }
    });

    if (!affiliate || affiliate.status !== "ACTIVE") {
      return NextResponse.json({ error: "Invalid affiliate" }, { status: 404 });
    }

    // ২. রিকোয়েস্ট থেকে মেটাডাটা নেওয়া (IP, User Agent)
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // ৩. ডুপ্লিকেট ক্লিক চেক (Spam Protection) - ঐচ্ছিক
    // একই IP থেকে গত ১ মিনিটের মধ্যে ক্লিক হয়েছে কিনা
    const recentClick = await db.affiliateClick.findFirst({
      where: {
        affiliateId: affiliate.id,
        ipAddress: ip,
        createdAt: {
          gte: new Date(Date.now() - 1000 * 60) // Last 1 minute
        }
      }
    });

    if (recentClick) {
      return NextResponse.json({ message: "Click ignored (duplicate)" });
    }

    // ৪. ডাটাবেসে ক্লিক সেভ করা
    await db.affiliateClick.create({
      data: {
        affiliateId: affiliate.id,
        ipAddress: ip,
        userAgent: userAgent,
        referrer: referrer || "Direct",
        landingPage: path || "/",
        country: "Unknown", // GeoIP লাইব্রেরি থাকলে এখানে দেশ বসাতে পারেন
      }
    });

    // ৫. Campaign Update (যদি ক্যাম্পেইন ট্র্যাকিং থাকে)
    // এটি ফিউচারে ইমপ্লিমেন্ট করা যেতে পারে যদি `Link` টেবিলে ক্লিক বাড়াতে চান

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Tracking Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}