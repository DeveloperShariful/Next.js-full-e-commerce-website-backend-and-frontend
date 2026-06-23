// File: app/(frontend)/my-account/layout.tsx

import React from "react";
import { GlobalStoreProvider } from "@/app/providers/global-store-provider";
import { serializePrismaData } from "@/lib/format-data";
import {
  getCachedStoreSettings,
  getCachedSeoConfig,
  getCachedMarketingConfig,
  getCachedPaymentMethods,
  getCachedPickupLocations,
} from "@/lib/global-settings-cache";

export default async function MyAccountLayout({ children }: { children: React.ReactNode }) {
  const [settings, seo, marketing, paymentMethods, pickupLocations] = await Promise.all([
    getCachedStoreSettings(),
    getCachedSeoConfig(),
    getCachedMarketingConfig(),
    getCachedPaymentMethods(),
    getCachedPickupLocations(),
  ]);

  const rawData = {
    settings: {
      storeSettings: {
        storeName: settings?.storeName || "",
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
      seoConfig: seo ? {
        siteName: seo.siteName || "",
        titleSeparator: seo.titleSeparator || "|",
        siteUrl: seo.siteUrl || "",
        defaultMetaTitle: seo.defaultMetaTitle,
        defaultMetaDesc: seo.defaultMetaDesc,
        ogImage: seo.ogImage,
        twitterCard: seo.twitterCard || "summary_large_image",
        twitterSite: seo.twitterSite,
        themeColor: seo.themeColor,
        robotsTxtContent: seo.robotsTxtContent,
        organizationData: seo.organizationData,
        manifestJson: seo.manifestJson,
        ogMedia: seo.ogMedia,
      } : null,
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

  const cleanData = serializePrismaData(rawData);

  return (
    <GlobalStoreProvider
      settings={cleanData.settings}
      paymentMethods={cleanData.paymentMethods}
      pickupLocations={cleanData.pickupLocations}
    >
      <div className="w-full min-h-screen bg-[#f0f0f1] antialiased">
        {children}
      </div>
    </GlobalStoreProvider>
  );
}
