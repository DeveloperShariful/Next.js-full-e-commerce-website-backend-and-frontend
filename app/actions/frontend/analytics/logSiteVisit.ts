// app/actions/frontend/analytics/logSiteVisit.ts
"use server";

import { db } from "@/lib/prisma";
import { cookies, headers } from "next/headers";
import { randomUUID } from "crypto";

const VISITOR_ID_COOKIE = "gb_visitor_id";
const VISITOR_ID_MAX_AGE = 365 * 24 * 60 * 60; // ১ বছর — দীর্ঘমেয়াদী anonymous visitor ID
const SESSION_LOGGED_COOKIE = "gb_visit_logged";
const SESSION_LOGGED_MAX_AGE = 30 * 60; // ৩০ মিনিট — এই window-এ একবারই log হবে (per-pageview না)

// প্রতিটা platform নিজে থেকেই তাদের লিংকে এই click ID জুড়ে দেয় — এটাই সবচেয়ে
// নির্ভরযোগ্য প্রমাণ, UTM ট্যাগ ছাড়াই কাজ করে। গুরুত্বপূর্ণ ব্যতিক্রম: fbclid শুধু
// paid ad-এর প্রমাণ না — Meta নিশ্চিত করেছে এটা organic পোস্ট/কমেন্টের লিংকেও
// যোগ হয়। তাই fbclid থাকলেই "_ads" বলা হবে না, utm_medium=paid/cpc/ads সাথে
// থাকলেই তবে "_ads" suffix যোগ হবে (নিচে INHERENTLY_PAID_PARAMS দ্রষ্টব্য)।
const CLICK_ID_PLATFORMS: Record<string, string> = {
  gclid: "google",
  dclid: "google",
  fbclid: "facebook",
  msclkid: "bing",
  ttclid: "tiktok",
  li_fat_id: "linkedin",
  epik: "pinterest",
  twclid: "twitter",
  ScCid: "snapchat",
};

// fbclid বাদে বাকি সব click-ID platform নিজেই নিশ্চিত করেছে এগুলো শুধু paid
// ad click-এই যোগ হয়, organic-এ কখনো না (gclid/dclid = Google Ads, msclkid =
// Microsoft/Bing Ads, ttclid = TikTok Ads, epik = Pinterest Ads, li_fat_id =
// LinkedIn Ads) — তাই এগুলো সবসময় নিশ্চিতভাবে "_ads" suffix পাবে। শুধু fbclid
// ব্যতিক্রম, কারণ Meta নিশ্চিত করেছে এটা organic পোস্ট/কমেন্টের লিংকেও যোগ হয়।
const INHERENTLY_PAID_PARAMS = new Set(["gclid", "dclid", "msclkid", "ttclid", "epik", "li_fat_id"]);
const PAID_MEDIUM_HINTS = new Set(["cpc", "ppc", "paid", "paid_social", "ads", "ad"]);

