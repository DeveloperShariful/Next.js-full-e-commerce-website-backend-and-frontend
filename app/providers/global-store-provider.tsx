//app/providers/global-store-provider.tsx

"use client";

import { createContext, useContext, ReactNode } from "react";

// --- Types Definition (Based on Schema) ---

interface StoreAddress {
  address1?: string;
  address2?: string;
  city?: string;
  country?: string;
  postcode?: string;
}

interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  linkedin?: string;
}

interface GlobalStoreContextType {
  // Identity
  storeName: string;
  storeEmail: string;
  storePhone: string;
  logo: string | null;
  
  // Settings
  currency: string;
  symbol: string;
  weightUnit: string;
  dimensionUnit: string;
  
  // Objects
  address: StoreAddress;
  socials: SocialLinks;
  
  // Helpers
  formatPrice: (price: number | string | null) => string;
}

// Default Values (Safety fallback)
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
};

const GlobalStoreContext = createContext<GlobalStoreContextType>(defaultContext);

// --- Provider Component ---

interface ProviderProps {
  children: ReactNode;
  settings: any; // Raw data from DB
}

export function GlobalStoreProvider({ children, settings }: ProviderProps) {
  
  const s = settings || {};

  // Helper: Format Price
  const formatPrice = (price: number | string | null) => {
    if (price === null || price === "") return "";
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: s.currency || "AUD",
      minimumFractionDigits: 2,
    }).format(numPrice);
  };

  // Construct Value Object
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
    
    formatPrice
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