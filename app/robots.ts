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
