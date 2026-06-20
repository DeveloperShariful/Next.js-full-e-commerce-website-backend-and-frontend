// app/(backend)/layout.tsx

import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth"; 
import { db } from "@/lib/prisma";
import { Role } from "@prisma/client";
import AdminSidebar from "@/app/(backend)/Header-Sideber/sidebar";
import AdminHeader from "@/app/(backend)/Header-Sideber/header";
import { GlobalStoreProvider } from "@/app/providers/global-store-provider";
import { serializePrismaData } from "@/lib/format-data"; 

// ✅ নতুন ক্যাশ ফাংশনগুলো ইম্পোর্ট করা হলো
import { 
  getCachedStoreSettings, 
  getCachedSeoConfig, 
  getCachedMarketingConfig,
  getCachedPaymentMethods,
  getCachedPickupLocations
} from "@/lib/global-settings-cache";

async function getGlobalData() {
  // ✅ ডাটাবেজ টাইমআউট থেকে বাঁচার জন্য সরাসরি ক্যাশ থেকে কল
  const [settings, seo, marketing, paymentMethods, pickupLocations] = await Promise.all([
    getCachedStoreSettings(),
    getCachedSeoConfig(),
    getCachedMarketingConfig(),
    getCachedPaymentMethods(),
    getCachedPickupLocations() 
  ]);

  return {
    settings: {
      storeSettings: {
        storeName: settings?.storeName || "GoBike",
        storeEmail: settings?.storeEmail,
        storePhone: settings?.storePhone,
        currency: settings?.currency || "",
        currencySymbol: settings?.currencySymbol || "",
        weightUnit: settings?.weightUnit || "",
        dimensionUnit: settings?.dimensionUnit || "",
        logo: settings?.logo,
        favicon: settings?.favicon,
        maintenance: settings?.maintenance || false,
        storeAddress: settings?.storeAddress,
        socialLinks: settings?.socialLinks,
        generalConfig: settings?.generalConfig,
        taxSettings: settings?.taxSettings,
        affiliateConfig: settings?.affiliateConfig,
        logoMedia: settings?.logoMedia,
        faviconMedia: settings?.faviconMedia,
      },
      seoConfig: {
        siteName: seo?.siteName || "GoBike",
        titleSeparator: seo?.titleSeparator || "|",
        siteUrl: seo?.siteUrl || "",
        defaultMetaTitle: seo?.defaultMetaTitle,
        defaultMetaDesc: seo?.defaultMetaDesc,
        ogImage: seo?.ogImage,
        twitterCard: seo?.twitterCard || "summary_large_image",
        twitterSite: seo?.twitterSite,
        themeColor: seo?.themeColor,
        robotsTxtContent: seo?.robotsTxtContent,
        organizationData: seo?.organizationData,
        manifestJson: seo?.manifestJson,
        ogMedia: seo?.ogMedia,
      },
      marketingConfig: marketing ? {
        gtmEnabled: marketing.gtmEnabled,
        gtmContainerId: marketing.gtmContainerId,
        gtmAuth: marketing.gtmAuth,
        gtmPreview: marketing.gtmPreview,
        fbEnabled: marketing.fbEnabled,
        fbPixelId: marketing.fbPixelId,
        klaviyoEnabled: marketing.klaviyoEnabled,
        klaviyoPublicKey: marketing.klaviyoPublicKey,
        cookieConsentRequired: false, 
      } : null,
    },
    paymentMethods: paymentMethods || [],
    pickupLocations: pickupLocations || [],
  };
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth(); 
  if (!session?.user?.email) redirect("/sign-in");

  const dbUser = await db.user.findUnique({
    where: { email: session.user.email }
  });

  if (!dbUser || dbUser.role === Role.CUSTOMER) redirect("/");

  const adminUser = {
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    image: session.user.image, 
  };

  const rawData = await getGlobalData();
  const cleanData = serializePrismaData(rawData);
  
  return (
    <GlobalStoreProvider 
      settings={cleanData.settings as any} 
      paymentMethods={cleanData.paymentMethods as any}
      pickupLocations={cleanData.pickupLocations as any}
    >
      <div className="flex flex-col h-screen bg-[#f0f0f1] font-sans text-[#3c434a] overflow-hidden">
        <AdminHeader 
          user={adminUser} 
          storeName={cleanData.settings.storeSettings.storeName} 
        />
        
        <div className="flex flex-1 overflow-hidden">
          <AdminSidebar user={adminUser} />
          <main className="flex-1 overflow-y-auto  scrollbar-thin scrollbar-thumb-[#c3c4c7] scrollbar-track-transparent">    
            {children}
          </main>
        </div>
      </div>
    </GlobalStoreProvider>
  );
}