// app/actions/storefront/affiliate/trackVisitAction.ts
"use server";

import { db } from "@/lib/prisma";
import { cookies, headers } from "next/headers";
import { revalidateTag } from "next/cache";

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
    // à§§. à¦­à¦¿à¦¸à¦¿à¦Ÿà¦° à¦¸à§‹à¦°à§à¦¸ à¦¡à¦¿à¦Ÿà§‡à¦•à¦¶à¦¨ (à¦¸à¦°à¦¾à¦¸à¦°à¦¿ à¦¸à¦¾à¦°à§à¦­à¦¾à¦°à§‡)
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

    // à¦­à¦¿à¦¸à¦¿à¦Ÿà¦° à¦¸à§‹à¦°à§à¦¸ à¦•à§à¦•à¦¿à¦¤à§‡ à¦¸à§‡à¦­ à¦•à¦°à¦¾ (HttpOnly - à¦¹à§à¦¯à¦¾à¦• à¦ªà§à¦°à§à¦«)
    if (!cookieStore.get("visitor_source")) {
      cookieStore.set("visitor_source", source, { 
        maxAge: 60 * 60 * 24 * 30, // à§©à§¦ à¦¦à¦¿à¦¨
        httpOnly: true, 
        secure: true, 
        path: "/" 
      });
    }

    // ---------------------------------------------------------
    // à§¨. à¦…à§à¦¯à¦¾à¦«à¦¿à¦²à¦¿à¦¯à¦¼à§‡à¦Ÿ à¦Ÿà§à¦°à§à¦¯à¦¾à¦•à¦¿à¦‚ à¦²à¦œà¦¿à¦•
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

        revalidateTag(`affiliate-stats-${affiliate.id}`, "default");

        // à¦…à¦¤à§à¦¯à¦¨à§à¦¤ à¦¸à¦¿à¦•à¦¿à¦‰à¦° à¦•à§à¦•à¦¿ à¦¸à§‡à¦Ÿ (Server-side)
        const expiry = (affiliate.cookieDuration || 30) * 24 * 60 * 60;
        const isSecure = process.env.NODE_ENV === "production";
        cookieStore.set("solid_affiliate_id", affiliate.id, { maxAge: expiry, httpOnly: true, secure: isSecure, path: "/" });
        cookieStore.set("solid_affiliate_visit_id", click.id, { maxAge: expiry, httpOnly: true, secure: isSecure, path: "/" });
      }
    }

    // ---------------------------------------------------------
    // à§©. à¦ªà§‡à¦œ à¦­à¦¿à¦‰ à¦Ÿà§à¦°à§à¦¯à¦¾à¦•à¦¿à¦‚ (à¦¡à¦¾à¦Ÿà¦¾à¦¬à§‡à¦œ à¦“ à¦•à§à¦•à¦¿ à¦¸à¦¿à¦™à§à¦•)
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

