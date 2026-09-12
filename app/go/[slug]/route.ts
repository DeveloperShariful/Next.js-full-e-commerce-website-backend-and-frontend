//app/go/[slug]/route.ts

import { db } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getCachedAffiliateSettings } from "@/lib/global-settings-cache";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const slug = (await params).slug;
  const home = new URL("/", request.url);

  if (!slug) return NextResponse.redirect(home);

  const link = await db.affiliateLink.findUnique({
    where: { slug },
    select: {
      id: true,
      destinationUrl: true,
      affiliate: { select: { id: true, slug: true, cookieDuration: true } }
    }
  });

  if (!link) return NextResponse.redirect(home);

  const ua = request.headers.get("user-agent") || "";
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";

  // FIX: আগে এখানে কোনো dedup ছিল না — একই short link বারবার ক্লিক করলে
  // (বুকমার্ক, লিংক-প্রিভিউ বট, বারবার শেয়ার করা একই পোস্টে ক্লিক) প্রতিবার
  // নতুন AffiliateClick + clickCount বাড়তো। trackVisitAction.ts/
  // /api/tracking/click-এর একই admin-configurable dedup window এখানেও
  // বসানো হলো — সাম্প্রতিক click থাকলে নতুন row/counter-increment ছাড়াই
  // সেই click পুনরায় ব্যবহার হবে, শুধু cookie রিফ্রেশ হবে।
  const { clickDedupWindowMinutes } = await getCachedAffiliateSettings();
  const dedupWindowMs = (clickDedupWindowMinutes ?? 1) * 60 * 1000;

  const recentClick = await db.affiliateClick.findFirst({
    where: {
      affiliateId: link.affiliate.id,
      ipAddress: ip,
      createdAt: { gte: new Date(Date.now() - dedupWindowMs) },
    },
    orderBy: { createdAt: "desc" },
  });

  let click = recentClick;
  if (!click) {
    [click] = await Promise.all([
      db.affiliateClick.create({
        data: {
          affiliateId: link.affiliate.id,
          ipAddress: ip,
          userAgent: ua,
          referrer: request.headers.get("referer") || "",
          landingPage: link.destinationUrl,
          deviceType: /mobile/i.test(ua) ? "mobile" : "desktop",
        }
      }),
      db.affiliateLink.update({
        where: { id: link.id },
        data: { clickCount: { increment: 1 } }
      })
    ]);
  }

  const destination = new URL(link.destinationUrl);
  const response = NextResponse.redirect(destination);

  // Set affiliate attribution cookies on the redirect response (server-side — reliable)
  const maxAge = (link.affiliate.cookieDuration || 30) * 24 * 60 * 60;
  response.cookies.set("solid_affiliate_id", link.affiliate.id, { maxAge, httpOnly: true, secure: true, path: "/" });
  response.cookies.set("solid_affiliate_visit_id", click.id, { maxAge, httpOnly: true, secure: true, path: "/" });

  return response;
}