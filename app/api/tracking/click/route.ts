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
    const affiliate = await db.affiliateAccount.findUnique({
      where: { slug },
      select: { id: true, status: true }
    });

    if (!affiliate || affiliate.status !== "ACTIVE") {
      return NextResponse.json({ error: "Invalid affiliate" }, { status: 404 });
    }
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const recentClick = await db.affiliateClick.findFirst({
      where: {
        affiliateId: affiliate.id,
        ipAddress: ip,
        createdAt: {
          gte: new Date(Date.now() - 1000 * 60) 
        }
      }
    });

    if (recentClick) {
      return NextResponse.json({ message: "Click ignored (duplicate)" });
    }
    await db.affiliateClick.create({
      data: {
        affiliateId: affiliate.id,
        ipAddress: ip,
        userAgent: userAgent,
        referrer: referrer || "Direct",
        landingPage: path || "/",
        country: "Unknown", 
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Tracking Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}