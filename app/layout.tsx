// app/layout.tsx

import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import NextTopLoader from 'nextjs-toploader';
import { db } from "@/lib/prisma";
import { GlobalStoreProvider } from "@/app/providers/global-store-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GoBike Admin",
  description: "Admin panel for GoBike e-commerce",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  // 1. Fetch ALL Required Settings concurrently
  // আমরা এখানে Promise.all ব্যবহার করছি যাতে ৩টা কুয়েরি একসাথে রান হয় (Fast Performance)
  const [storeSettings, seoConfig, marketingConfig] = await Promise.all([
    db.storeSettings.findUnique({ where: { id: "settings" } }),
    db.seoGlobalConfig.findUnique({ where: { id: "global_seo" } }),
    db.marketingIntegration.findUnique({ where: { id: "marketing_config" } })
  ]);

  // 2. Prepare the settings object exactly as Provider expects
  const providerSettings = {
    storeSettings: storeSettings,
    seoConfig: seoConfig,
    marketingConfig: marketingConfig
  };

  return (
    <ClerkProvider>
      <html lang="en">
        <body
          suppressHydrationWarning={true}
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <NextTopLoader 
            color="#56ff08ff" 
            initialPosition={0.08}
            crawlSpeed={200}
            height={3}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow="0 0 10px #2271b1,0 0 5px #2271b1"
          />
          <Toaster position="top-center" />
          
          {/* 3. Pass the structured object */}
          <GlobalStoreProvider settings={providerSettings}>
            {children}
          </GlobalStoreProvider>
          
        </body>
      </html>
    </ClerkProvider>
  );
}