import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
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
    ],
  },
};

export default nextConfig;
