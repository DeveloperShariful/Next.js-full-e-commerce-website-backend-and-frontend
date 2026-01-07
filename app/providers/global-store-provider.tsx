//app/providers/global-store-provider.tsx

"use client";

import { createContext, useContext, ReactNode } from "react";

// ==========================================
// 1. TYPE DEFINITIONS & INTERFACES
// ==========================================

export interface StoreAddress {
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  email?: string;
  phone?: string;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  linkedin?: string;
  tiktok?: string;
  pinterest?: string;
}

export interface StoreMedia {
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface TaxSettings {
  pricesIncludeTax: boolean;
  calculateTaxBasedOn: 'shipping' | 'billing' | 'shop';
  displayPricesInShop: 'inclusive' | 'exclusive';
  displayPricesDuringCart: 'inclusive' | 'exclusive';
}

export interface GeneralConfig {
  timezone: string;
  dateFormat: string;
  orderIdFormat: string;
  locale?: string;
}

export interface SeoConfig {
  siteName: string;
  titleSeparator: string;
  defaultMetaTitle: string | null;
  defaultMetaDesc: string | null;
  ogImage: string | null;
  twitterCard: string;
  twitterSite: string | null;
  themeColor?: string | null;
  robotsTxt?: string | null;
  organizationJson?: any;
}

export interface VerificationConfig {
  googleSearchConsole?: string | null;
  facebookDomain?: string | null;
  pinterest?: string | null;
}

export interface MarketingConfig {
  gtmEnabled: boolean;
  gtmContainerId: string | null;
  fbEnabled: boolean;
  fbPixelId: string | null;
  klaviyoEnabled: boolean;
  klaviyoPublicKey: string | null;
}

export interface StoreFeatures {
  enableWishlist: boolean;
  enableReviews: boolean;
  enableBlog: boolean;
  enableGuestCheckout: boolean;
  maintenanceMode: boolean;
}

// ==========================================
// 2. CONTEXT STATE DEFINITION
// ==========================================

interface GlobalStoreContextType {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  
  logo: StoreMedia | null;
  favicon: string | null;
  primaryColor: string;
  
  currency: string;
  symbol: string;
  locale: string;
  weightUnit: string;
  dimensionUnit: string;
  
  address: StoreAddress;
  socials: SocialLinks;
  
  formatPrice: (price: number | string | null) => string;

  general: GeneralConfig;
  tax: TaxSettings;
  seo: SeoConfig;
  marketing: MarketingConfig;
  verifications: VerificationConfig;
  features: StoreFeatures;
}

// ==========================================
// 3. DEFAULT VALUES (FALLBACK)
// ==========================================

const defaultContext: GlobalStoreContextType = {
  storeName: "GoBike",
  storeEmail: "",
  storePhone: "",
  logo: null,
  favicon: null,
  primaryColor: "#2271b1",
  currency: "AUD",
  symbol: "$",
  locale: "en-AU",
  weightUnit: "kg",
  dimensionUnit: "cm",
  address: {},
  socials: {},
  formatPrice: () => "$0.00",
  general: { timezone: "UTC", dateFormat: "dd MMM yyyy", orderIdFormat: "#", locale: "en-AU" },
  tax: { pricesIncludeTax: false, calculateTaxBasedOn: 'shipping', displayPricesInShop: 'exclusive', displayPricesDuringCart: 'exclusive' },
  seo: { siteName: "GoBike", titleSeparator: "|", defaultMetaTitle: null, defaultMetaDesc: null, ogImage: null, twitterCard: "summary_large_image", twitterSite: null },
  marketing: { gtmEnabled: false, gtmContainerId: null, fbEnabled: false, fbPixelId: null, klaviyoEnabled: false, klaviyoPublicKey: null },
  verifications: {},
  features: { enableWishlist: true, enableReviews: true, enableBlog: true, enableGuestCheckout: true, maintenanceMode: false },
};

const GlobalStoreContext = createContext<GlobalStoreContextType>(defaultContext);

// ==========================================
// 4. PROVIDER COMPONENT
// ==========================================

interface ProviderProps {
  children: ReactNode;
  settings: any; 
}

export function GlobalStoreProvider({ children, settings }: ProviderProps) {
  
  const s = settings || {};
  const seoData = s.seoConfig || {};
  const mktData = s.marketingIntegration || {};
  
  const activeLocale = s.generalConfig?.locale || "en-AU";

  const formatPrice = (price: number | string | null) => {
    if (price === null || price === "") return "";
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    
    return new Intl.NumberFormat(activeLocale, {
      style: "currency",
      currency: s.currency || "AUD",
      minimumFractionDigits: 2,
    }).format(numPrice);
  };

  const logoData: StoreMedia | null = s.logoMedia 
    ? {
        url: s.logoMedia.url,
        altText: s.logoMedia.altText || s.storeName,
        width: s.logoMedia.width,
        height: s.logoMedia.height
      }
    : (s.logo ? { url: s.logo } : null);

  const value = {
    storeName: s.storeName || "GoBike",
    storeEmail: s.storeEmail || "",
    storePhone: s.storePhone || "",
    
    logo: logoData,
    favicon: s.favicon || null,
    primaryColor: seoData.themeColor || s.emailConfig?.baseColor || "#2271b1",
    
    currency: s.currency || "AUD",
    symbol: s.currencySymbol || "$",
    locale: activeLocale,
    weightUnit: s.weightUnit || "kg",
    dimensionUnit: s.dimensionUnit || "cm",
    
    address: (s.storeAddress as StoreAddress) || {},
    socials: (s.socialLinks as SocialLinks) || {},
    
    formatPrice,

    general: (s.generalConfig as GeneralConfig) || defaultContext.general,
    tax: (s.taxSettings as TaxSettings) || defaultContext.tax,
    
    seo: {
      siteName: seoData.siteName || "GoBike",
      titleSeparator: seoData.titleSeparator || "|",
      defaultMetaTitle: seoData.defaultMetaTitle || null,
      defaultMetaDesc: seoData.defaultMetaDesc || null,
      ogImage: seoData.ogMedia?.url || seoData.ogImage || null,
      twitterCard: seoData.twitterCard || "summary_large_image",
      twitterSite: seoData.twitterSite || null,
      themeColor: seoData.themeColor || null,
      robotsTxt: seoData.robotsTxtContent || null,
      organizationJson: seoData.organizationData || null,
    },
    
    marketing: {
      gtmEnabled: mktData.gtmEnabled || false,
      gtmContainerId: mktData.gtmContainerId || null,
      fbEnabled: mktData.fbEnabled || false,
      fbPixelId: mktData.fbPixelId || null,
      klaviyoEnabled: mktData.klaviyoEnabled || false,
      klaviyoPublicKey: mktData.klaviyoPublicKey || null,
    },

    verifications: {
      googleSearchConsole: mktData.gscVerificationCode || null,
      facebookDomain: mktData.fbDomainVerification || null,
    },

    features: {
      enableWishlist: true,
      enableReviews: true,
      enableBlog: true,
      enableGuestCheckout: true,
      maintenanceMode: s.maintenance || false,
    }
  };

  return (
    <GlobalStoreContext.Provider value={value}>
      {children}
    </GlobalStoreContext.Provider>
  );
}

// ==========================================
// 5. CUSTOM HOOK
// ==========================================

export function useGlobalStore() {
  return useContext(GlobalStoreContext);
}