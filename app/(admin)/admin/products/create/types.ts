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
    status: string;
    isVirtual: boolean;
    isDownloadable: boolean;
    // ... (আগের সব ফিল্ড)

    // 🔥 NEW: Sale Schedule
    saleStart: string; // "YYYY-MM-DD"
    saleEnd: string;   // "YYYY-MM-DD"

    // 🔥 NEW: Download Settings
    downloadLimit: number | "";
    downloadExpiry: number | "";
    
    // Pricing
    price: number | "";
    salePrice: number | "";
    costPerItem: number | "";
    
    
    // Tax & Shipping
    taxStatus: string;
    taxRateId: string;       // NEW: Selected Tax Rate ID
    shippingClassId: string; // NEW: Selected Shipping Class ID
    
    // Inventory
    sku: string;
    barcode: string;
    trackQuantity: boolean;
    stock: number | "";

    // Inventory Advanced (NEW)
    lowStockThreshold: number | "";
    backorderStatus: string; // "DO_NOT_ALLOW" | "ALLOW" | "ALLOW_BUT_NOTIFY"
    soldIndividually: boolean;
    mpn: string;
    
    // Dimensions
    weight: string;
    length: string;
    width: string;
    height: string;
    
    // Shipping Advanced (NEW)
    hsCode: string;
    countryOfManufacture: string;
    isDangerousGood: boolean;

    // Relations & Organization
    category: string;
    vendor: string;
    tags: string[];
    collectionIds: string[]; // NEW: For Collections
    
    // Linked Products
    upsells: string[]; 
    crossSells: string[];
    
    // Media
    featuredImage: string | null;
    galleryImages: string[];
    digitalFiles: DigitalFile[]; // NEW: For Downloadable Products
    
    // Attributes & Variations
    attributes: Attribute[];
    variations: Variation[];
    
    // SEO & Meta
    metaTitle: string;
    metaDesc: string;
    seoCanonicalUrl: string; // NEW: Advanced SEO
    // seoSchema: string;    // Optional: If you want to accept JSON string for Schema
    
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