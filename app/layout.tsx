// app/layout.tsx

import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react"; 
import NextTopLoader from 'nextjs-toploader';
import { 
  GlobalStoreProvider, 
  StoreAddress, 
  SocialLinks 
} from "@/app/providers/global-store-provider"; 
import { AffiliateTrackerProvider } from "@/app/providers/affiliate-tracker-provider";

// ✅ সরাসরি ডাটাবেজের বদলে আমাদের নতুন সুপার-ফাস্ট ক্যাশ ফাইল ইম্পোর্ট করা হলো
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
  
  // ✅ 1. ডাটাবেজ জ্যাম না করে জিরো সেকেন্ডে মেমোরি থেকে ডেটা ফেচ করা হলো
  const [storeSettings, seoConfig, marketingConfig] = await Promise.all([
    getCachedStoreSettings(),
    getCachedSeoConfig(),
    getCachedMarketingConfig()
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
    <SessionProvider>
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
          {/* Root Layout এ একবারই Toaster থাকবে */}
          <Toaster position="top-center" />
          
          <GlobalStoreProvider settings={providerSettings as any}>
            <AffiliateTrackerProvider />
            {children}
          </GlobalStoreProvider>
          
        </body>
      </html>
    </SessionProvider>
  );
}