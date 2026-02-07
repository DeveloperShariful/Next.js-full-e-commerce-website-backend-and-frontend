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
} from "@/app/providers/global-store-provider"; 
import { AffiliateTrackerProvider } from "@/app/providers/affiliate-tracker-provider";

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

// ✅ Helper to fetch data safely without crashing the app on DB timeout
async function fetchSafe(query: Promise<any>) {
  try {
    return await query;
  } catch (error) {
    console.error("⚠️ Layout DB Fetch Error:", error);
    return null; // Return null on error so the page still loads
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  // 1. Fetch ALL Required Settings concurrently with SAFE handling
  // Promise.allSettled is better here, but manual try-catch wrapper works too.
  const [storeSettings, seoConfig, marketingConfig] = await Promise.all([
    fetchSafe(db.storeSettings.findUnique({ where: { id: "settings" }, include: { logoMedia: true, faviconMedia: true } })),
    fetchSafe(db.seoGlobalConfig.findUnique({ where: { id: "global_seo" }, include: { ogMedia: true } })),
    fetchSafe(db.marketingIntegration.findUnique({ where: { id: "marketing_config" } }))
  ]);

  // 2. Prepare the settings object explicitly casting JSON fields
  const providerSettings = {
    storeSettings: storeSettings ? {
      ...storeSettings,
      storeAddress: storeSettings.storeAddress as unknown as StoreAddress,
      socialLinks: storeSettings.socialLinks as unknown as SocialLinks,
      generalConfig: storeSettings.generalConfig as any,
      taxSettings: storeSettings.taxSettings as any,
    } : null,

    seoConfig: seoConfig ? {
      ...seoConfig,
      organizationData: seoConfig.organizationData as any,
      manifestJson: seoConfig.manifestJson as any,
    } : null,

    marketingConfig: marketingConfig ? {
      ...marketingConfig,
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
          
          <GlobalStoreProvider settings={providerSettings}>
            <AffiliateTrackerProvider />
            {children}
          </GlobalStoreProvider>
          
        </body>
      </html>
    </ClerkProvider>
  );
}