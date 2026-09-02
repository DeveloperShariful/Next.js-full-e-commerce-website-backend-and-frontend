import type { NextConfig } from "next";

const securityHeaders = [
  // Prevents other sites from embedding gobike.au in an <iframe> (clickjacking)
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Stops browsers from guessing file types — prevents MIME-sniffing attacks
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Enables the browser's built-in XSS filter (legacy browsers)
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Controls what referrer info is sent when navigating away from the site
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Blocks access to camera, microphone, geolocation — not needed on this site
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Forces HTTPS for 2 years — Vercel already uses HTTPS but this locks it in the browser
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        // Auth.js session/sign-in/sign-out responses must never be cached —
        // otherwise Vercel's edge (or the browser) can serve a stale "still
        // logged in" session check after sign-out on the live site (this
        // doesn't show up locally since dev has no CDN layer in front of it).
        source: '/api/auth/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
    ];
  },

  async redirects() {
    return [
      // Fix broken links in product descriptions (old short paths → correct category paths)
      { source: '/spare-parts', destination: '/electric-bike-parts/spare-parts', permanent: true },
      { source: '/tyre-and-tube', destination: '/electric-bike-parts/tyre-and-tube', permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "media.gobike.au", // নিজস্ব Hostinger media সার্ভার
      },
      {
        protocol: "https",
        hostname: "placehold.co", // প্লেসহোল্ডার ইমেজের জন্য
      },
  
      {
        protocol: 'https',
        hostname: 'sharifulbuilds.com',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'gobike.au',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'gobikes.au',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '/**', // <-- समाधान: pathname যোগ করা হয়েছে
      },
      {
        protocol: 'https',
        hostname: 'x.klarnacdn.net',
        pathname: '/**', // Klarna-এর লোগোর জন্য
      },
      {
        protocol: 'https',
        hostname: 'static.afterpay.com',
        pathname: '/**', // Afterpay-এর লোগোর জন্য
      },
      {
        protocol: 'https',
        hostname: 'rgy4iw8lybyokbyt.public.blob.vercel-storage.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google Sign-In profile pictures
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
