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
    
    price: number | "";
    salePrice: number | "";
    cost: number | "";
    taxStatus: string;
    
    sku: string;
    barcode: string;
    trackQuantity: boolean;
    stock: number | "";
    
    weight: string;
    length: string;
    width: string;
    height: string;
    upsells: string[]; 
    crossSells: string[];
    
    category: string;
    vendor: string;
    tags: string[];
    
    featuredImage: string | null;
    galleryImages: string[];
    
    attributes: Attribute[];
    variations: Variation[];
    
    metaTitle: string;
    metaDesc: string;
    purchaseNote: string;
    menuOrder: number;
    enableReviews: boolean;
}

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

export interface ComponentProps {
    data: ProductFormData;
    updateData: (field: keyof ProductFormData, value: any) => void;
    loading?: boolean;
}