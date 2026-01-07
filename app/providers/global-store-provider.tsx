// app/providers/global-store-provider.tsx

"use client";

import { createContext, useContext, ReactNode, useMemo } from "react";

// ==========================================
// 1. TYPE DEFINITIONS & INTERFACES
// ==========================================

export interface MenuItem {
  id: string;
  label: string;
  url: string;
  target?: "_self" | "_blank";
  children?: MenuItem[];
  type?: "category" | "page" | "custom";
}

export interface StoreBanner {
  id: string;
  title: string;
  image: string;
  link: string | null;
  position: number;
}

export interface ActivePaymentMethod {
  identifier: string;
  name: string;
  icon: string | null;
  description?: string | null;
}

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
  mimeType?: string;
}

export interface TaxSettings {
  pricesIncludeTax: boolean;
  calculateTaxBasedOn: 'shipping' | 'billing' | 'shop';
  displayPricesInShop: 'inclusive' | 'exclusive';
  displayPricesDuringCart: 'inclusive' | 'exclusive';
  defaultRate?: number; 
}

export interface GeneralConfig {
  timezone: string;
  dateFormat: string;
  orderIdFormat: string;
  locale?: string;
  supportedLocales?: string[];
  headerScripts?: string;
  footerScripts?: string;
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
  cookieConsentRequired?: boolean; // [ADDED]
}

export interface StoreFeatures {
  enableWishlist: boolean;
  enableReviews: boolean;
  enableBlog: boolean;
  enableGuestCheckout: boolean;
  maintenanceMode: boolean;
  enableMultiCurrency?: boolean;
  enablePickup?: boolean;
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
  
  // [ADDED] New Dynamic Data
  menus: Record<string, MenuItem[]>;
  activeBanners: StoreBanner[];
  activePaymentMethods: ActivePaymentMethod[];

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
  
  // [ADDED] Defaults
  menus: {},
  activeBanners: [],
  activePaymentMethods: [],

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
  // [ADDED] Optional props so existing usage doesn't break
  menus?: any[]; 
  banners?: any[];
  paymentMethods?: any[];
}

export function GlobalStoreProvider({ 
  children, 
  settings, 
  menus = [], 
  banners = [], 
  paymentMethods = [] 
}: ProviderProps) {
  
  const s = settings || {};
  const seoData = s.seoConfig || {};
  const mktData = s.marketingIntegration || {};
  
  const activeLocale = s.generalConfig?.locale || "en-AU";

  // [UPDATED] Use useMemo for performance, logic remains same
  const formatPrice = useMemo(() => (price: number | string | null) => {
    if (price === null || price === "" || price === undefined) return "";
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    
    return new Intl.NumberFormat(activeLocale, {
      style: "currency",
      currency: s.currency || "AUD",
      minimumFractionDigits: 2,
    }).format(numPrice);
  }, [activeLocale, s.currency]);

  const logoData: StoreMedia | null = s.logoMedia 
    ? {
        url: s.logoMedia.url,
        altText: s.logoMedia.altText || s.storeName,
        width: s.logoMedia.width,
        height: s.logoMedia.height,
        mimeType: s.logoMedia.mimeType // [ADDED]
      }
    : (s.logo ? { url: s.logo } : null);

  // [ADDED] Logic to process Menus
  const processedMenus = useMemo(() => {
    const map: Record<string, MenuItem[]> = {};
    if (Array.isArray(menus)) {
        menus.forEach((menu: any) => {
          if (menu.isActive) {
            map[menu.slug] = menu.items as MenuItem[];
          }
        });
    }
    return map;
  }, [menus]);

  // [ADDED] Logic to process Banners
  const processedBanners = useMemo(() => {
    if (!Array.isArray(banners)) return [];
    return banners
      .filter((b: any) => b.isActive)
      .sort((a: any, b: any) => a.position - b.position)
      .map((b: any) => ({
        id: b.id,
        title: b.title,
        image: b.media?.url || b.image,
        link: b.link,
        position: b.position
      }));
  }, [banners]);

  // [ADDED] Logic to process Payment Methods
  const processedPayments = useMemo(() => {
    if (!Array.isArray(paymentMethods)) return [];
    return paymentMethods
      .filter((pm: any) => pm.isEnabled)
      .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
      .map((pm: any) => ({
        identifier: pm.identifier,
        name: pm.name,
        icon: pm.icon,
        description: pm.description
      }));
  }, [paymentMethods]);

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

    // [ADDED] New Values
    menus: processedMenus,
    activeBanners: processedBanners,
    activePaymentMethods: processedPayments,
    
    formatPrice,

    general: {
      timezone: s.generalConfig?.timezone || defaultContext.general.timezone,
      dateFormat: s.generalConfig?.dateFormat || defaultContext.general.dateFormat,
      orderIdFormat: s.generalConfig?.orderIdFormat || defaultContext.general.orderIdFormat,
      locale: activeLocale,
      supportedLocales: s.generalConfig?.supportedLocales || ["en-AU"], // [ADDED]
      headerScripts: s.generalConfig?.headerScripts || "", // [ADDED]
      footerScripts: s.generalConfig?.footerScripts || "", // [ADDED]
    },

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
      cookieConsentRequired: mktData.cookieConsentRequired || false, // [ADDED]
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
      enableMultiCurrency: s.generalConfig?.enableMultiCurrency || false, // [ADDED]
      enablePickup: s.generalConfig?.enablePickup || false, // [ADDED]
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
  const context = useContext(GlobalStoreContext);
  if (!context) {
    throw new Error("useGlobalStore must be used within a GlobalStoreProvider");
  }
  return context;
}