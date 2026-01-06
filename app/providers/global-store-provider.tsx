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
}

export interface SeoConfig {
  siteName: string;
  titleSeparator: string;
  defaultMetaTitle: string | null;
  defaultMetaDesc: string | null;
  ogImage: string | null;
  twitterCard: string;
  twitterSite: string | null;
}

export interface MarketingConfig {
  gtmEnabled: boolean;
  gtmContainerId: string | null;
  fbEnabled: boolean;
  fbPixelId: string | null;
  klaviyoEnabled: boolean;
  klaviyoPublicKey: string | null;
}

// ==========================================
// 2. CONTEXT STATE DEFINITION
// ==========================================

interface GlobalStoreContextType {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  logo: string | null;
  currency: string;
  symbol: string;
  weightUnit: string;
  dimensionUnit: string;
  
  address: StoreAddress;
  socials: SocialLinks;
  
  formatPrice: (price: number | string | null) => string;

  favicon: string | null;
  isMaintenanceMode: boolean;
  general: GeneralConfig;
  tax: TaxSettings;
  seo: SeoConfig;
  marketing: MarketingConfig;
}

// ==========================================
// 3. DEFAULT VALUES (FALLBACK)
// ==========================================

const defaultContext: GlobalStoreContextType = {
  storeName: "GoBike",
  storeEmail: "",
  storePhone: "",
  logo: null,
  currency: "AUD",
  symbol: "$",
  weightUnit: "kg",
  dimensionUnit: "cm",
  address: {},
  socials: {},
  formatPrice: () => "$0.00",
  favicon: null,
  isMaintenanceMode: false,
  general: { timezone: "UTC", dateFormat: "dd MMM yyyy", orderIdFormat: "#" },
  tax: { pricesIncludeTax: false, calculateTaxBasedOn: 'shipping', displayPricesInShop: 'exclusive', displayPricesDuringCart: 'exclusive' },
  seo: { siteName: "GoBike", titleSeparator: "|", defaultMetaTitle: null, defaultMetaDesc: null, ogImage: null, twitterCard: "summary_large_image", twitterSite: null },
  marketing: { gtmEnabled: false, gtmContainerId: null, fbEnabled: false, fbPixelId: null, klaviyoEnabled: false, klaviyoPublicKey: null },
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

  const formatPrice = (price: number | string | null) => {
    if (price === null || price === "") return "";
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: s.currency || "AUD",
      minimumFractionDigits: 2,
    }).format(numPrice);
  };

  const value = {
    storeName: s.storeName || "GoBike",
    storeEmail: s.storeEmail || "",
    storePhone: s.storePhone || "",
    logo: s.logo || null,
    
    currency: s.currency || "AUD",
    symbol: s.currencySymbol || "$",
    weightUnit: s.weightUnit || "kg",
    dimensionUnit: s.dimensionUnit || "cm",
    
    address: (s.storeAddress as StoreAddress) || {},
    socials: (s.socialLinks as SocialLinks) || {},
    
    formatPrice,

    favicon: s.favicon || null,
    isMaintenanceMode: s.maintenance || false,
    general: (s.generalConfig as GeneralConfig) || defaultContext.general,
    tax: (s.taxSettings as TaxSettings) || defaultContext.tax,
    seo: (s.seo as SeoConfig) || defaultContext.seo,
    marketing: (s.marketing as MarketingConfig) || defaultContext.marketing,
  };

  return (
    <GlobalStoreContext.Provider value={value}>
      {children}
    </GlobalStoreContext.Provider>
  );
}

// --- Custom Hook ---
export function useGlobalStore() {
  return useContext(GlobalStoreContext);
}