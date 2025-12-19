// File: app/admin/settings/shipping/types.ts

export interface ShippingRate {
    id: string;
    name: string;
    type: string; // 'FLAT_RATE', 'FREE_SHIPPING', 'LOCAL_PICKUP', etc.
    price: number;
    minPrice?: number | null;
    minWeight?: number | null;
    maxWeight?: number | null;
    taxStatus?: string; 
    freeShippingRequirement?: string | null;
}

export interface ShippingZone {
    id: string;
    name: string;
    countries: string[];
    rates: ShippingRate[];
}

export interface ShippingClass {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    _count?: {
        products: number;
    };
}

// ✅ UPDATED: Added allowedCountries to filter list
export interface ShippingOptionsData {
    enableShippingCalc: boolean;
    hideShippingCosts: boolean;
    shippingDestination: string;
    
    // New Fields for Filtering
    sellingLocation: string;
    sellingCountries: string[];
    shippingLocation: string;
    shippingCountries: string[];
}

export interface ComponentProps {
    zones: ShippingZone[];
    classes: ShippingClass[];
    options: ShippingOptionsData;
    refreshData: () => void;
}