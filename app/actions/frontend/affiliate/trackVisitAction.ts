// app/actions/storefront/affiliate/trackVisitAction.ts
"use server";

import { db } from "@/lib/prisma";
import { cookies, headers } from "next/headers";

export async function trackVisitAction(data: {
  affiliateSlug?: string | null;
  url: string;
  referrer: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}) {
  try {
    const headerList = await headers();
    const userAgent = headerList.get("user-agent") || "";
    const ipAddress = headerList.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const cookieStore = await cookies();

    // ---------------------------------------------------------
    // ১. ভিসিটর সোর্স ডিটেকশন (সরাসরি সার্ভারে)
    // ---------------------------------------------------------
    let source = "direct";
    if (data.utmSource) {
      source = data.utmSource;
    } else if (data.referrer) {
      try {
        const refHost = new URL(data.referrer).hostname;
        if (refHost.includes("google.")) source = "google_organic";
        else if (refHost.includes("facebook.") || refHost.includes("fb.com")) source = "facebook";
        else if (refHost.includes("instagram.")) source = "instagram";
        else if (refHost.includes("bing.")) source = "bing_organic";
        else source = `${refHost}_referral`;
      } catch (e) {
        source = "unknown";
      }
    }

    // ভিসিটর সোর্স কুকিতে সেভ করা (HttpOnly - হ্যাক প্রুফ)
    if (!cookieStore.get("visitor_source")) {
      cookieStore.set("visitor_source", source, { 
        maxAge: 60 * 60 * 24 * 30, // ৩০ দিন
        httpOnly: true, 
        secure: true, 
        path: "/" 
      });
    }

    // ---------------------------------------------------------
    // ২. অ্যাফিলিয়েট ট্র্যাকিং লজিক
    // ---------------------------------------------------------
    if (data.affiliateSlug) {
      const affiliate = await db.affiliateAccount.findFirst({
        where: {
          OR: [{ slug: data.affiliateSlug }, { customSlug: data.affiliateSlug }],
          status: "ACTIVE",
        },
        select: { id: true, cookieDuration: true }
      });

      if (affiliate) {
        // ক্লিক রেকর্ড তৈরি
        const click = await db.affiliateClick.create({
          data: {
            affiliateId: affiliate.id,
            ipAddress,
            userAgent,
            referrer: data.referrer,
            landingPage: data.url,
            utmSource: data.utmSource,
            utmMedium: data.utmMedium,
            utmCampaign: data.utmCampaign,
            deviceType: /mobile/i.test(userAgent) ? "mobile" : "desktop",
          }
        });

        // অত্যন্ত সিকিউর কুকি সেট (Server-side)
        const expiry = (affiliate.cookieDuration || 30) * 24 * 60 * 60;
        cookieStore.set("solid_affiliate_id", affiliate.id, { maxAge: expiry, httpOnly: true, secure: true, path: "/" });
        cookieStore.set("solid_affiliate_visit_id", click.id, { maxAge: expiry, httpOnly: true, secure: true, path: "/" });
      }
    }

    // ---------------------------------------------------------
    // ৩. পেজ ভিউ ট্র্যাকিং (ডাটাবেজ ও কুকি সিঙ্ক)
    // ---------------------------------------------------------
    const currentViews = parseInt(cookieStore.get("visitor_page_views")?.value || "0");
    const newViews = currentViews + 1;
    cookieStore.set("visitor_page_views", newViews.toString(), { httpOnly: true, secure: true, path: "/" });

    return { success: true, source, views: newViews };
  } catch (error) {
    console.error("[trackVisitAction] Error:", error);
    return { success: false, error: "Tracking failed" };
  }
}