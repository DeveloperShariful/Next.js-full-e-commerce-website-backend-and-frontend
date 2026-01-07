// File: app/admin/products/create/schema.ts

import { z } from "zod";

// Helper for converting empty strings to null/undefined
const emptyToNumber = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
  z.number().nullable().optional()
);

const emptyToString = z.preprocess(
  (val) => (val === null || val === undefined ? "" : String(val)),
  z.string().optional()
);

const jsonString = z.string().optional().refine((val) => {
  if (!val) return true;
  try {
    JSON.parse(val);
    return true;
  } catch (e) {
    return false;
  }
}, { message: "Invalid JSON format" });

export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Product name is required"),
  slug: z.string().optional(),
  
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  metaTitle: emptyToString,
  metaDesc: emptyToString,
  seoCanonicalUrl: emptyToString,
  
  metafields: jsonString,
  seoSchema: jsonString,

  productType: z.enum(["SIMPLE", "VARIABLE", "VIRTUAL", "DOWNLOADABLE", "BUNDLE", "GIFT_CARD"]).default("SIMPLE"),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
  isFeatured: z.boolean().default(false),

  price: z.coerce.number().min(0, "Price cannot be negative"),
  salePrice: emptyToNumber,
  costPerItem: emptyToNumber,
  
  sku: emptyToString,
  barcode: emptyToString,
  mpn: emptyToString,
  trackQuantity: z.boolean().default(true),
  
  // 🔥 Stock is now derived, but kept for legacy/display support
  stock: z.coerce.number().default(0),

  // 🔥 NEW: Multi-Warehouse Inventory Data
  inventoryData: z.array(z.object({
    locationId: z.string(),
    quantity: z.number()
  })).default([]),

  lowStockThreshold: z.coerce.number().default(2),
  
  backorderStatus: z.enum(["DO_NOT_ALLOW", "ALLOW", "ALLOW_BUT_NOTIFY"]).default("DO_NOT_ALLOW"),
  soldIndividually: z.boolean().default(false),

  isVirtual: z.boolean().default(false),
  isDownloadable: z.boolean().default(false),
  weight: emptyToNumber,
  length: emptyToNumber,
  width: emptyToNumber,
  height: emptyToNumber,
  hsCode: emptyToString,
  countryOfManufacture: emptyToString,
  isDangerousGood: z.boolean().default(false),

  digitalFiles: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    url: z.string().url("Invalid URL")
  })).default([]),
  
  downloadLimit: emptyToNumber,
  downloadExpiry: emptyToNumber,

  category: z.string().optional(),
  vendor: z.string().optional(),
  tags: z.array(z.string()).default([]),
  collectionIds: z.array(z.string()).default([]),
  upsells: z.array(z.string()).default([]),
  crossSells: z.array(z.string()).default([]),
  featuredMediaId: z.string().nullable().optional(),
  featuredImage: z.string().nullable().optional(),
  galleryImages: z.array(z.string()).default([]),
  videoUrl: emptyToString,
  videoThumbnail: emptyToString,

  gender: emptyToString,
  ageGroup: emptyToString,

  attributes: z.array(z.object({
    id: z.string(),
    name: z.string(),
    values: z.array(z.string()),
    visible: z.boolean(),
    variation: z.boolean(),
    position: z.number()
  })).default([]),

  // 🔥 Variations Schema Updated for Inventory Data
  variations: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.coerce.number(),
    stock: z.coerce.number(),
    sku: emptyToString,
    barcode: emptyToString,
    attributes: z.record(z.string(), z.string()), 
    images: z.array(z.string()).default([]),
    
    // Variation specific inventory
    inventoryData: z.array(z.object({
        locationId: z.string(),
        quantity: z.number()
    })).optional(),

    costPerItem: emptyToNumber,
    weight: emptyToNumber,
    length: emptyToNumber,
    width: emptyToNumber,
    height: emptyToNumber,
  })).default([]),

  bundleItems: z.array(z.object({
    childProductId: z.string(),
    childProductName: z.string().optional(),
    childProductImage: z.string().optional(),
    quantity: z.coerce.number().min(1)
  })).default([]),

  purchaseNote: emptyToString,
  menuOrder: z.coerce.number().default(0),
  enableReviews: z.boolean().default(true),
  
  taxStatus: z.enum(["TAXABLE", "SHIPPING_ONLY", "NONE"]).default("TAXABLE"),
  taxRateId: emptyToString,
  shippingClassId: emptyToString,

  saleStart: z.string().nullable().optional(),
  saleEnd: z.string().nullable().optional()
})
.superRefine((data, ctx) => {
  if (data.saleStart && data.saleEnd) {
    const start = new Date(data.saleStart);
    const end = new Date(data.saleEnd);
    if (end < start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be after start date",
        path: ["saleEnd"]
      });
    }
  }

  if (data.productType === "VARIABLE") {
    if (data.attributes.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Attributes are required for variable products",
        path: ["attributes"]
      });
    }
    if (data.variations.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Variations are required for variable products",
        path: ["variations"]
      });
    }
  }

  if (data.productType === "BUNDLE") {
    if (data.bundleItems.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bundle items are required",
        path: ["bundleItems"]
      });
    }
  }
});

export type ProductFormValues = z.infer<typeof productSchema>;