function classifyChannel(params: {
  utmSource?: string | null;
  utmMedium?: string | null;
  referrer: string;
  searchParams: URLSearchParams;
}): { channel: string; clickId: string | null } {
  const isPaidMedium = params.utmMedium ? PAID_MEDIUM_HINTS.has(params.utmMedium.toLowerCase()) : false;

  // ১. Ad/click platform ID — সবচেয়ে শক্তিশালী প্রমাণ
  for (const [param, platform] of Object.entries(CLICK_ID_PLATFORMS)) {
    const value = params.searchParams.get(param);
    if (value) {
      const isPaid = INHERENTLY_PAID_PARAMS.has(param) || isPaidMedium;
      return { channel: isPaid ? `${platform}_ads` : platform, clickId: `${param}=${value}` };
    }
  }

  // ২. Explicit UTM ট্যাগ
  // ★ channel normalize (trim + lowercase) করা জরুরি — নাহলে utm_source=Facebook
  // আর utm_source=facebook দুটো আলাদা চ্যানেল হিসেবে গোনা হয়ে যেত (breakdown
  // টেবিলে ডেটা ভেঙে যেত), যদিও raw utmSource ফিল্ড proof হিসেবে অপরিবর্তিতই থাকছে।
  const normalizedMedium = params.utmMedium?.trim().toLowerCase();
  const normalizedSource = params.utmSource?.trim().toLowerCase();
  if (normalizedMedium === "email" || normalizedSource === "email") {
    return { channel: "email", clickId: null };
  }
  if (normalizedSource) {
    return { channel: normalizedSource, clickId: null };
  }

  // ৩. Referrer-based fallback (organic/social, কোনো ট্যাগ ছাড়াই)
  if (params.referrer) {
    try {
      const refHost = new URL(params.referrer).hostname;
      if (refHost.includes("google.")) return { channel: "google_organic", clickId: null };
      if (refHost.includes("facebook.") || refHost.includes("fb.com")) return { channel: "facebook", clickId: null };
      if (refHost.includes("instagram.")) return { channel: "instagram", clickId: null };
      if (refHost.includes("tiktok.")) return { channel: "tiktok", clickId: null };
      if (refHost.includes("bing.")) return { channel: "bing_organic", clickId: null };
      if (refHost.includes("linkedin.")) return { channel: "linkedin", clickId: null };
      if (refHost.includes("pinterest.")) return { channel: "pinterest", clickId: null };
      if (refHost.includes("twitter.") || refHost.includes("x.com")) return { channel: "twitter", clickId: null };
      return { channel: `${refHost}_referral`, clickId: null };
    } catch {
      return { channel: "direct", clickId: null };
    }
  }

  return { channel: "direct", clickId: null };
}

export async function logSiteVisit(data: {
  url: string;
  referrer: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
}) {
  try {
    const cookieStore = await cookies();

    // এক সেশনে একবারই row তৈরি হবে — প্রতিটা page view-এ না (performance)
    if (cookieStore.get(SESSION_LOGGED_COOKIE)) {
      return { success: true, skipped: true };
    }

    let visitorId = cookieStore.get(VISITOR_ID_COOKIE)?.value;
    if (!visitorId) {
      visitorId = randomUUID();
      cookieStore.set(VISITOR_ID_COOKIE, visitorId, {
        maxAge: VISITOR_ID_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
    }

    const headerList = await headers();
    const userAgent = headerList.get("user-agent") || "";
    // Vercel নিজে থেকেই এই header পাঠায় (production-এ, কোনো proxy/CDN সামনে না
    // থাকলে) — কোনো external geo-lookup লাগে না। x-vercel-ip-country ISO 3166-1
    // দুই-অক্ষরের কোড (যেমন "AU")। x-vercel-ip-city RFC3986 অনুযায়ী
    // percent-encoded আসে (non-ASCII শহরের নামের জন্য) — decode না করলে raw
    // "%C3%A9"-জাতীয় string DB-তে সেভ হয়ে যাবে, তাই এখানে decode করা হচ্ছে।
    const rawCity = headerList.get("x-vercel-ip-city");
    let city: string | null = null;
    if (rawCity) {
      try {
        city = decodeURIComponent(rawCity);
      } catch {
        city = rawCity;
      }
    }
    const country = headerList.get("x-vercel-ip-country") || null;

    let searchParams: URLSearchParams;
    try {
      searchParams = new URL(data.url).searchParams;
    } catch {
      searchParams = new URLSearchParams();
    }

    const { channel, clickId } = classifyChannel({
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      referrer: data.referrer,
      searchParams,
    });

    await db.siteVisit.create({
      data: {
        visitorId,
        landingPage: data.url,
        referrer: data.referrer || null,
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
        utmCampaign: data.utmCampaign || null,
        utmContent: data.utmContent || null,
        utmTerm: data.utmTerm || null,
        channel,
        clickId,
        country,
        city,
        deviceType: /mobile/i.test(userAgent) ? "mobile" : "desktop",
      },
    });

    cookieStore.set(SESSION_LOGGED_COOKIE, "1", {
      maxAge: SESSION_LOGGED_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return { success: true, skipped: false };
  } catch (error) {
    console.error("[logSiteVisit] Error:", error);
    return { success: false };
  }
}
