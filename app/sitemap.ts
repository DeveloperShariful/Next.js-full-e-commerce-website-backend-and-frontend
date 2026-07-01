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

// ─── Main sitemap ─────────────────────────────────────────────────────────────
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  // ── 1. Static pages ──────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`,                          lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/shop`,                      lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/bikes`,                     lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE_URL}/electric-bike-parts`,       lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/kids-ebike-hub`,            lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
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
        ].filter((url): url is string => !!url);

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
              title: p.name,
              thumbnail_loc: thumbnail,
              description: p.shortDescription || p.name,
              content_loc: p.videoUrl,
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

    categoryPages = categories
      .filter(c => c.slug)
      .map(c => ({
        url: `${BASE_URL}/electric-bike-parts/${c.slug}`,
        lastModified: c.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.75,
      }));
  } catch {
    // skip silently
  }

  // ── 4. Blog posts from /blogs/*.md ────────────────────────────────────────
  const blogPages: MetadataRoute.Sitemap = readMarkdownSlugs('blogs').map(post => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.65,
    ...(post.image && { images: [post.image] }),
  }));

  // ── 5. Kids eBike Hub posts from /hub-posts/*.md ──────────────────────────
  const hubPages: MetadataRoute.Sitemap = readMarkdownSlugs('hub-posts').map(post => ({
    url: `${BASE_URL}/kids-ebike-hub/${post.slug}`,
    lastModified: post.lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
    ...(post.image && { images: [post.image] }),
  }));

  // ── 6. Kids eBike Hub category pages (derived from hub-posts frontmatter) ──
  const hubCategoryPages: MetadataRoute.Sitemap = readMarkdownCategories('hub-posts').map(cat => ({
    url: `${BASE_URL}/kids-ebike-hub/category/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.65,
  }));

  return [
    ...staticPages,
    ...productPages,
    ...categoryPages,
    ...blogPages,
    ...hubPages,
    ...hubCategoryPages,
  ];
}
