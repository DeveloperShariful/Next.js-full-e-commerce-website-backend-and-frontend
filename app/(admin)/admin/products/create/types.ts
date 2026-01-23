// File: app/admin/products/create/types.ts

import { z } from "zod";
import { productSchema } from "./schema"; 

// ১. পুরো ফর্মের টাইপ এখন Zod থেকে আসবে
export type ProductFormValues = z.infer<typeof productSchema>;

// ২. সাব-কম্পোনেন্টগুলোর টাইপ আলাদা করে বের করে নেওয়া হলো (যাতে রিইউজ করা যায়)
export type Attribute = ProductFormValues['attributes'][number];
export type Variation = ProductFormValues['variations'][number];
export type BundleItem = ProductFormValues['bundleItems'][number];
export type DigitalFile = ProductFormValues['digitalFiles'][number];

// ৩. ইনভেন্টরি ম্যানেজমেন্টের জন্য টাইপ
export interface InventoryItem {
  locationId: string;
  quantity: number;
}

// ৪. ফর্ম ডাটার এক্সটেন্ডেড ভার্সন (UI স্টেটের জন্য কিছু অতিরিক্ত হেল্পার সহ)
export interface ProductFormData extends ProductFormValues {
  // UI Specific helpers (Optional, as most come from Zod now)
  tagsList?: string[]; // If you handle tags separately in UI state
}

// ৫. কম্পোনেন্ট প্রপস (ক্লিন রাখা হয়েছে)
export interface ComponentProps {
    loading?: boolean;
}