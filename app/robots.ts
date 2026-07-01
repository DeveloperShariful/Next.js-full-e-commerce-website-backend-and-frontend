// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://gobike.au').replace(/\/+$/, '');

  return {
    // ── SITE UNDER CONSTRUCTION — block all crawlers ──────────────────────
    // When ready to go live, replace this entire rules array with the
    // production rules in the comment below.
    rules: [
      {
        userAgent: '*',
        disallow: ['/'],
      },
    ],

    /*
    ══════════════════════════════════════════════════════════════════════════
    PRODUCTION RULES — uncomment this block and delete the block above
    when you publish the site with the real domain.
    ══════════════════════════════════════════════════════════════════════════

    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/feeds/'],
        disallow: [
          '/admin/',
          '/api/',
          '/cart',
          '/checkout/',
          '/my-account',
          '/profile',
          '/order-success',
          '/order-confirmation',
          '/affiliates/dashboard',
          '/affiliates/register',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/track-order',
          '/compare',
          '/search?',
          '/*?*sort=',
          '/*?*filter=',
          '/*?*page=',
        ],
      },
      { userAgent: 'GPTBot',        disallow: ['/'] },
      { userAgent: 'ChatGPT-User',  disallow: ['/'] },
      { userAgent: 'CCBot',         disallow: ['/'] },
      { userAgent: 'anthropic-ai',  disallow: ['/'] },
      { userAgent: 'Claude-Web',    disallow: ['/'] },
      { userAgent: 'Google-Extended', disallow: ['/'] },
      { userAgent: 'PerplexityBot', disallow: ['/'] },
      { userAgent: 'Omgilibot',     disallow: ['/'] },
    ],

    */
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
