//File: app/(backend)/admin/visitors/_components/setup-guide.tsx

"use client";

import React, { useState } from "react";
import { CheckCircle2, Wrench, Link2, Eye, Languages, MapPin } from "lucide-react";

type Lang = "en" | "bn";
type T = { en: string; bn: string };

function pick(t: T, lang: Lang): string {
  return t[lang];
}

const INTRO: T = {
  en: "When a visitor lands on the site, we figure out where they came from (Facebook, Google, TikTok, Email, etc.) in three steps — first any “click ID” the platform itself attaches to the link (e.g. Google Ads’ gclid), then utm_source/utm_medium tags in the URL, and finally the browser’s referrer. Platforms that send their own click ID need nothing from you — the rest need the setup below.",
  bn: "একজন visitor ওয়েবসাইটে এলে সে কোথা থেকে এসেছে (Facebook, Google, TikTok, Email ইত্যাদি) সেটা তিনভাবে ধরা হয় — প্রতিটা platform নিজে যে “click ID” লিংকে জুড়ে দেয় (যেমন Google Ads-এর gclid), তারপর URL-এ থাকা utm_source/utm_medium ট্যাগ, আর শেষে browser-এর পাঠানো referrer। যেসব platform নিজে থেকেই click ID পাঠায়, সেগুলোর জন্য কিছু করার দরকার নেই — বাকিগুলোর জন্য নিচের setup করতে হবে।",
};

const AUTO_TITLE: T = { en: "Works automatically — nothing to set up", bn: "এমনিতেই কাজ করছে — কিছু করার দরকার নেই" };

const AUTO_ITEMS: { title: T; desc: T }[] = [
  {
    title: { en: "Google Ads", bn: "Google Ads" },
    desc: {
      en: "Google attaches gclid to every ad click by itself — organic search never has it.",
      bn: "প্রতিটা ad click-এ Google নিজেই gclid জুড়ে দেয়, organic search-এ কখনো এটা আসে না।",
    },
  },
  {
    title: { en: "Google / Bing Organic Search", bn: "Google / Bing Organic Search" },
    desc: {
      en: "Detected from the referrer when someone searches and lands on the site.",
      bn: "কেউ সার্চ করে ওয়েবসাইটে এলে referrer থেকেই ধরা হয়ে যায়।",
    },
  },
  {
    title: { en: "Facebook / Instagram (organic posts AND paid ads — both)", bn: "Facebook / Instagram (organic পোস্ট এবং paid ad — দুটোই)" },
    desc: {
      en: "Meta attaches fbclid to every link, organic or ad — no exceptions.",
      bn: "Meta প্রতিটা লিংকেই fbclid জুড়ে দেয়, organic হোক বা ad হোক।",
    },
  },
  {
    title: { en: "TikTok Ads / Pinterest Ads / LinkedIn Ads / Microsoft (Bing) Ads", bn: "TikTok Ads / Pinterest Ads / LinkedIn Ads / Microsoft (Bing) Ads" },
    desc: {
      en: "Each has its own click ID (ttclid, epik, li_fat_id, msclkid) — only added on paid ad clicks.",
      bn: "এই চারটার নিজস্ব click ID (ttclid, epik, li_fat_id, msclkid) আছে, শুধু paid ad-এই এগুলো যোগ হয়।",
    },
  },
  {
    title: { en: "Google Shopping (free/organic listing, via Merchant Center)", bn: "Google Shopping (free/organic listing, Merchant Center-এর মাধ্যমে)" },
    desc: {
      en: "Google attaches srsltid to free product-listing clicks — shown as its own “google_shopping” channel, separate from regular organic search.",
      bn: "Free product-listing click-এ Google নিজেই srsltid জুড়ে দেয় — নিয়মিত organic search থেকে আলাদা করে “google_shopping” নামে দেখানো হয়।",
    },
  },
  {
    title: { en: "Country / City", bn: "Country / City" },
    desc: {
      en: "Read directly from Vercel’s x-vercel-ip-country / x-vercel-ip-city headers on the live (production) site — no extra lookup. Two caveats: it only appears on a real Vercel deployment (always blank on localhost), and it stops working if a proxy/CDN (e.g. Cloudflare) sits in front of Vercel.",
      bn: "লাইভ (production) সাইটে Vercel-এর x-vercel-ip-country / x-vercel-ip-city header থেকে সরাসরি পড়া হয় — আলাদা কোনো lookup লাগে না। দুটো শর্ত: শুধু আসল Vercel deployment-এ কাজ করে (localhost-এ সবসময় খালি থাকবে), আর Vercel-এর সামনে কোনো proxy/CDN (যেমন Cloudflare) থাকলে কাজ করবে না।",
    },
  },
];

