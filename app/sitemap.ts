// app/sitemap.ts
export const dynamic = 'force-dynamic';

import { MetadataRoute } from 'next';
import { db } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://gobike.au').replace(/\/+$/, '');

// ─── Read markdown files and extract unique categories ───────────────────────
function readMarkdownCategories(dir: string): string[] {
  try {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) return [];
    const categories = new Set<string>();
    fs.readdirSync(fullPath)
      .filter(f => f.endsWith('.md') || f.endsWith('.mdx'))
      .forEach(filename => {
        const { data } = matter(fs.readFileSync(path.join(fullPath, filename), 'utf-8'));
        if (data.category) {
          // slugify: "Team Riders" → "team-riders"
          categories.add(
            String(data.category).toLowerCase().replace(/[\s_]+/g, '-').replace(/[^\w-]+/g, '')
          );
        }
      });
    return Array.from(categories);
  } catch {
    return [];
  }
}

// ─── Read markdown files from a directory ────────────────────────────────────
function readMarkdownSlugs(dir: string): { slug: string; lastModified: Date; image?: string }[] {
  try {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) return [];
    return fs.readdirSync(fullPath)
      .filter(f => f.endsWith('.md') || f.endsWith('.mdx'))
      .map(filename => {
        const slug = filename.replace(/\.(md|mdx)$/, '');
        const filePath = path.join(fullPath, filename);
        const stats = fs.statSync(filePath);
        const { data } = matter(fs.readFileSync(filePath, 'utf-8'));
        return {
          slug,
          lastModified: data.date ? new Date(data.date) : stats.mtime,
          image: data.cover_image || data.image || undefined,
        };
      });
  } catch {
    return [];
  }
}

