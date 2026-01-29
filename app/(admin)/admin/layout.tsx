// app/(admin)/layout.tsx

import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { Role } from "@prisma/client";
import AdminSidebar from "@/app/(admin)/Header-Sideber/sidebar";
import AdminHeader from "@/app/(admin)/Header-Sideber/header";
import { GlobalStoreProvider } from "@/app/providers/global-store-provider";
import { serializePrismaData } from "@/lib/format-data"; 

async function getGlobalData() {
  const [settings, seo, marketing, paymentMethods, pickupLocations] = await Promise.all([
    db.storeSettings.findUnique({ where: { id: "settings" }, include: { logoMedia: true, faviconMedia: true } }),
    db.seoGlobalConfig.findUnique({ where: { id: "global_seo" }, include: { ogMedia: true } }),
    db.marketingIntegration.findUnique({ where: { id: "marketing_config" } }),
    db.paymentMethodConfig.findMany({ where: { isEnabled: true } }), 
    db.location.findMany({ where: { isActive: true } }) 
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
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const dbUser = await db.user.findUnique({
    where: { email: clerkUser.emailAddresses[0].emailAddress }
  });

  if (!dbUser || dbUser.role === Role.CUSTOMER) redirect("/");

  const adminUser = {
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    image: clerkUser.imageUrl,
  };

  const rawData = await getGlobalData();
  const cleanData = serializePrismaData(rawData);
  return (
    <GlobalStoreProvider 
      settings={cleanData.settings} 
      paymentMethods={cleanData.paymentMethods}
      pickupLocations={cleanData.pickupLocations}
    >
      <div className="flex h-screen bg-slate-50/50 font-sans text-slate-800 overflow-hidden">
        <AdminSidebar user={adminUser} />
        <div className="flex-1 flex flex-col h-full min-w-0">
          <AdminHeader user={adminUser} />
          <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">    
            {children}
          </main>
        </div>
      </div>
    </GlobalStoreProvider>
  );
}