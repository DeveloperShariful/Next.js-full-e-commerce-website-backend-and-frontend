//app/api/tracking/pixels/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const affiliateId = searchParams.get("affiliateId");

    if (!affiliateId) {
      return NextResponse.json({ pixels: [] });
    }

    // ১. একটিভ পিক্সেল খুঁজে বের করা
    const pixels = await db.affiliatePixel.findMany({
      where: {
        affiliateId: affiliateId,
        isEnabled: true, // শুধুমাত্র এনাবল করা পিক্সেল
      },
      select: {
        id: true,
        type: true,
        pixelId: true,
      },
    });

    return NextResponse.json({ pixels });

  } catch (error) {
    console.error("Pixel Fetch Error:", error);
    return NextResponse.json({ pixels: [] }, { status: 500 });
  }
}