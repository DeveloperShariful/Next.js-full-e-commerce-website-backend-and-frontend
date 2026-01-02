// File: app/admin/products/create/types.ts

export interface Attribute {
    id: string;
    name: string;
    values: string[];
    visible: boolean;
    variation: boolean;
    position: number;
}

export interface Variation {
    id: string;
    name: string;
    price: number;
    stock: number;
    sku: string;
    attributes: Record<string, string>;
    
    // 🔥 UPDATE: Single 'image' string is removed, replaced by 'images' array
    images: string[]; 
    
    // Advanced Variant Details
    barcode?: string;
    costPerItem?: number;
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
}

export interface DigitalFile {
    id?: string;
    name: string;
    url: string;
}

export interface BundleItem {
    childProductId: string;
    childProductName?: string; 
    childProductImage?: string; 
    quantity: number;
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
    isFeatured: boolean; 
    
    videoUrl: string;
    videoThumbnail: string;

    gender: string; 
    ageGroup: string; 
    metafields: string; 
    seoSchema: string; 

    bundleItems: BundleItem[];

    saleStart: string; 
    saleEnd: string;   

    downloadLimit: number | "";
    downloadExpiry: number | "";
    
    price: number | "";
    salePrice: number | "";
    costPerItem: number | "";
    
    taxStatus: string;
    taxRateId: string;      
    shippingClassId: string; 
    
    sku: string;
    barcode: string;
    trackQuantity: boolean;
    stock: number | "";

    lowStockThreshold: number | "";
    backorderStatus: string; 
    soldIndividually: boolean;
    mpn: string;
    
    weight: string;
    length: string;
    width: string;
    height: string;
    
    hsCode: string;
    countryOfManufacture: string;
    isDangerousGood: boolean;

    category: string;
    vendor: string;
    tags: string[];
    collectionIds: string[]; 
    
    upsells: string[]; 
    crossSells: string[];
    
    featuredImage: string | null;
    galleryImages: string[];
    digitalFiles: DigitalFile[]; 
    
    attributes: Attribute[];
    variations: Variation[];
    
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