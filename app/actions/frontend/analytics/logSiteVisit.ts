// app/actions/frontend/analytics/logSiteVisit.ts
"use server";

import { db } from "@/lib/prisma";
import { cookies, headers } from "next/headers";
import { randomUUID } from "crypto";

const VISITOR_ID_COOKIE = "gb_visitor_id";
const VISITOR_ID_MAX_AGE = 365 * 24 * 60 * 60; // ১ বছর — দীর্ঘমেয়াদী anonymous visitor ID
const SESSION_LOGGED_COOKIE = "gb_visit_logged";
const SESSION_LOGGED_MAX_AGE = 30 * 60; // ৩০ মিনিট — এই window-এ একবারই log হবে (per-pageview না)

// "ভদ্র" bot/crawler-রা নিজেই User-Agent-এ পরিচয় দিয়ে দেয় (Googlebot,
// AhrefsBot, headless browser দিয়ে চলা AI scraper ইত্যাদি) — কোনো real
// browser এই শব্দগুলো নিজের UA-তে রাখে না, তাই false-positive (আসল visitor
// বাদ পড়া) হওয়ার ঝুঁকি প্রায় শূন্য। যারা ইচ্ছাকৃতভাবে নিজেকে লুকিয়ে normal
// browser UA নকল করে, তাদের এভাবে ধরা যাবে না — এটা সব bot না, শুধু "নিজে
// পরিচয় দেওয়া" bot-গুলো বাদ দেয়।
const BOT_UA_PATTERN =
  /bot|crawl|spider|slurp|mediapartners|facebookexternalhit|whatsapp|telegrambot|discordbot|slackbot|pinterest(?:bot)?|redditbot|applebot|bytespider|gptbot|chatgpt-user|ccbot|claudebot|anthropic-ai|perplexitybot|python-requests|curl\/|wget|go-http-client|headlesschrome|phantomjs|selenium|puppeteer|playwright/i;

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

// ChatGPT/Gemini/Perplexity ইত্যাদি AI assistant থেকে কেউ লিংকে ক্লিক করে এলে
// GA4 (মে ২০২৬ থেকে) এটাকে আলাদা "AI Assistants" channel হিসেবে ধরে, সাধারণ
// referral বা google_organic-এর সাথে মিশিয়ে ফেলে না — এখানেও একই ভাবে আলাদা করা হচ্ছে।
const AI_ASSISTANT_HOSTS = [
  "chatgpt.com",
  "openai.com",
  "gemini.google.com",
  "perplexity.ai",
  "claude.ai",
  "copilot.microsoft.com",
  "deepseek.com",
  "grok.com",
  "x.ai",
];

