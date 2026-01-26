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

  // ১. লিংক খুঁজে বের করা
  const link = await db.affiliateLink.findUnique({
    where: { slug },
    include: { affiliate: true }
  });

  if (!link) {
    return NextResponse.redirect(new URL("/", request.url)); // লিংক না পেলে হোমপেজে
  }

  // ২. ক্লিক কাউন্ট বাড়ানো (ডাটাবেস আপডেট)
  // এটি ব্যাকগ্রাউন্ডে করা ভালো যাতে রিডাইরেক্ট স্লো না হয়
  await db.affiliateLink.update({
    where: { id: link.id },
    data: { clickCount: { increment: 1 } }
  });

  // ৩. ট্র্যাকিং কুকি সেট করার জন্য URL এ ?ref= প্যারামিটার যোগ করা
  // যাতে আমাদের Middleware এবং Tracking System এটাকে ধরতে পারে
  const destinationUrl = new URL(link.destinationUrl);
  destinationUrl.searchParams.set("ref", link.affiliate.slug);

  // ৪. রিডাইরেক্ট
  return NextResponse.redirect(destinationUrl);
}