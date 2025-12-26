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
        protocol: "https",
        hostname: "img.clerk.com", // 🚀 এই লাইনটি অ্যাড করতে হবে
      },
    ],
  },
};

export default nextConfig;
