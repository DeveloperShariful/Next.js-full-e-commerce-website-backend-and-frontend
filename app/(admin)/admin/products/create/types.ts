// app/admin/products/create/types.ts

export interface Attribute {
    id: string;
    name: string;
    values: string[];
    visible: boolean;
    variation: boolean;
    // 🔥 NEW: Attribute Position (Schema: position)
    position: number;
}

export interface Variation {
    id: string;
    name: string;
    price: number;
    stock: number;
    sku: string;
    attributes: Record<string, string>;
    
    // 🔥 NEW: Advanced Variant Details (Schema Supported)
    barcode?: string;
    costPerItem?: number;
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
    image?: string; // Specific image for variant
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
    bundleItems: BundleItem[];
    
    // 🔥 NEW: Media (Video)
    videoUrl: string;
    videoThumbnail: string;

    // 🔥 NEW: Featured Product
    isFeatured: boolean;

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

    // 🔥 NEW: Demographics & SEO (Schema Supported)
    gender: string;      // e.g., Male, Female, Unisex
    ageGroup: string;    // e.g., Adult, Kids
    metafields: string;  // JSON string storage for custom fields
    seoSchema: string;   // JSON string storage for Rich Snippets

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

export interface BundleItem {
    childProductId: string;
    childProductName?: string; // UI এর জন্য
    childProductImage?: string; // UI এর জন্য
    quantity: number;
}