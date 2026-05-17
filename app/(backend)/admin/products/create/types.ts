// File: app/admin/products/create/types.ts

import { z } from "zod";
import { productSchema } from "./schema"; 

export type ProductFormValues = z.infer<typeof productSchema>;

export type Attribute = ProductFormValues['attributes'][number];
export type Variation = ProductFormValues['variations'][number];
export type BundleItem = ProductFormValues['bundleItems'][number];
export type DigitalFile = ProductFormValues['digitalFiles'][number];

export interface InventoryItem {
  locationId: string;
  quantity: number;
}

export interface ProductFormData extends ProductFormValues {
  tagsList?: string[];
}

export interface ComponentProps {
    loading?: boolean;
}