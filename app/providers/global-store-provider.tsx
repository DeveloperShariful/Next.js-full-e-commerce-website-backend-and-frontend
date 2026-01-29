// app/providers/global-store-provider.tsx

"use client";

import { createContext, useContext, ReactNode, useMemo } from "react";

// ==========================================
// 1. INTERFACES (UNCHANGED)
// ==========================================

export interface PickupLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string | null;
  postcode: string;
  country: string;
  instructions: string | null;
  openingHours: any;
}

export interface ActivePaymentMethod {
  identifier: string;
  name: string;
  icon: string | null;
  description?: string | null;
  mode: "TEST" | "LIVE";
  minOrderAmount?: number | null;
  maxOrderAmount?: number | null;
  surchargeEnabled: boolean;
  surchargeAmount: number;
  surchargeType: string;
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
  defaultCountry?: string;
  supportedLocales?: string[];
  headerScripts?: string;
  footerScripts?: string;
  enableWishlist?: boolean;
  enableReviews?: boolean;
  enableBlog?: boolean;
  enableGuestCheckout?: boolean;
  enableMultiCurrency?: boolean;
  enablePickup?: boolean;
  enableAffiliateProgram?: boolean;
  enableWallet?: boolean;
  enableGiftCards?: boolean;
}

export interface SeoConfig {
  siteName: string;
  titleSeparator: string;
  siteUrl: string;
  defaultMetaTitle: string | null;
  defaultMetaDesc: string | null;
  ogImage: string | null;
  twitterCard: string;
  twitterSite: string | null;
  themeColor?: string | null;
  robotsTxt?: string | null;
  organizationJson?: any;
  manifestJson?: any;
}

export interface VerificationConfig {
  googleSearchConsole?: string | null;
  facebookDomain?: string | null;
  pinterest?: string | null;
}

export interface MarketingConfig {
  gtmEnabled: boolean;
  gtmContainerId: string | null;
  gtmAuth: string | null;
  gtmPreview: string | null;
  fbEnabled: boolean;
  fbPixelId: string | null;
  klaviyoEnabled: boolean;
  klaviyoPublicKey: string | null;
  cookieConsentRequired?: boolean;
}

export interface StoreFeatures {
  enableWishlist: boolean;
  enableReviews: boolean;
  enableBlog: boolean;
  enableGuestCheckout: boolean;
  maintenanceMode: boolean;
  enableMultiCurrency: boolean;
  enablePickup: boolean;
  enableAffiliateProgram: boolean;
  enableWallet: boolean;
  enableGiftCards: boolean;
}

export interface AffiliateGlobalConfig {
  programName: string;          
  isActive: boolean;            
  referralParam: string;        
  termsUrl?: string | null;     

  cookieDuration: number;       
  allowSelfReferral: boolean;   

  excludeShipping: boolean;     
  excludeTax: boolean;          
  autoApplyCoupon: boolean;     
  zeroValueReferrals: boolean;  

  customSlugsEnabled: boolean;  
  autoCreateSlug: boolean;      
  slugLimit: number;            

  isLifetimeLinkOnPurchase: boolean; 
  lifetimeDuration: number | null;   

  holdingPeriod: number;        
  minimumPayout: number;        
  payoutMethods: string[];      

  enableMLM?: boolean;
  enableCreatives?: boolean;
  enableCampaigns?: boolean;
  enableAnnouncements?: boolean;
  enableContests?: boolean;
  enableFraudProtection?: boolean;
  enableGroups?: boolean;
  enableProductRates?: boolean;
  enableTiers?: boolean;
}

// ==========================================
// 2. CONTEXT & DTOs
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
  dateFormat: string; 
  timezone: string;   
  
  address: StoreAddress;
  socials: SocialLinks;
  
  

  activePaymentMethods: ActivePaymentMethod[];
  pickupLocations: PickupLocation[];

  formatPrice: (price: number | string | { toNumber: () => number } | null | undefined) => string;

  general: GeneralConfig;
  tax: TaxSettings;
  seo: SeoConfig;
  marketing: MarketingConfig;
  verifications: VerificationConfig;
  features: StoreFeatures;
  
  affiliate: AffiliateGlobalConfig;
}

