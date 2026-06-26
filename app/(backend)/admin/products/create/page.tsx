// File: app/admin/products/create/page.tsx

// File: app/admin/products/create/page.tsx

import { db } from "@/lib/prisma";
import { ProductForm } from "./_components/ProductForm";
import { ProductFormValues } from "./schema";
import { notFound } from "next/navigation";

// Force dynamic rendering
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function CreateProductPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const productId = searchParams.id;

  // Default Initial State based on new Schema
  let initialData: Partial<ProductFormValues> = {
    productType: "SIMPLE",
    status: "DRAFT",
    trackQuantity: true,
    stock: 0,
    attributes: [],
    variations: [],
    galleryImages: [], 
    tags: [],
    collectionIds: [],
    categoryIds: [], 
    digitalFiles: [],
    bundleItems: [],
    upsells: [],
    crossSells: [],
    isFeatured: false,
    enableReviews: true,
    taxStatus: "TAXABLE",
    backorderStatus: "DO_NOT_ALLOW",
    menuOrder: 0,
    price: 0,
    isVirtual: false,
    isDownloadable: false,
    isDangerousGood: false,
    soldIndividually: false,
    isPreOrder: false,
    
    // Facebook default values
    facebookSyncMode: "SYNC_AND_SHOW",
    facebookDescription: "",
    facebookImageType: "PRODUCT_IMAGE",
    facebookPrice: null,
    size: "",
    color: "",
    material: "",
    pattern: "",

    // গুগল কোর কলাম ডিফল্ট ভ্যালু
    condition: "NEW",
    googleProductCategory: "",
    googleTitle: "",
    googleDescription: "",
    googleIsBundle: false,

    // গুগল কাস্টম মেটাফিল্ডস ডিফল্ট ভ্যালু
    google_size: "",
    google_size_system: "",
    google_size_type: "",
    google_color: "",
    google_material: "",
    google_pattern: "",
    google_multipack: "",
    google_adult_content: false,
    google_availability_date: "",

    metafields: [],
    giftCardAmounts: [],
    version: 1,
    seoSchema: { ogTitle: "", ogDescription: "", robots: "", ogImage: "" }
  };

  if (productId) {
    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        images: { orderBy: { position: "asc" }, include: { media: true } }, 
        featuredMedia: true,
        attributes: { orderBy: { position: "asc" } },
        variants: { include: { images: true }, orderBy: { id: 'asc' } },
        tags: true,
        collections: true,
        brand: true,
        categories: true, 
        downloadFiles: true,
        bundleItems: {
          include: {
            childProduct: {
              select: { id: true, name: true, featuredImage: true, images: { take: 1 } },
            },
          },
        },
      },
    });

    if (!product) return notFound();

    // 🚀 উকমার্স গুগল ফিল্ডস আলাদা করা এবং কাস্টম মেটাফিল্ডস সুরক্ষিত রাখার লজিক
    let parsedMetafields: { key: string; value: string }[] = [];
    let google_size = "";
    let google_size_system = "";
    let google_size_type = "";
    let google_color = "";
    let google_material = "";
    let google_pattern = "";
    let google_multipack = "";
    let google_adult_content = false;
    let google_availability_date = "";

    if (product.metafields && typeof product.metafields === 'object') {
        if (Array.isArray(product.metafields)) {
            parsedMetafields = product.metafields as { key: string; value: string }[];
        } else {
            const rawMeta = product.metafields as Record<string, unknown>;
            
            // ১. গুগলের জন্য বরাদ্দকৃত ভ্যালুগুলো অবজেক্ট থেকে বের করে নেওয়া হচ্ছে
            google_size = String(rawMeta.google_size ?? "");
            google_size_system = String(rawMeta.google_size_system ?? "");
            google_size_type = String(rawMeta.google_size_type ?? "");
            google_color = String(rawMeta.google_color ?? "");
            google_material = String(rawMeta.google_material ?? "");
            google_pattern = String(rawMeta.google_pattern ?? "");
            google_multipack = String(rawMeta.google_multipack ?? "");
            google_adult_content = rawMeta.google_adult_content === true;
            google_availability_date = String(rawMeta.google_availability_date ?? "");

            // ২. গুগলের কাস্টম কীগুলো বাদ দিয়ে বাকি শুধু আসল মেটাফিল্ডসগুলো টেবিলে পাঠানো হচ্ছে
            Object.entries(rawMeta).forEach(([key, value]) => {
                if (!key.startsWith("google_")) {
                    parsedMetafields.push({ 
                        key, 
                        value: String(value) 
                    });
                }
            });
        }
    }

    // Transform DB data to Form Schema
    initialData = {
      ...product,
      id: product.id,
      version: product.version, 
      description: product.description || "",
      shortDescription: product.shortDescription || "",
      
      price: Number(product.price),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      costPerItem: product.costPerItem ? Number(product.costPerItem) : null,
      weight: product.weight ? Number(product.weight) : null,
      length: product.length ? Number(product.length) : null,
      width: product.width ? Number(product.width) : null,
      height: product.height ? Number(product.height) : null,
      rating: Number(product.rating),
      
      categoryIds: product.categories.map((c) => c.id), 
      vendor: product.brand?.name,
      tags: product.tags.map((t) => t.name),
      collectionIds: product.collections.map((c) => c.id),
      
      featuredImage: product.featuredImage,
      featuredMediaId: product.featuredMediaId,
      
      galleryImages: product.images
        .filter((img) => !img.variantId)
        .map((img) => ({
            url: img.url,
            mediaId: img.mediaId,
            altText: img.altText || "",
            id: img.id
        })),

      // Facebook fields mapping
      facebookSyncMode: product.facebookSyncMode || "SYNC_AND_SHOW",
      facebookDescription: product.facebookDescription || "",
      facebookImageType: product.facebookImageType || "PRODUCT_IMAGE",
      facebookPrice: product.facebookPrice ? Number(product.facebookPrice) : null,
      size: product.size || "",
      color: product.color || "",
      material: product.material || "",
      pattern: product.pattern || "",

      // 🚀 গুগল কোর কলাম এবং মেটাফিল্ড ডাটা ফর্মে ম্যাপিং
      condition: product.condition || "NEW",
      googleProductCategory: product.googleProductCategory || "",
      googleTitle: product.googleTitle || "",
      googleDescription: product.googleDescription || "",
      googleIsBundle: product.googleIsBundle || false,

      google_size,
      google_size_system,
      google_size_type,
      google_color,
      google_material,
      google_pattern,
      google_multipack,
      google_adult_content,
      google_availability_date,
      
      metafields: parsedMetafields,
      seoSchema: product.seoSchema ? product.seoSchema : { ogTitle: "", ogDescription: "", robots: "", ogImage: "" },
      
      saleStart: product.saleStart ? product.saleStart.toISOString().split("T")[0] : null,
      saleEnd: product.saleEnd ? product.saleEnd.toISOString().split("T")[0] : null,
      
      isPreOrder: product.isPreOrder,
      preOrderReleaseDate: product.preOrderReleaseDate ? product.preOrderReleaseDate.toISOString().split("T")[0] : null,
      preOrderLimit: product.preOrderLimit,
      preOrderMessage: product.preOrderMessage || "",

      downloadLimit: product.downloadLimit ?? null,
      downloadExpiry: product.downloadExpiry ?? null,

      digitalFiles: product.downloadFiles.map(d => ({
        id: d.id, name: d.name, url: d.url, isSecure: d.isSecure
      })),
      
      attributes: product.attributes.map((a) => ({
        id: a.id,
        name: a.name,
        values: a.values,
        visible: a.visible,
        variation: a.variation,
        position: a.position,
        saveGlobally: false
      })),

      variations: product.variants.map((v) => ({
        id: v.id,
        name: v.name,
        price: Number(v.price),
        stock: v.stock,
        sku: v.sku || "",
        barcode: v.barcode || "",
        trackQuantity: v.trackQuantity,
        attributes: v.attributes as Record<string, string>,
        images: v.images.map((img) => img.url),
        
        salePrice: v.salePrice ? Number(v.salePrice) : null,
        costPerItem: v.costPerItem ? Number(v.costPerItem) : null,
        weight: v.weight ? Number(v.weight) : null,
        length: v.length ? Number(v.length) : null,
        width: v.width ? Number(v.width) : null,
        height: v.height ? Number(v.height) : null,
        
        isPreOrder: v.isPreOrder,
        preOrderReleaseDate: v.preOrderReleaseDate ? v.preOrderReleaseDate.toISOString().split("T")[0] : null,
      })),

      bundleItems: product.bundleItems.map((b) => ({
        childProductId: b.childProductId,
        childProductName: b.childProduct.name,
        childProductImage: b.childProduct.featuredImage || b.childProduct.images[0]?.url,
        quantity: b.quantity,
      })),
      
      upsells: product.upsellIds,
      crossSells: product.crossSellIds,
      
      giftCardAmounts: []
    } as unknown as ProductFormValues;
  }

  const sanitizedInitialData = JSON.parse(JSON.stringify(initialData));

  return <ProductForm initialData={sanitizedInitialData as ProductFormValues} isEdit={!!productId} />;
}