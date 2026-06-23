// lib/build-global-data.ts
// Single source of truth for building GlobalStoreProvider data.
// Called from admin, my-account, and affiliates layouts.

import {
  ProviderSettings,
  PaymentMethodDTO,
  PickupLocationDTO,
  StoreAddress,
  SocialLinks,
  GeneralConfig,
  TaxSettings,
  AffiliateConfigRaw,
} from "@/app/providers/global-store-provider";
import {
  getCachedStoreSettings,
  getCachedSeoConfig,
  getCachedMarketingConfig,
  getCachedPaymentMethods,
  getCachedPickupLocations,
} from "@/lib/global-settings-cache";

export interface GlobalStoreData {
  settings: ProviderSettings;
  paymentMethods: PaymentMethodDTO[];
  pickupLocations: PickupLocationDTO[];
}

export async function buildGlobalStoreData(): Promise<GlobalStoreData> {
  const [settings, seo, marketing, paymentMethods, pickupLocations] =
    await Promise.all([
      getCachedStoreSettings(),
      getCachedSeoConfig(),
      getCachedMarketingConfig(),
      getCachedPaymentMethods(),
      getCachedPickupLocations(),
    ]);

  return {
    settings: {
      storeSettings: {
        storeName: settings?.storeName || "My Store",
        storeEmail: settings?.storeEmail,
        storePhone: settings?.storePhone,
        currency: settings?.currency || "",
        currencySymbol: settings?.currencySymbol || "",
        weightUnit: settings?.weightUnit || "",
        dimensionUnit: settings?.dimensionUnit || "",
        logo: settings?.logo,
        favicon: settings?.favicon,
        maintenance: settings?.maintenance || false,
        storeAddress: settings?.storeAddress as unknown as StoreAddress | null,
        socialLinks: settings?.socialLinks as unknown as SocialLinks | null,
        generalConfig: settings?.generalConfig as unknown as GeneralConfig | null,
        taxSettings: settings?.taxSettings as unknown as TaxSettings | null,
        affiliateConfig: settings?.affiliateConfig as unknown as AffiliateConfigRaw | null,
        logoMedia: settings?.logoMedia,
        faviconMedia: settings?.faviconMedia,
      },
      seoConfig: seo
        ? {
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
            organizationData: seo.organizationData as unknown as Record<string, unknown> | null,
            manifestJson: seo.manifestJson as unknown as Record<string, unknown> | null,
            ogMedia: seo.ogMedia,
          }
        : null,
      marketingConfig: marketing
        ? {
            gtmEnabled: marketing.gtmEnabled,
            gtmContainerId: marketing.gtmContainerId,
            gtmAuth: marketing.gtmAuth,
            gtmPreview: marketing.gtmPreview,
            fbEnabled: marketing.fbEnabled,
            fbPixelId: marketing.fbPixelId,
            klaviyoEnabled: marketing.klaviyoEnabled,
            klaviyoPublicKey: marketing.klaviyoPublicKey,
            gscVerificationCode: marketing.gscVerificationCode,
            fbDomainVerification: marketing.fbDomainVerification,
          }
        : null,
    },
    paymentMethods: (paymentMethods || []) as unknown as PaymentMethodDTO[],
    pickupLocations: (pickupLocations || []) as unknown as PickupLocationDTO[],
  };
}