const defaultContext: GlobalStoreContextType = {
  storeName: "",
  storeEmail: "",
  storePhone: "",
  logo: null,
  favicon: null,
  primaryColor: "",
  currency: "",
  symbol: "",
  locale: "en-US",
  weightUnit: "",
  dimensionUnit: "",
  dateFormat: " ",
  timezone: " ",
  address: {},
  socials: {},
  
  activePaymentMethods: [],
  pickupLocations: [],
  formatPrice: () => "",
  general: { timezone: "UTC", dateFormat: "dd/MM/yyyy", orderIdFormat: "#", defaultCountry: "AU" },
  tax: { pricesIncludeTax: false, calculateTaxBasedOn: 'shipping', displayPricesInShop: 'exclusive', displayPricesDuringCart: 'exclusive' },
  seo: { siteName: "", titleSeparator: "|", siteUrl: "", defaultMetaTitle: null, defaultMetaDesc: null, ogImage: null, twitterCard: "summary", twitterSite: null },
  marketing: { gtmEnabled: false, gtmContainerId: null, gtmAuth: null, gtmPreview: null, fbEnabled: false, fbPixelId: null, klaviyoEnabled: false, klaviyoPublicKey: null },
  verifications: {},
  features: { 
    enableWishlist: false, 
    enableReviews: false, 
    enableBlog: false, 
    enableGuestCheckout: false, 
    maintenanceMode: false, 
    enableMultiCurrency: false, 
    enablePickup: false, 
    enableAffiliateProgram: false,
    enableWallet: false,
    enableGiftCards: false 
  },
  
  affiliate: {
    programName: "Affiliate Program",
    isActive: false,
    referralParam: " ",
    termsUrl: null,
    
    cookieDuration: 30,
    allowSelfReferral: false,
    
    excludeShipping: true,
    excludeTax: true,
    autoApplyCoupon: false,
    zeroValueReferrals: false,
    
    customSlugsEnabled: false,
    autoCreateSlug: false,
    slugLimit: 5,
    
    isLifetimeLinkOnPurchase: false,
    lifetimeDuration: null,
    
    holdingPeriod: 14,
    minimumPayout: 50,
    payoutMethods: [" "],

    enableMLM: false,
    enableCreatives: true,
    enableCampaigns: true,
    enableAnnouncements: true,
    enableContests: false,
    enableFraudProtection: true,
    enableGroups: false,
    enableProductRates: false,
    enableTiers: true,
  }
};

const GlobalStoreContext = createContext<GlobalStoreContextType>(defaultContext);

interface StoreSettingsDTO {
  storeName: string;
  storeEmail?: string | null;
  storePhone?: string | null;
  currency: string;
  currencySymbol: string;
  weightUnit: string;
  dimensionUnit: string;
  logo?: string | null;
  favicon?: string | null;
  maintenance: boolean;
  storeAddress?: StoreAddress | null;
  socialLinks?: SocialLinks | null;
  generalConfig?: any;
  taxSettings?: any;
  affiliateConfig?: any; 
  logoMedia?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
    mimeType?: string;
  } | null;
  faviconMedia?: {
    url: string;
  } | null;
  emailConfig?: {
    baseColor?: string | null;
  } | null;
}

interface SeoConfigDTO {
  siteName: string;
  titleSeparator: string;
  siteUrl: string;
  defaultMetaTitle?: string | null;
  defaultMetaDesc?: string | null;
  ogImage?: string | null;
  twitterCard: string;
  twitterSite?: string | null;
  themeColor?: string | null;
  robotsTxtContent?: string | null;
  organizationData?: any;
  manifestJson?: any;
  ogMedia?: {
    url: string;
  } | null;
}