const MANUAL_TITLE: T = { en: "Needs manual setup", bn: "ম্যানুয়াল সেটআপ লাগবে" };
const MANUAL_INTRO: T = {
  en: "The places below have no click ID, and the app’s own in-app browser often doesn’t send a referrer either — so without a UTM tag these can wrongly show up as “Direct.”",
  bn: "নিচের জায়গাগুলোয় কোনো click ID পাওয়া যায় না, আর অনেক সময় app-এর নিজস্ব browser referrer-ও পাঠায় না — তাই UTM ট্যাগ ছাড়া এগুলো ভুলভাবে “Direct” হিসেবে দেখাতে পারে।",
};

const MANUAL_ITEMS: { title: T; code?: string; note?: T; sub?: T }[] = [
  {
    title: { en: "TikTok bio link (organic — the link on your video/profile)", bn: "TikTok bio link (organic — video/profile-এর লিংক)" },
    code: "https://gobike.com.au?utm_source=tiktok&utm_medium=social&utm_campaign=bio_link",
  },
  {
    title: { en: "Pinterest or LinkedIn organic post/profile link", bn: "Pinterest বা LinkedIn organic পোস্ট/প্রোফাইল লিংক" },
    code: "https://gobike.com.au?utm_source=pinterest&utm_medium=social&utm_campaign=profile_link",
  },
  {
    title: { en: "Email (Klaviyo campaign / flow)", bn: "Email (Klaviyo campaign / flow)" },
    note: {
      en: "Klaviyo has a built-in setting to auto-add UTM tags — turn it on once and every email gets tagged automatically.",
      bn: "Klaviyo-তে নিজে থেকে UTM যোগ করে দেওয়ার option আছে — একবার অন করলে প্রতিটা email-এ automatic যোগ হয়ে যাবে।",
    },
    sub: { en: "Klaviyo → Settings → Email → UTM Parameters → turn on", bn: "Klaviyo → Settings → Email → UTM Parameters → চালু করো" },
  },
];

const UTM_TITLE: T = { en: "How to build your own UTM link", bn: "নিজে UTM link কিভাবে বানাবে" };
const UTM_EXAMPLE = "https://gobike.com.au/bikes?utm_source=facebook&utm_medium=paid_social&utm_campaign=summer_sale&utm_content=blue_banner&utm_term=kids+electric+bike";
const UTM_PARAMS: { k: string; v: T }[] = [
  { k: "utm_source", v: { en: "Which platform it came from — facebook, tiktok, pinterest, etc.", bn: "কোন platform থেকে আসছে — facebook, tiktok, pinterest ইত্যাদি" } },
  { k: "utm_medium", v: { en: "What type of traffic — social, paid_social, email, cpc", bn: "কোন ধরনের ট্রাফিক — social, paid_social, email, cpc" } },
  { k: "utm_campaign", v: { en: "Which campaign/promotion — summer_sale, bio_link", bn: "কোন campaign/promotion-এর জন্য — summer_sale, bio_link" } },
  { k: "utm_content", v: { en: "Which specific ad creative/banner in the same campaign (useful for A/B tests)", bn: "একই campaign-এর কোন নির্দিষ্ট ad creative/banner (A/B টেস্টে কাজে লাগে)" } },
  { k: "utm_term", v: { en: "Which keyword the click came from, for paid search", bn: "paid search হলে কোন keyword-এ ক্লিক পড়েছে" } },
];

const PROOF_TITLE: T = { en: "Where to see the proof", bn: "প্রমাণ কোথায় দেখবে" };
const PROOF_TEXT: T = {
  en: "Go to the “Recent Visitors” tab and click any visitor to see the raw proof of exactly what referrer, click ID, or UTM tag they arrived with — no guessing, it shows exactly what the browser sent.",
  bn: "“Recent Visitors” ট্যাবে গিয়ে যেকোনো visitor-এ ক্লিক করলে সেই visitor আসলেই কোন referrer, কোন click ID, বা কোন UTM ট্যাগ নিয়ে এসেছিল তার raw প্রমাণ দেখা যাবে — কোনো অনুমান নেই, ব্রাউজার যা পাঠিয়েছে ঠিক তাই দেখানো হয়।",
};

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="border border-[#c3c4c7] shadow-sm rounded-sm overflow-hidden bg-white mb-6">
      <div className="p-4 border-b border-[#c3c4c7] bg-[#f8f9f9] flex items-center gap-2">
        {icon}
        <span className="text-[13px] font-semibold text-[#1d2327]">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="block sm:inline-block bg-[#f6f7f7] border border-[#f0f0f1] rounded-sm px-2 py-1 text-[12px] font-mono text-[#2c3338] break-all">
      {children}
    </code>
  );
}

