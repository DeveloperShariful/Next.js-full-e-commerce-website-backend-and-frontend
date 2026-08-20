// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://gobike.au').replace(/\/+$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/feeds/', '/sitemap'],
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
          '/sign-in',
          '/sign-up',
          '/forgot-password',
          '/reset-password',
          '/track-order',
          '/compare',
          '/search?',
          '/*?*sort=',
          '/*?*filter=',
          // Community utility pages — personalized/empty-without-a-query, no
          // standalone SEO value (the actual content lives at its own canonical
          // /community/[slug], /community/tag/[tag], /community/profile/[id] URLs,
          // which stay indexable and are listed in sitemap.xml).
          '/community/search',
          '/community/saved',
          '/community/notifications',
        ],
      },
      // AI bots: allowed (fall through to the '*' rule above — same access as
      // regular crawlers, still blocked from /admin/, /checkout/, /cart, etc).
      // Omgilibot is a third-party data reseller (not an AI assistant itself)
      // with no direct benefit, so it stays blocked.
      { userAgent: 'Omgilibot', disallow: ['/'] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
