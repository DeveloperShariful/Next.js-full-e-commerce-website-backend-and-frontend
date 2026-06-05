// app/api/tracking/pixels/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { z } from "zod";

// ✅ FIXED: Schema to validate the JSON data from DB
const pixelJsonSchema = z.object({
  id: z.string(),
  type: z.string(),
  pixelId: z.string(),
  enabled: z.boolean(),
  createdAt: z.string().optional()
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const affiliateId = searchParams.get("affiliateId");

    if (!affiliateId) {
      return NextResponse.json({ pixels: [] });
    }

    // ✅ FIXED: Fetch the pixels JSON array directly from the AffiliateAccount table
    const affiliate = await db.affiliateAccount.findUnique({
      where: { id: affiliateId },
      select: { pixels: true }
    });

    if (!affiliate || !affiliate.pixels) {
      return NextResponse.json({ pixels: [] });
    }

    // Safely parse the JSON data
    const parsedPixels = z.array(pixelJsonSchema).safeParse(affiliate.pixels);
    
    if (!parsedPixels.success) {
      return NextResponse.json({ pixels: [] });
    }

    // ✅ Filter only active pixels and map exactly as before
    const activePixels = parsedPixels.data
      .filter((p) => p.enabled === true)
      .map((p) => ({
        id: p.id,
        type: p.type,
        pixelId: p.pixelId,
      }));

    return NextResponse.json({ pixels: activePixels });

  } catch (error) {
    console.error("Pixel Fetch Error:", error);
    return NextResponse.json({ pixels: [] }, { status: 500 });
  }
}