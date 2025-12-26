// app/admin/products/create/types.ts

export interface Attribute {
    id: string;
    name: string;
    values: string[];
    visible: boolean;
    variation: boolean;
}

export interface Variation {
    id: string;
    name: string;
    price: number;
    stock: number;
    sku: string;
    attributes: Record<string, string>;
}

export interface DigitalFile {
    id?: string;
    name: string;
    url: string;
}

export interface ProductFormData {
    id?: string;
    name: string;
    slug: string;
    description: string;
    shortDescription: string;
    productType: string;
    status: string; // UI তে স্ট্রিং হিসেবে হ্যান্ডেল করা সহজ
    isVirtual: boolean;
    isDownloadable: boolean;
    
    // Sale Schedule
    saleStart: string; 
    saleEnd: string;   

    // Download Settings
    downloadLimit: number | "";
    downloadExpiry: number | "";
    
    // Pricing
    price: number | "";
    salePrice: number | "";
    costPerItem: number | "";
    
    // Tax & Shipping
    taxStatus: string;
    taxRateId: string;      
    shippingClassId: string; 
    
    // Inventory
    sku: string;
    barcode: string;
    trackQuantity: boolean;
    stock: number | "";

    // Inventory Advanced
    lowStockThreshold: number | "";
    backorderStatus: string; 
    soldIndividually: boolean;
    mpn: string;
    
    // Dimensions
    weight: string;
    length: string;
    width: string;
    height: string;
    
    // Shipping Advanced
    hsCode: string;
    countryOfManufacture: string;
    isDangerousGood: boolean;

    // Relations & Organization
    category: string;
    vendor: string;
    tags: string[];
    collectionIds: string[]; 
    
    // Linked Products
    upsells: string[]; 
    crossSells: string[];
    
    // Media
    featuredImage: string | null;
    galleryImages: string[];
    digitalFiles: DigitalFile[]; 
    
    // Attributes & Variations
    attributes: Attribute[];
    variations: Variation[];
    
    // SEO & Meta
    metaTitle: string;
    metaDesc: string;
    seoCanonicalUrl: string; 
    
    purchaseNote: string;
    menuOrder: number;
    enableReviews: boolean;
}

export interface ComponentProps {
    data: ProductFormData;
    updateData: (field: keyof ProductFormData, value: any) => void;
    loading?: boolean;
    onSubmit?: (e?: React.FormEvent) => void;
}