interface MarketingConfigDTO {
  gtmEnabled: boolean;
  gtmContainerId?: string | null;
  gtmAuth?: string | null;
  gtmPreview?: string | null;
  fbEnabled: boolean;
  fbPixelId?: string | null;
  klaviyoEnabled: boolean;
  klaviyoPublicKey?: string | null;
  cookieConsentRequired?: boolean;
  gscVerificationCode?: string | null;
  fbDomainVerification?: string | null;
  pinterest?: string | null;
}


interface PaymentMethodDTO {
  identifier: string;
  name: string;
  isEnabled: boolean;
  displayOrder: number;
  mode: "TEST" | "LIVE";
  icon?: string | null;
  description?: string | null;
  minOrderAmount?: number | string | null;
  maxOrderAmount?: number | string | null;
  surchargeEnabled?: boolean;
  surchargeAmount?: number | string | null;
  surchargeType?: string;
}

interface PickupLocationDTO {
  id: string;
  name: string;
  address: string;
  city: string;
  state?: string | null;
  postcode: string;
  country: string;
  instructions?: string | null;
  isActive: boolean;
  openingHours?: any;
}

interface ProviderSettings {
  storeSettings: StoreSettingsDTO | null;
  seoConfig: SeoConfigDTO | null;
  marketingConfig: MarketingConfigDTO | null;
}

interface ProviderProps {
  children: ReactNode;
  settings: ProviderSettings;
  paymentMethods?: PaymentMethodDTO[];
  pickupLocations?: PickupLocationDTO[];
}

// ==========================================
// 3. PROVIDER COMPONENT
// ==========================================