// ─── XML-এ যাওয়া যেকোনো ডাইনামিক স্ট্রিং (title, URL) অবশ্যই escape করতে হয় ──────
// product.name-এর মতো ফিল্ডে literal "&" (যেমন "Kids & Teens") থাকলে সেটা raw
// অবস্থায় XML ভেঙে দেয় ("xmlParseEntityRef: no name") — Next.js-এর video/image
// sitemap extension নিজে থেকে এটা escape করে না, তাই ম্যানুয়ালি করা হচ্ছে।
function escapeXml(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ─── video:description প্লেইন টেক্সট হওয়া লাগে (XML sitemap spec) ─────────────
// product.shortDescription-এ raw rich-HTML (marketing card grid ইত্যাদি) থাকতে
// পারে — সেটা সরাসরি XML-এ বসালে parsing ভেঙে যায় (Google-এর "Sitemap can be
// read, but has errors / Parsing error" ঠিক এই কারণেই হচ্ছিল)। tag strip +
// entity-escape + video:description-এর ম্যাক্স ২০৪৮ ক্যারেক্টার সীমায় truncate।
function stripHtmlForXmlDescription(html: string | null | undefined, maxLen = 2000): string {
  if (!html) return '';
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const truncated = text.length > maxLen ? `${text.slice(0, maxLen - 1)}…` : text;
  return escapeXml(truncated);
}

// ─── Main sitemap ─────────────────────────────────────────────────────────────
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  // ── 1. Static pages ──────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`,                          lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/shop`,                      lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/bikes`,                     lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE_URL}/electric-bike-parts`,       lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/apparel`,                   lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE_URL}/blog`,                      lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE_URL}/discount`,                  lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${BASE_URL}/warranty`,                  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/affiliates/register`,       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/about`,                     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/contact`,                   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/faq`,                       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/shipping-policy`,           lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.4 },
    { url: `${BASE_URL}/privacy-policy`,            lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/refund-and-returns-policy`, lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/terms-and-conditions`,      lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/sitemap`,                  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/retailers`,                lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ];

  // ── 2. Products from DB (with images + video for Google sitemap) ──────────
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const products = await db.product.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
      select: {
        slug: true,
        name: true,
        shortDescription: true,
        updatedAt: true,
        featuredImage: true,
        videoUrl: true,
        videoThumbnail: true,
        images: { orderBy: { position: 'asc' }, select: { url: true }, take: 5 },
      },
      orderBy: { updatedAt: 'desc' },
    });

    productPages = products
      .filter(p => p.slug)
      .map(p => {
        const images = [
          p.featuredImage,
          ...p.images.map(i => i.url),
        ].filter((url): url is string => !!url).map(escapeXml);

        const entry: MetadataRoute.Sitemap[number] = {
          url: `${BASE_URL}/product/${p.slug}`,
          lastModified: p.updatedAt,
          changeFrequency: 'weekly',
          priority: 0.85,
        };

        if (images.length > 0) entry.images = images;

        if (p.videoUrl) {
          const thumbnail = p.videoThumbnail || p.featuredImage;
          if (thumbnail) {
            entry.videos = [{
              title: escapeXml(p.name),
              thumbnail_loc: escapeXml(thumbnail),
              description: stripHtmlForXmlDescription(p.shortDescription) || escapeXml(p.name),
              content_loc: escapeXml(p.videoUrl),
            }];
          }
        }

        return entry;
      });
  } catch (err) {
    console.error('[sitemap] product query failed:', err);
  }

  // ── 3. Categories from DB ─────────────────────────────────────────────────
  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const categories = await db.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
      orderBy: { menuOrder: 'asc' },
    });

    // ★ 'bikes', 'apparel', 'spare-parts' already have dedicated top-level pages
    // (/bikes, /apparel, /electric-bike-parts) showing the exact same products —
    // submitting both URLs to Google causes keyword cannibalization, so the
    // /electric-bike-parts/[slug] duplicate is excluded from the sitemap here.
    const DUPLICATE_CATEGORY_SLUGS = new Set(['bikes', 'apparel', 'spare-parts']);

    categoryPages = categories
      .filter(c => c.slug && !DUPLICATE_CATEGORY_SLUGS.has(c.slug))
      .map(c => ({
        url: `${BASE_URL}/electric-bike-parts/${c.slug}`,
        lastModified: c.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.75,
      }));
  } catch {
    // skip silently
  }

  // ── 4. Blog posts from DB (with markdown fallback) ───────────────────────
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const blogPosts = await db.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true, featuredImage: true },
      orderBy: { publishedAt: 'desc' },
    });
    blogPages = blogPosts
      .filter(p => p.slug)
      .map(p => ({
        url: `${BASE_URL}/blog/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.65,
        ...(p.featuredImage && { images: [escapeXml(p.featuredImage)] }),
      }));
  } catch {
    blogPages = readMarkdownSlugs('blogs').map(post => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: post.lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.65,
      ...(post.image && { images: [escapeXml(post.image)] }),
    }));
  }

  // ── 5. Kids eBike Hub posts from /hub-posts/*.md ──────────────────────────
  const hubPages: MetadataRoute.Sitemap = readMarkdownSlugs('hub-posts').map(post => ({
    url: `${BASE_URL}/kids-ebike-hub/${post.slug}`,
    lastModified: post.lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
    ...(post.image && { images: [escapeXml(post.image)] }),
  }));

  // ── 6. Kids eBike Hub category pages (derived from hub-posts frontmatter) ──
  const hubCategoryPages: MetadataRoute.Sitemap = readMarkdownCategories('hub-posts').map(cat => ({
    url: `${BASE_URL}/kids-ebike-hub/category/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.65,
  }));

  // ── 7. Community — feed, posts, tags, and author profile pages ────────────
  let communityPages: MetadataRoute.Sitemap = [];
  try {
    const posts = await db.communityPost.findMany({
      where: { status: 'PUBLISHED', deletedAt: null },
      select: {
        slug: true,
        caption: true,
        metaTitle: true,
        metaDesc: true,
        updatedAt: true,
        ogImage: true,
        tags: true,
        authorId: true,
        media: { select: { url: true, mediaType: true }, orderBy: { order: 'asc' } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const postPages: MetadataRoute.Sitemap = posts
      .filter(p => p.slug)
      .map(p => {
        const images = p.media.filter(m => m.mediaType === 'IMAGE').map(m => m.url);
        const videos = p.media.filter(m => m.mediaType === 'VIDEO');

        const entry: MetadataRoute.Sitemap[number] = {
          url: `${BASE_URL}/community/${p.slug}`,
          lastModified: p.updatedAt,
          changeFrequency: 'weekly',
          priority: 0.5,
        };

        if (images.length > 0) entry.images = images.map(escapeXml);
        else if (p.ogImage) entry.images = [escapeXml(p.ogImage)];

        if (videos.length > 0) {
          const title = escapeXml(p.metaTitle || 'GoBike Community Post');
          entry.videos = videos.map(v => ({
            title,
            thumbnail_loc: escapeXml(v.url.replace(/\.[a-zA-Z0-9]+$/, '.jpg')),
            description: stripHtmlForXmlDescription(p.metaDesc || p.caption) || title,
            content_loc: escapeXml(v.url),
          }));
        }

        return entry;
      });

    const tagSet = new Set<string>();
    const authorIds = new Set<string>();
    posts.forEach(p => {
      p.tags.forEach(t => tagSet.add(t));
      authorIds.add(p.authorId);
    });

    const tagPages: MetadataRoute.Sitemap = Array.from(tagSet).map(tag => ({
      url: `${BASE_URL}/community/tag/${encodeURIComponent(tag)}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.45,
    }));

    const authors = await db.user.findMany({
      where: { id: { in: Array.from(authorIds) } },
      select: { id: true, updatedAt: true },
    });
    const profilePages: MetadataRoute.Sitemap = authors.map(a => ({
      url: `${BASE_URL}/community/profile/${a.id}`,
      lastModified: a.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.4,
    }));

    communityPages = [
      { url: `${BASE_URL}/community`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.6 },
      ...postPages,
      ...tagPages,
      ...profilePages,
    ];
  } catch (err) {
    console.error('[sitemap] community query failed:', err);
  }

  return [
    ...staticPages,
    ...productPages,
    ...categoryPages,
    ...blogPages,
    ...hubPages,
    ...hubCategoryPages,
    ...communityPages,
  ];
}
