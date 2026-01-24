// app/layout.tsx

// app/layout.tsx

import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import NextTopLoader from 'nextjs-toploader';
import { db } from "@/lib/prisma";
import { 
  GlobalStoreProvider, 
  StoreAddress, 
  SocialLinks 
} from "@/app/providers/global-store-provider"; // 🔥 টাইপগুলো ইম্পোর্ট করুন

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
  const [storeSettings, seoConfig, marketingConfig] = await Promise.all([
    db.storeSettings.findUnique({ where: { id: "settings" }, include: { logoMedia: true, faviconMedia: true } }), // 🔥 Media include করা ভালো
    db.seoGlobalConfig.findUnique({ where: { id: "global_seo" }, include: { ogMedia: true } }),
    db.marketingIntegration.findUnique({ where: { id: "marketing_config" } })
  ]);

  // 2. Prepare the settings object explicitly casting JSON fields
  const providerSettings = {
    storeSettings: storeSettings ? {
      ...storeSettings,
      // 🔥 FIX: JSON ফিল্ডগুলোকে জোর করে টাইপ বলে দেওয়া হচ্ছে
      storeAddress: storeSettings.storeAddress as unknown as StoreAddress,
      socialLinks: storeSettings.socialLinks as unknown as SocialLinks,
      generalConfig: storeSettings.generalConfig as any,
      taxSettings: storeSettings.taxSettings as any,
    } : null,

    seoConfig: seoConfig ? {
      ...seoConfig,
      // 🔥 FIX: SEO JSON fields casting
      organizationData: seoConfig.organizationData as any,
      manifestJson: seoConfig.manifestJson as any,
    } : null,

    marketingConfig: marketingConfig ? {
      ...marketingConfig,
      // 🔥 FIX: Marketing JSON fields casting
      fbDataProcessingOptions: marketingConfig.fbDataProcessingOptions as any,
      klaviyoListIds: marketingConfig.klaviyoListIds as any,
      verificationStatus: marketingConfig.verificationStatus as any,
    } : null
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