export default function SetupGuide() {
  const [lang, setLang] = useState<Lang>("en");
  const t = (x: T) => pick(x, lang);

  return (
    <div className="max-w-[820px]">
      <div className="flex justify-end mb-4">
        <div className="inline-flex border border-[#c3c4c7] rounded-sm overflow-hidden bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`px-3 py-1.5 text-[12px] font-medium flex items-center gap-1.5 transition-colors ${
              lang === "en" ? "bg-[#2271b1] text-white" : "text-[#50575e] hover:bg-[#f6f7f7]"
            }`}
          >
            <Languages size={13} /> English
          </button>
          <button
            type="button"
            onClick={() => setLang("bn")}
            className={`px-3 py-1.5 text-[12px] font-medium border-l border-[#c3c4c7] transition-colors ${
              lang === "bn" ? "bg-[#2271b1] text-white" : "text-[#50575e] hover:bg-[#f6f7f7]"
            }`}
          >
            বাংলা
          </button>
        </div>
      </div>

      <p className="text-[13px] text-[#50575e] mb-6 leading-relaxed">{t(INTRO)}</p>

      <Card icon={<CheckCircle2 size={16} className="text-[#00a32a]" />} title={t(AUTO_TITLE)}>
        <ul className="text-[13px] text-[#2c3338] space-y-2 list-disc pl-5">
          {AUTO_ITEMS.map((item) => (
            <li key={item.title.en}>
              <strong>{t(item.title)}</strong> — {t(item.desc)}
            </li>
          ))}
        </ul>
      </Card>

      <Card icon={<Wrench size={16} className="text-[#996800]" />} title={t(MANUAL_TITLE)}>
        <p className="text-[13px] text-[#2c3338] mb-4 leading-relaxed">{t(MANUAL_INTRO)}</p>
        <ul className="text-[13px] text-[#2c3338] space-y-4">
          {MANUAL_ITEMS.map((item) => (
            <li key={item.title.en}>
              <strong>{t(item.title)}</strong>
              {item.code ? <div className="mt-1.5"><Code>{item.code}</Code></div> : null}
              {item.note ? <p className="text-[12px] text-[#646970] mt-1 mb-1.5">{t(item.note)}</p> : null}
              {item.sub ? <span className="text-[12px] text-[#2c3338]">{t(item.sub)}</span> : null}
            </li>
          ))}
        </ul>
      </Card>

      <Card icon={<Link2 size={16} className="text-[#2271b1]" />} title={t(UTM_TITLE)}>
        <div className="mb-3">
          <Code>{UTM_EXAMPLE}</Code>
        </div>
        <table className="w-full text-left border-collapse mt-3">
          <tbody>
            {UTM_PARAMS.map((row) => (
              <tr key={row.k} className="border-b border-[#f0f0f1] last:border-b-0">
                <td className="py-2 pr-4 text-[12px] font-mono text-[#2271b1] align-top whitespace-nowrap">{row.k}</td>
                <td className="py-2 text-[13px] text-[#2c3338]">{t(row.v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card icon={<Eye size={16} className="text-[#2271b1]" />} title={t(PROOF_TITLE)}>
        <p className="text-[13px] text-[#2c3338] leading-relaxed">{t(PROOF_TEXT)}</p>
      </Card>

      <Card icon={<MapPin size={16} className="text-[#2271b1]" />} title={lang === "en" ? "Country / City accuracy note" : "Country / City নির্ভুলতা সম্পর্কে"}>
        <p className="text-[13px] text-[#2c3338] leading-relaxed">
          {lang === "en"
            ? "IP-based location is Vercel’s own best estimate from the visitor’s public IP address — it can be off for VPN/proxy users, and mobile carriers sometimes route through a different city/region than the visitor is actually in. Treat it as a general reference, not a precise locator."
            : "IP-ভিত্তিক location Vercel-এর নিজের best-estimate, visitor-এর public IP address থেকে বের করা — VPN/proxy ব্যবহারকারীদের জন্য ভুল হতে পারে, আর mobile carrier অনেক সময় ভিন্ন city/region দিয়ে route করে। এটাকে সাধারণ ধারণা হিসেবে ধরো, নিখুঁত অবস্থান হিসেবে না।"}
        </p>
      </Card>
    </div>
  );
}
