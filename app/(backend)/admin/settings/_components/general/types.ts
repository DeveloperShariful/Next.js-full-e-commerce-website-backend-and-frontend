// File: app/admin/settings/general/types.ts

export interface GeneralSettingsData {
    storeName: string;
    storeEmail: string;
    storePhone: string;
    
    storeAddress: {
        address1: string;
        address2: string;
        city: string;
        country: string; // e.g., "AU:NSW"
        postcode: string;
    };

    generalConfig: {
        sellingLocation: string; // 'all', 'all_except', 'specific'
        sellingCountries: string[]; // List of country codes
        shippingLocation: string; // 'all', 'specific', 'all_selling'
        shippingCountries: string[];
        defaultCustomerLocation: string; // 'shop_base', 'no_address', 'geoip'
        enableCoupons: boolean;
        calcCouponsSequentially: boolean; // New field
    };

    taxSettings: {
        enableTax: boolean;
        pricesIncludeTax: boolean;
    };

    currencyOptions: {
        currency: string;
        currencyPosition: string; // 'left', 'right', 'left_space', 'right_space'
        thousandSeparator: string;
        decimalSeparator: string;
        numDecimals: number;
    };
}

export interface ComponentProps {
    data: GeneralSettingsData;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    updateNestedData: (section: keyof GeneralSettingsData, field: string, value: any) => void;
}