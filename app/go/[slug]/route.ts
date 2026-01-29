//app/go/[slug]/route.ts

import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> } 
) {
  const slug = (await params).slug;

  if (!slug) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const link = await db.affiliateLink.findUnique({
    where: { slug },
    include: { affiliate: true }
  });

  if (!link) {
    return NextResponse.redirect(new URL("/", request.url)); 
  }

  await db.affiliateLink.update({
    where: { id: link.id },
    data: { clickCount: { increment: 1 } }
  });

  const destinationUrl = new URL(link.destinationUrl);
  destinationUrl.searchParams.set("ref", link.affiliate.slug);

  return NextResponse.redirect(destinationUrl);
}