function classifyChannel(params: {
  utmSource?: string | null;
  utmMedium?: string | null;
  referrer: string;
  searchParams: URLSearchParams;
}): { channel: string; clickId: string | null } {
  const isPaidMedium = params.utmMedium ? PAID_MEDIUM_HINTS.has(params.utmMedium.toLowerCase()) : false;
  // ★ channel normalize (trim + lowercase) করা জরুরি — নাহলে utm_source=Facebook
  // আর utm_source=facebook দুটো আলাদা চ্যানেল হিসেবে গোনা হয়ে যেত (breakdown
  // টেবিলে ডেটা ভেঙে যেত), যদিও raw utmSource ফিল্ড proof হিসেবে অপরিবর্তিতই থাকছে।
  const normalizedMedium = params.utmMedium?.trim().toLowerCase();
  const normalizedSource = params.utmSource?.trim().toLowerCase();

  // gclid/dclid (Google Ads paid click) সবসময় srsltid-এর আগে চেক করতে হবে।
  // কোনো source-ই ১০০% নিশ্চিত করে বলে না যে একই ক্লিকে দুটো কখনো একসাথে আসে
  // না — তাই ঝুঁকি এড়াতে gclid-কে আগে প্রাধান্য দেওয়া হচ্ছে, যাতে ভুলবশত কোনো
  // paid Google Shopping ad click ভুলভাবে "google_organic_shopping" হয়ে না যায়।
  const gclid = params.searchParams.get("gclid") || params.searchParams.get("dclid");
  if (gclid) {
    return { channel: "google_ads", clickId: `gclid=${gclid}` };
  }

  // srsltid = Google Merchant Center-এর নিজস্ব click ID, free/organic listing-এ
  // ক্লিক করলেই যোগ হয় (gclid-এর মতো paid Ads-এ না) — তাই এটা সবসময় organic।
  // আগস্ট ২০২৪ থেকে Google নিজেই "Shopping tab" আর সাধারণ "organic search"-এর
  // সীমারেখা ঝাপসা করে দিয়েছে (দুটোতেই এই একই ট্যাগ ব্যবহার করে) — তাই একটাই
  // চ্যানেল নামে দুটো তথ্যই রাখা হচ্ছে: এটা organic (paid না), আর Merchant
  // Center/Shopping feed থেকেই এসেছে।
  const srsltid = params.searchParams.get("srsltid");
  if (srsltid) {
    return { channel: "google_organic_shopping", clickId: `srsltid=${srsltid}` };
  }

  // ১. বাকি Ad/click platform ID (gclid/dclid ইতিমধ্যে উপরে হ্যান্ডেল হয়ে গেছে)
  for (const [param, platform] of Object.entries(CLICK_ID_PLATFORMS)) {
    const value = params.searchParams.get(param);
    if (value) {
      const isPaid = INHERENTLY_PAID_PARAMS.has(param) || isPaidMedium;
      // fbclid Facebook আর Instagram দুটোতেই যোগ হয় (একই Meta click ID) — কিন্তু
      // utm_source=ig/instagram স্পষ্টভাবে বলে দিলে generic "facebook"-এর বদলে
      // সেই বেশি নির্দিষ্ট নামটাই দেখানো হচ্ছে, যাতে utm_source আর Channel
      // একে অপরের বিপরীত না দেখায়।
      let resolvedPlatform = platform;
      if (param === "fbclid" && (normalizedSource === "ig" || normalizedSource === "instagram")) {
        resolvedPlatform = "instagram";
      }
      return { channel: isPaid ? `${resolvedPlatform}_ads` : resolvedPlatform, clickId: `${param}=${value}` };
    }
  }

  // ২. Explicit UTM ট্যাগ
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
      // AI assistant (ChatGPT, Gemini, Perplexity ইত্যাদি) চেক আগে করতে হবে,
      // "google." চেকের আগে — কারণ gemini.google.com-এ "google." থাকে, তাই ওই
      // চেকটা আগে থাকলে Gemini থেকে আসা visitor ভুলভাবে google_organic হয়ে
      // যেত। GA4-ও ২০২৬ সাল থেকে এটাকে আলাদা "AI Assistants" channel হিসেবে ধরে।
      if (AI_ASSISTANT_HOSTS.some((host) => refHost.includes(host))) {
        return { channel: "ai_assistant", clickId: null };
      }
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
    const headerList = await headers();
    const userAgent = headerList.get("user-agent") || "";

    // Googlebot/AhrefsBot/headless-browser AI scraper ইত্যাদি নিজে পরিচয়
    // দিলেই বাদ — কোনো visitorId cookie ইস্যু হবে না, কোনো row-ও তৈরি হবে না।
    // এতে Total Visitors/channel/country সংখ্যা আসল মানুষের ডেটা দিয়েই থাকে।
    if (BOT_UA_PATTERN.test(userAgent)) {
      return { success: true, skipped: true, isBot: true };
    }

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

    // Vercel নিজেই এই header বাইরে থেকে আসা মান বাতিল করে overwrite করে দেয়
    // (spoof-proof) — client নিজে fake IP পাঠাতে পারবে না। একাধিক মান কমা
    // দিয়ে থাকলে প্রথমটাই আসল client IP (বাকিগুলো proxy chain হলে)।
    const rawForwardedFor = headerList.get("x-forwarded-for");
    const ipAddress = rawForwardedFor ? rawForwardedFor.split(",")[0].trim() || null : null;

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

    const newVisit = await db.siteVisit.create({
      data: {
        visitorId,
        landingPage: data.url,
        referrer: data.referrer || null,
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
        utmCampaign: data.utmCampaign || null,
        utmContent: data.utmContent || null,
        utmTerm: data.utmTerm || null,
        ipAddress,
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

    return { success: true, skipped: false, visitId: newVisit.id };
  } catch (error) {
    console.error("[logSiteVisit] Error:", error);
    return { success: false };
  }
}

// checkout পেজ লোড হলে একবার কল হয় — order বসাক বা না বসাক, স্বতন্ত্র সিগন্যাল
// হিসেবে ধরে রাখা হচ্ছে (order placement আলাদাভাবে visitorId দিয়ে ট্র্যাক হয়)।
// একই row-এ শুধু একটা flag আপডেট — নতুন row তৈরি হয় না, তাই সস্তা।
export async function markCheckoutReached(visitId: string) {
  try {
    await db.siteVisit.update({ where: { id: visitId }, data: { reachedCheckout: true } });
  } catch {
    // পুরনো/ভুল visitId হলে নীরবে ignore — fire-and-forget কল, ব্যবহারকারী কিছু দেখবে না
  }
}