export function GlobalStoreProvider({ 
  children, 
  settings,
  paymentMethods = [],
  pickupLocations = []
}: ProviderProps) {
  
  const s = settings?.storeSettings || {} as StoreSettingsDTO;
  const seoData = settings?.seoConfig || {} as SeoConfigDTO;
  const mktData = settings?.marketingConfig || {} as MarketingConfigDTO;

  const generalConfig = (s.generalConfig as GeneralConfig) || {};
  const taxSettings = (s.taxSettings as TaxSettings) || {};
  const activeLocale = generalConfig.locale || "";

  // =========================================================
  // FIXED: PRICE FORMATTING LOGIC
  // =========================================================

  const formatPrice = useMemo(() => (price: number | string | { toNumber: () => number } | null | undefined) => {
    if (price === null || price === "" || price === undefined) return "";
    let numPrice: number = 0;
    if (typeof price === 'object' && price !== null && 'toNumber' in price) {
      numPrice = price.toNumber(); 
    } else if (typeof price === 'string') {
      numPrice = parseFloat(price);
    } else if (typeof price === 'number') {
      numPrice = price;
    }

    if (isNaN(numPrice)) numPrice = 0;
    
    const currencySymbol = s.currencySymbol ? s.currencySymbol : "";

    try {
      const formattedNumber = new Intl.NumberFormat(activeLocale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        style: 'decimal' 
      }).format(numPrice);

      return `${currencySymbol}${formattedNumber}`;
      
    } catch (e) {
      return `${currencySymbol}${numPrice.toFixed(2)}`;
    }
  }, [activeLocale, s.currencySymbol]); 

  // =========================================================
  
  const logoData: StoreMedia | null = s.logoMedia 
    ? {
        url: s.logoMedia.url,
        altText: s.logoMedia.altText || s.storeName,
        width: s.logoMedia.width,
        height: s.logoMedia.height,
        mimeType: s.logoMedia.mimeType as string
      }
    : (s.logo ? { url: s.logo } : null);

  const faviconUrl: string | null = s.faviconMedia?.url || s.favicon || null;

  const processedPayments = useMemo(() => {
    if (!Array.isArray(paymentMethods)) return [];
    return paymentMethods
      .filter((pm) => pm.isEnabled)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((pm) => {
        let minAmt = 0;
        let maxAmt = 0;
        let surAmt = 0;

        const safeNum = (val: any) => {
           if(typeof val === 'number') return val;
           if(typeof val === 'string') return parseFloat(val);
           if(val && typeof val === 'object' && 'toNumber' in val) return val.toNumber();
           return 0;
        };

        minAmt = safeNum(pm.minOrderAmount);
        maxAmt = safeNum(pm.maxOrderAmount);
        surAmt = safeNum(pm.surchargeAmount);

        return {
          identifier: pm.identifier,
          name: pm.name,
          icon: pm.icon || null,
          description: pm.description,
          mode: pm.mode,
          minOrderAmount: minAmt || null,
          maxOrderAmount: maxAmt || null,
          surchargeEnabled: pm.surchargeEnabled || false,
          surchargeAmount: surAmt,
          surchargeType: pm.surchargeType || ''
        };
      });
  }, [paymentMethods]);

  const processedPickups = useMemo(() => {
    if (!Array.isArray(pickupLocations)) return [];
    return pickupLocations
      .filter((pl) => pl.isActive)
      .map((pl) => ({
        id: pl.id,
        name: pl.name,
        address: pl.address,
        city: pl.city,
        state: pl.state || null,
        postcode: pl.postcode,
        country: pl.country,
        instructions: pl.instructions || null,
        openingHours: pl.openingHours
      }));
  }, [pickupLocations]);

  const affiliateRaw = s.affiliateConfig || {};
  
  const affiliateConfig: AffiliateGlobalConfig = {
    programName: affiliateRaw.programName || "Affiliate Program",
    isActive: generalConfig.enableAffiliateProgram ?? false,
    referralParam: affiliateRaw.referralParam || " ",
    termsUrl: affiliateRaw.termsUrl || null,

    cookieDuration: Number(affiliateRaw.cookieDuration) || 30,
    allowSelfReferral: affiliateRaw.allowSelfReferral ?? false,

    excludeShipping: affiliateRaw.excludeShipping ?? true, 
    excludeTax: affiliateRaw.excludeTax ?? true,           
    autoApplyCoupon: affiliateRaw.autoApplyCoupon ?? false,
    zeroValueReferrals: affiliateRaw.zeroValueReferrals ?? false,

    customSlugsEnabled: affiliateRaw.customSlugsEnabled ?? false,
    autoCreateSlug: affiliateRaw.autoCreateSlug ?? false,
    slugLimit: Number(affiliateRaw.slugLimit) || 5,

    isLifetimeLinkOnPurchase: affiliateRaw.isLifetimeLinkOnPurchase ?? false,
    lifetimeDuration: affiliateRaw.lifetimeDuration ? Number(affiliateRaw.lifetimeDuration) : null,

    holdingPeriod: Number(affiliateRaw.holdingPeriod) || 14,
    minimumPayout: Number(affiliateRaw.minimumPayout) || 50,
    payoutMethods: Array.isArray(affiliateRaw.payoutMethods) 
      ? affiliateRaw.payoutMethods 
      : ["BANK_TRANSFER", "STORE_CREDIT"],

    enableMLM: affiliateRaw.enableMLM ?? false,
    enableCreatives: affiliateRaw.enableCreatives ?? true,
    enableCampaigns: affiliateRaw.enableCampaigns ?? true,
    enableAnnouncements: affiliateRaw.enableAnnouncements ?? true,
    enableContests: affiliateRaw.enableContests ?? false,
    enableFraudProtection: affiliateRaw.enableFraudProtection ?? true,
    enableGroups: affiliateRaw.enableGroups ?? false,
    enableProductRates: affiliateRaw.enableProductRates ?? false,
    enableTiers: affiliateRaw.enableTiers ?? true,
  };

  const value: GlobalStoreContextType = {
    storeName: s.storeName || "",
    storeEmail: s.storeEmail || "",
    storePhone: s.storePhone || "",
    
    logo: logoData,
    favicon: faviconUrl,
    primaryColor: seoData.themeColor || s.emailConfig?.baseColor || "", 
    
    currency: s.currency || "",
    symbol: s.currencySymbol || "",
    locale: activeLocale,
    weightUnit: s.weightUnit || "",
    dimensionUnit: s.dimensionUnit || "",
    dateFormat: generalConfig.dateFormat || "",
    timezone: generalConfig.timezone || " ",
    
    address: (s.storeAddress as StoreAddress) || {},
    socials: (s.socialLinks as SocialLinks) || {},

  

    activePaymentMethods: processedPayments,
    pickupLocations: processedPickups,
    
    formatPrice,

    general: {
      timezone: generalConfig.timezone || " ",
      dateFormat: generalConfig.dateFormat || " ",
      orderIdFormat: generalConfig.orderIdFormat || "#",
      locale: activeLocale,
      defaultCountry: generalConfig.defaultCountry || " ",
      supportedLocales: generalConfig.supportedLocales || [],
      headerScripts: generalConfig.headerScripts || "",
      footerScripts: generalConfig.footerScripts || "",
    },

    tax: taxSettings,
    
    seo: {
      siteName: seoData.siteName || s.storeName || "",
      titleSeparator: seoData.titleSeparator || "|",
      siteUrl: seoData.siteUrl || "",
      defaultMetaTitle: seoData.defaultMetaTitle || null,
      defaultMetaDesc: seoData.defaultMetaDesc || null,
      ogImage: seoData.ogMedia?.url || seoData.ogImage || null,
      twitterCard: seoData.twitterCard || " ",
      twitterSite: seoData.twitterSite || null,
      themeColor: seoData.themeColor || null,
      robotsTxt: seoData.robotsTxtContent || null,
      organizationJson: seoData.organizationData || null,
      manifestJson: seoData.manifestJson || null,
    },
    
    marketing: {
      gtmEnabled: mktData.gtmEnabled || false,
      gtmContainerId: mktData.gtmContainerId || null,
      gtmAuth: mktData.gtmAuth || null,
      gtmPreview: mktData.gtmPreview || null,
      fbEnabled: mktData.fbEnabled || false,
      fbPixelId: mktData.fbPixelId || null,
      klaviyoEnabled: mktData.klaviyoEnabled || false,
      klaviyoPublicKey: mktData.klaviyoPublicKey || null,
      cookieConsentRequired: mktData.cookieConsentRequired || false,
    },

    verifications: {
      googleSearchConsole: mktData.gscVerificationCode || null,
      facebookDomain: mktData.fbDomainVerification || null,
      pinterest: mktData.pinterest || null,
    },

    features: {
      enableWishlist: generalConfig.enableWishlist ?? false,
      enableReviews: generalConfig.enableReviews ?? false,
      enableBlog: generalConfig.enableBlog ?? false,
      enableGuestCheckout: generalConfig.enableGuestCheckout ?? false,
      maintenanceMode: s.maintenance || false,
      enableMultiCurrency: generalConfig.enableMultiCurrency ?? false,
      enablePickup: generalConfig.enablePickup ?? false,
      enableAffiliateProgram: generalConfig.enableAffiliateProgram ?? false,
      enableWallet: generalConfig.enableWallet ?? false,
      enableGiftCards: generalConfig.enableGiftCards ?? false,
    },

    affiliate: affiliateConfig
  };

  return (
    <GlobalStoreContext.Provider value={value}>
      {children}
    </GlobalStoreContext.Provider>
  );
}

// ==========================================
// 4. HOOK
// ==========================================

export function useGlobalStore() {
  const context = useContext(GlobalStoreContext);
  if (!context) {
    throw new Error("useGlobalStore must be used within a GlobalStoreProvider");
  }
  return context;
}