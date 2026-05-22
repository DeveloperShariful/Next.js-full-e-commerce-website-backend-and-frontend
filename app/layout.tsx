// File: app/layout.tsx

import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NextAuthSessionProvider from "@/app/providers/session-provider"; 

import NextTopLoader from 'nextjs-toploader';
import { 
  GlobalStoreProvider, 
  StoreAddress, 
  SocialLinks 
} from "@/app/providers/global-store-provider"; 
import { AffiliateTrackerProvider } from "@/app/providers/affiliate-tracker-provider";

import { 
  getCachedStoreSettings, 
  getCachedSeoConfig, 
  getCachedMarketingConfig 
} from "@/lib/global-settings-cache";

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
  
  const [storeSettings, seoConfig, marketingConfig] = await Promise.all([
    getCachedStoreSettings(),
    getCachedSeoConfig(),
    getCachedMarketingConfig()
  ]);

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
    // 🚀 FIXED: NextAuthSessionProvider (আপনার বানানো ক্লায়েন্ট কম্পোনেন্ট) ব্যবহার করা হলো
    <NextAuthSessionProvider>
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
          
          <GlobalStoreProvider settings={providerSettings as any}>
            <AffiliateTrackerProvider />
            {children}
          </GlobalStoreProvider>
          
        </body>
      </html>
    </NextAuthSessionProvider>
  );
}