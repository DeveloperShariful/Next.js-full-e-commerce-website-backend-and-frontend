// lib/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";

// ==========================================================================
// 🚀 MULTI-ACCOUNT FALLBACK (2026-09-01)
// একটা Cloudinary free-plan account-এর মাসিক credit limit (25) শেষ হয়ে গেলে
// এতদিন প্রতিটা আপলোড সরাসরি Vercel Blob-এ fallback হয়ে যেত (codec/HEIC
// transcoding-এর সুবিধা ছাড়াই)। এখন এর বদলে ২-৩টা আলাদা Cloudinary account
// ঘুরিয়ে ব্যবহার করা হয় — সবগুলো শেষ হলে তবেই Vercel Blob fallback আসে।
// প্রতিটা account-এর পুরো delivery URL-ই (নিজের cloud_name সহ) DB-তে সেভ হয়,
// তাই কোন ফাইল কোন account-এ আছে সেটা URL নিজেই বহন করে — কোনো নতুন DB
// column/migration লাগে না।
// ==========================================================================

export interface CloudinaryAccount {
  index: number;
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

// Account 0 (dbij2wehz, shown as "Cloudinary 1" in the admin dashboard) was
// removed from this list (2026-09-03) — it hit its free-plan quota (157%)
// and everything actually referenced by the live site has since been
// migrated to Hostinger (verified: 0 Media rows still point at it). Nothing
// stored there was deleted, it's just no longer a fallback destination for
// new uploads. Indices 1/2 are left as-is (not renumbered) so the admin
// dashboard keeps showing the same "Cloudinary 2"/"Cloudinary 3" labels the
// account owner already recognizes — only re-add account 0 here (with its
// index reset to 0) if that Cloudinary account is ever needed again.
const RAW_ACCOUNTS: (CloudinaryAccount | null)[] = [
  {
    index: 1,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME1 ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY1 ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET1 ?? "",
  },
  {
    index: 2,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME2 ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY2 ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET2 ?? "",
  },
];

// env var কোনো একটা সেট না থাকলে (যেমন লোকাল ডেভে .env-এ শুধু account 0 আছে)
// সেই account বাদ পড়ে যায় — ভাঙে না।
export const CLOUDINARY_ACCOUNTS: CloudinaryAccount[] = RAW_ACCOUNTS.filter(
  (a): a is CloudinaryAccount => !!(a && a.cloudName && a.apiKey && a.apiSecret)
);

// পুরনো কোড (media-action.ts, cloudinary-sign/route.ts-এর `cloudinary.uploader.destroy`
// ইত্যাদি) যেন ভেঙে না যায় — account 0 দিয়ে singleton config, আগের মতোই আচরণ।
cloudinary.config({
  cloud_name: CLOUDINARY_ACCOUNTS[0]?.cloudName,
  api_key: CLOUDINARY_ACCOUNTS[0]?.apiKey,
  api_secret: CLOUDINARY_ACCOUNTS[0]?.apiSecret,
  secure: true,
});

export { cloudinary };

// Delivery URL that guarantees browser-compatible playback: forces an
// H.264/MP4 video (source phone footage is often HEVC .mov, which Chrome/
// Edge/Firefox on Windows can't decode — audio plays, video doesn't) or an
// auto-negotiated image format (covers HEIC photos the same way).
// Slash-chained transformations (not comma-combined, e.g. NOT "q_auto,vc_auto")
// — WarrantyClaim.mediaUrl stores multiple files as a comma-separated string
// (see [id]/page.tsx's `mediaUrl.split(',')`), so a comma inside the URL
// itself would get misread as a second, garbage "file".
export function cloudinaryDeliveryUrl(
  publicId: string,
  version: number,
  resourceType: "video" | "image",
  cloudName: string = CLOUDINARY_ACCOUNTS[0]?.cloudName ?? ""
): string {
  if (resourceType === "video") {
    return `https://res.cloudinary.com/${cloudName}/video/upload/q_auto/vc_auto/v${version}/${publicId}.mp4`;
  }
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto/q_auto/v${version}/${publicId}`;
}

// ---------------------------------------------------------------------------
// প্রতিটা account-এর usage % (Admin API) — cloudinary SDK-এর global singleton
// config-এর উপর নির্ভর না করে সরাসরি fetch দিয়ে, তাই একসাথে ৩টা account
// আলাদাভাবে চেক করা যায় কোনো কনফ্লিক্ট ছাড়াই।
// ---------------------------------------------------------------------------
export interface CloudinaryAccountUsage {
  index: number;
  cloudName: string;
  plan: string;
  creditsUsed: number;
  creditsLimit: number;
  usedPercent: number;
  storageBytes: number;
  bandwidthBytes: number;
}

export async function fetchCloudinaryUsage(account: CloudinaryAccount): Promise<CloudinaryAccountUsage | null> {
  try {
    const auth = Buffer.from(`${account.apiKey}:${account.apiSecret}`).toString("base64");
    const res = await fetch(`https://api.cloudinary.com/v1_1/${account.cloudName}/usage`, {
      headers: { Authorization: `Basic ${auth}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      index: account.index,
      cloudName: account.cloudName,
      plan: data.plan,
      creditsUsed: data.credits?.usage ?? 0,
      creditsLimit: data.credits?.limit ?? 0,
      usedPercent: data.credits?.used_percent ?? 0,
      storageBytes: data.storage?.usage ?? 0,
      bandwidthBytes: data.bandwidth?.usage ?? 0,
    };
  } catch {
    return null;
  }
}

// সব account-এর usage — parallel, কোনো একটা fail করলেও বাকিগুলো ফেরত আসে।
export async function fetchAllCloudinaryUsage(): Promise<CloudinaryAccountUsage[]> {
  const results = await Promise.all(CLOUDINARY_ACCOUNTS.map(fetchCloudinaryUsage));
  return results.filter((r): r is CloudinaryAccountUsage => r !== null);
}

// ---------------------------------------------------------------------------
// Best-account picker — 10 মিনিট in-memory cache (serverless instance-এর
// মধ্যে শেয়ার্ড, cold-start হলে রিসেট হয় — সেটা সমস্যা না, শুধু মাঝেমধ্যে
// এক-আধটা extra usage-check call হবে)। ৯০%-এর নিচে থাকা প্রথম account
// অগ্রাধিকার পায় (index অনুযায়ী); সবকটা ৯০%+ হলেও সবচেয়ে কম-ব্যবহৃতটাই
// ফেরত দেওয়া হয় (হার্ড-ফেইল না করে শেষ চেষ্টা)।
// ---------------------------------------------------------------------------
let usageCache: { data: CloudinaryAccountUsage[]; fetchedAt: number } | null = null;
const USAGE_CACHE_TTL_MS = 10 * 60 * 1000;

async function getCachedUsage(): Promise<CloudinaryAccountUsage[]> {
  if (usageCache && Date.now() - usageCache.fetchedAt < USAGE_CACHE_TTL_MS) {
    return usageCache.data;
  }
  const data = await fetchAllCloudinaryUsage();
  if (data.length > 0) usageCache = { data, fetchedAt: Date.now() };
  return data;
}

const USAGE_SWITCH_THRESHOLD = 90; // % — এর বেশি হলে পরের account-এ যাওয়া হয়

export async function pickCloudinaryAccount(excludeIndices: number[] = []): Promise<CloudinaryAccount | null> {
  const candidates = CLOUDINARY_ACCOUNTS.filter(a => !excludeIndices.includes(a.index));
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  const usage = await getCachedUsage();
  const usageByIndex = new Map(usage.map(u => [u.index, u.usedPercent]));

  // ১) ৯০%-এর নিচে থাকা প্রথম account (index অনুযায়ী, প্রেডিক্টেবল অর্ডার)
  const underThreshold = candidates.find(a => (usageByIndex.get(a.index) ?? 0) < USAGE_SWITCH_THRESHOLD);
  if (underThreshold) return underThreshold;

  // ২) সবকটাই ৯০%+ — সবচেয়ে কম-ব্যবহৃতটা বেছে নাও, একদম আটকে না গিয়ে
  const sorted = [...candidates].sort(
    (a, b) => (usageByIndex.get(a.index) ?? 0) - (usageByIndex.get(b.index) ?? 0)
  );
  return sorted[0];
}
