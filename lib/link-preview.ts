// lib/link-preview.ts
// Fetches and caches Open Graph metadata (title/description/image) for Facebook
// links shared in Community posts, so we can render a rich preview card instead
// of a bare URL. Reads are DB-only (never block a page render on a live network
// fetch); the actual fetch only happens once, in the background, right after a
// post is created/edited — see prewarmLinkPreview().

import { db } from "@/lib/prisma";
import crypto from "crypto";

const FACEBOOK_HOSTS = new Set(["facebook.com", "www.facebook.com", "m.facebook.com", "fb.watch"]);
const FIRST_URL_PATTERN = /https?:\/\/[^\s]+/;
const FETCH_TIMEOUT_MS = 5000;
const MAX_BYTES = 500_000;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Facebook's own CDN image URLs (scontent.*.fbcdn.net) carry a signed,
// time-limited token (the `oe=` param) — they 403 on their own after a
// while regardless of our cache TTL, since nothing here ever re-fetches a
// post that's never edited again. Mirroring the bytes to our own Hostinger
// media server once, at fetch time, makes the cached preview permanent.
async function mirrorImageToHostinger(imageUrl: string): Promise<string> {
  const secret = process.env.HOSTINGER_UPLOAD_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_HOSTINGER_MEDIA_URL;
  if (!secret || !baseUrl) return imageUrl; // not configured — fall back to the original (Facebook) URL

  try {
    const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!imgRes.ok) return imageUrl;
    const blob = await imgRes.blob();

    const folder = "link-preview";
    const timestamp = Math.round(Date.now() / 1000);
    const signature = crypto.createHmac("sha256", secret).update(`${timestamp}:${folder}`).digest("hex");

    const formData = new FormData();
    formData.append("file", blob, "preview.jpg");
    formData.append("folder", folder);

    const uploadRes = await fetch(`${baseUrl}/upload.php`, {
      method: "POST",
      headers: { "x-upload-timestamp": String(timestamp), "x-upload-signature": signature },
      body: formData,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!uploadRes.ok) return imageUrl;
    const result = await uploadRes.json();
    return result.success && result.url ? result.url : imageUrl;
  } catch {
    return imageUrl; // Hostinger hiccup — still cache Facebook's URL rather than losing the preview entirely
  }
}

export interface LinkPreviewData {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
}

function isFacebookUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    return FACEBOOK_HOSTS.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

/** First Facebook URL found in the text, or null. We only ever preview one link per post. */
function extractFacebookUrl(text: string | null | undefined): string | null {
  if (!text) return null;
  const match = text.match(FIRST_URL_PATTERN);
  if (!match) return null;
  return isFacebookUrl(match[0]) ? match[0] : null;
}

/** HTML attribute values can contain entity-encoded chars (Facebook encodes emoji as
 * numeric entities, and "&" as "&amp;" inside image URLs) — a real HTML parser would
 * decode these automatically, but our lightweight regex extraction doesn't, so we do
 * it explicitly here. Without this, emoji show up as literal "&#x1f525;" text and
 * image URLs break (their "&" query-param separators stay as literal "&amp;").
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function extractMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${property}["']`, "i"),
  ];
  for (const re of patterns) {
    const match = html.match(re);
    if (match) return decodeHtmlEntities(match[1]);
  }
  return null;
}

async function fetchFacebookOgTags(url: string): Promise<{ title: string | null; description: string | null; image: string | null } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      // Facebook serves fully-rendered OG tags to known link-unfurling crawlers
      // without requiring login — this is the exact, intended purpose of OG tags.
      headers: { "User-Agent": "facebookexternalhit/1.1" },
    });

    // Re-check the FINAL URL (after any redirects) is still really Facebook —
    // stops a whitelisted-looking link from redirecting our server somewhere else (SSRF).
    if (!isFacebookUrl(res.url) || !res.ok || !res.body) return null;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let html = "";
    let bytes = 0;
    while (bytes < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.length;
      html += decoder.decode(value, { stream: true });
      if (html.includes("</head>")) break;
    }
    reader.cancel().catch(() => {});

    const title = extractMeta(html, "og:title");
    const description = extractMeta(html, "og:description");
    const rawImage = extractMeta(html, "og:image");
    if (!title && !rawImage) return null;
    const image = rawImage ? await mirrorImageToHostinger(rawImage) : null;
    return { title, description, image };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/** Fire-and-forget: fetches + caches the preview for a post's first Facebook link, if any. */
export async function prewarmLinkPreview(caption: string | null | undefined): Promise<void> {
  const url = extractFacebookUrl(caption);
  if (!url) return;

  const existing = await db.linkPreview.findUnique({ where: { url } });
  if (existing && Date.now() - existing.fetchedAt.getTime() < CACHE_TTL_MS) return;

  const fetched = await fetchFacebookOgTags(url);
  if (!fetched) return;

  await db.linkPreview
    .upsert({
      where: { url },
      create: { url, ...fetched },
      update: { ...fetched, fetchedAt: new Date() },
    })
    .catch(() => {});
}

/** DB-only lookup for a single post — never triggers a live fetch. */
export async function getCachedLinkPreview(caption: string | null | undefined): Promise<LinkPreviewData | null> {
  const url = extractFacebookUrl(caption);
  if (!url) return null;
  const cached = await db.linkPreview.findUnique({ where: { url } });
  if (!cached) return null;
  return { url: cached.url, title: cached.title, description: cached.description, image: cached.image };
}

/** Batched, DB-only lookup for a list of posts — one query for all of them. */
export async function attachLinkPreviews<T extends { caption: string | null }>(
  posts: T[]
): Promise<(T & { linkPreview: LinkPreviewData | null })[]> {
  const urlByPost = posts.map(p => extractFacebookUrl(p.caption));
  const uniqueUrls = Array.from(new Set(urlByPost.filter((u): u is string => !!u)));
  if (uniqueUrls.length === 0) return posts.map(p => ({ ...p, linkPreview: null }));

  const cached = await db.linkPreview.findMany({ where: { url: { in: uniqueUrls } } });
  const byUrl = new Map(cached.map(c => [c.url, c]));

  return posts.map((post, i) => {
    const url = urlByPost[i];
    const hit = url ? byUrl.get(url) : undefined;
    return {
      ...post,
      linkPreview: hit ? { url: hit.url, title: hit.title, description: hit.description, image: hit.image } : null,
    };
  });
}
