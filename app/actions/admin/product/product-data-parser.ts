// app/actions/admin/product/helpers/product-data-parser.ts

import { ProductType, TaxStatus, ProductStatus } from "@prisma/client";
import { generateSlug, parseJSON, cleanPrice } from "@/app/actions/admin/product/product-utils";

export const parseProductFormData = (formData: FormData) => {
    const name = formData.get("name") as string;
    const rawSlug = formData.get("slug") as string;
    const slug = rawSlug && rawSlug.trim() !== "" ? rawSlug : generateSlug(name);

    // Enum Conversions
    const statusInput = (formData.get("status") as string || "DRAFT").toUpperCase();
    const typeInput = (formData.get("productType") as string || "SIMPLE").toUpperCase();
    
    // 🚀 FIX: Map 'SHIPPING' to 'SHIPPING_ONLY'
    let taxStatusInput = (formData.get("taxStatus") as string || "TAXABLE").toUpperCase();
    if (taxStatusInput === "SHIPPING") {
        taxStatusInput = "SHIPPING_ONLY";
    }

    return {
        id: formData.get("id") as string,
        name,
        slug,
        description: formData.get("description") as string,
        shortDescription: formData.get("shortDescription") as string,
        
        productType: typeInput as ProductType,
        status: statusInput as ProductStatus, 

        price: cleanPrice(formData.get("price") as string),
        salePrice: formData.get("salePrice") ? cleanPrice(formData.get("salePrice") as string) : null,
        costPerItem: formData.get("cost") ? cleanPrice(formData.get("cost") as string) : null,

        sku: formData.get("sku") as string || null,
        barcode: formData.get("barcode") as string || null,
        trackQuantity: formData.get("trackQuantity") === "true",
        stock: parseInt(formData.get("stock") as string) || 0,

        isVirtual: formData.get("isVirtual") === "true",
        isDownloadable: formData.get("isDownloadable") === "true",

        weight: formData.get("weight") ? parseFloat(formData.get("weight") as string) : null,
        length: formData.get("length") ? parseFloat(formData.get("length") as string) : null,
        width: formData.get("width") ? parseFloat(formData.get("width") as string) : null,
        height: formData.get("height") ? parseFloat(formData.get("height") as string) : null,

        categoryName: formData.get("category") as string,
        vendorName: formData.get("vendor") as string,

        purchaseNote: formData.get("purchaseNote") as string,
        menuOrder: parseInt(formData.get("menuOrder") as string) || 0,
        enableReviews: formData.get("enableReviews") === "true",

        metaTitle: formData.get("metaTitle") as string,
        metaDesc: formData.get("metaDesc") as string,
        seoCanonicalUrl: formData.get("seoCanonicalUrl") as string,

        taxStatus: taxStatusInput as TaxStatus, // Now Correct Enum
        taxRateId: formData.get("taxRateId") as string,
        shippingClassId: formData.get("shippingClassId") as string,

        tagsList: parseJSON<string[]>(formData.get("tags") as string, []),
        collectionIds: parseJSON<string[]>(formData.get("collectionIds") as string, []),
        upsells: parseJSON<string[]>(formData.get("upsells") as string, []),
        crossSells: parseJSON<string[]>(formData.get("crossSells") as string, []),
        
        galleryImages: parseJSON<string[]>(formData.get("galleryImages") as string, []),
        digitalFiles: parseJSON<any[]>(formData.get("digitalFiles") as string, []),
        
        attributesData: parseJSON<any[]>(formData.get("attributes") as string, []),
        variationsData: parseJSON<any[]>(formData.get("variations") as string, []),
        featuredImage: formData.get("featuredImage") as string || null,

        lowStockThreshold: parseInt(formData.get("lowStockThreshold") as string) || 2,
        backorderStatus: formData.get("backorderStatus") as any || "DO_NOT_ALLOW",
        soldIndividually: formData.get("soldIndividually") === "true",
        mpn: formData.get("mpn") as string || null,
        hsCode: formData.get("hsCode") as string || null,
        countryOfManufacture: formData.get("countryOfManufacture") as string || null,
        isDangerousGood: formData.get("isDangerousGood") === "true",

        saleStart: formData.get("saleStart") as string || null,
        saleEnd: formData.get("saleEnd") as string || null,

        downloadLimit: formData.get("downloadLimit") ? parseInt(formData.get("downloadLimit") as string) : null,
        downloadExpiry: formData.get("downloadExpiry") ? parseInt(formData.get("downloadExpiry") as string) : null,
    };
};