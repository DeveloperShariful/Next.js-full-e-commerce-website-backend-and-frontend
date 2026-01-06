// app/admin/products/create/page.tsx

import { db } from "@/lib/prisma";
import { ProductForm } from "./_components/ProductForm";
import { ProductFormValues } from "./schema";
import { notFound } from "next/navigation";

// Force dynamic rendering to ensure fresh data
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function CreateProductPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const productId = searchParams.id;

  // Default Initial State
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
  };

  if (productId) {
    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        images: { orderBy: { position: "asc" } },
        attributes: { orderBy: { position: "asc" } },
        variants: { include: { images: true }, orderBy: { id: 'asc' } },
        tags: true,
        collections: true,
        brand: true,
        category: true,
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

    // Transform DB data to Form Schema
    initialData = {
      ...product,
      id: product.id,
      description: product.description || "",
      shortDescription: product.shortDescription || "",
      
      // Relations
      category: product.category?.name,
      vendor: product.brand?.name,
      tags: product.tags.map((t) => t.name),
      collectionIds: product.collections.map((c) => c.id),
      
      // Images
      featuredImage: product.featuredImage,
      galleryImages: product.images
        .filter((img) => !img.variantId)
        .map((img) => img.url),
      
      // JSON Fields
      metafields: product.metafields ? JSON.stringify(product.metafields, null, 2) : "",
      seoSchema: product.seoSchema ? JSON.stringify(product.seoSchema, null, 2) : "",
      
      // Dates
      saleStart: product.saleStart ? product.saleStart.toISOString().split("T")[0] : null,
      saleEnd: product.saleEnd ? product.saleEnd.toISOString().split("T")[0] : null,

      // Nullable Numbers
      salePrice: product.salePrice ?? null,
      costPerItem: product.costPerItem ?? null,
      weight: product.weight ?? null,
      length: product.length ?? null,
      width: product.width ?? null,
      height: product.height ?? null,
      downloadLimit: product.downloadLimit ?? null,
      downloadExpiry: product.downloadExpiry ?? null,

      // Nested Data
      digitalFiles: product.downloadFiles.map(d => ({ 
        id: d.id, name: d.name, url: d.url 
      })),
      
      attributes: product.attributes.map((a) => ({
        id: a.id,
        name: a.name,
        values: a.values,
        visible: a.visible,
        variation: a.variation,
        position: a.position,
      })),

      variations: product.variants.map((v) => ({
        id: v.id,
        name: v.name,
        price: v.price,
        stock: v.stock,
        sku: v.sku || "",
        barcode: v.barcode || "",
        attributes: v.attributes as Record<string, string>,
        images: v.images.map((img) => img.url),
        costPerItem: v.costPerItem ?? null,
        weight: v.weight ?? null,
        length: v.length ?? null,
        width: v.width ?? null,
        height: v.height ?? null,
      })),

      bundleItems: product.bundleItems.map((b) => ({
        childProductId: b.childProductId,
        childProductName: b.childProduct.name,
        childProductImage: b.childProduct.featuredImage || b.childProduct.images[0]?.url,
        quantity: b.quantity,
      })),
      
      upsells: product.upsellIds,
      crossSells: product.crossSellIds,
    } as any;
  }

  return <ProductForm initialData={initialData as ProductFormValues} isEdit={!!productId} />;
}