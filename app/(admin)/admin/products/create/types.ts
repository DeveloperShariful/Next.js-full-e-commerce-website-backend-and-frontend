// File: app/admin/products/create/types.ts

import { z } from "zod";
import { productSchema } from "./schema"; // আপনার তৈরি করা স্কিমা ইম্পোর্ট করুন

// ১. পুরো ফর্মের টাইপ এখন Zod থেকে আসবে
export type ProductFormData = z.infer<typeof productSchema>;

// ২. সাব-কম্পোনেন্টগুলোর টাইপ আলাদা করে বের করে নেওয়া হলো (যাতে রিইউজ করা যায়)
export type Attribute = ProductFormData['attributes'][number];
export type Variation = ProductFormData['variations'][number];
export type BundleItem = ProductFormData['bundleItems'][number];
export type DigitalFile = ProductFormData['digitalFiles'][number];

// ৩. কম্পোনেন্ট প্রপস আপডেট
// আগে ছিল: data, updateData
// এখন React Hook Form ব্যবহার হবে, তাই প্রপস দরকার নেই (context দিয়ে ডাটা পাবে)।
// কিন্তু যদি আপনি কিছু প্রপস রাখতে চান, তবে এটি ক্লিন রাখা ভালো:
export interface ComponentProps {
    // এখন আর data বা updateData লাগবে না, কারণ আমরা useFormContext() ব্যবহার করব।
    // তবে লোডিং স্টেট বা অন্য কিছুর জন্য প্রপস রাখা যেতে পারে।
    loading?: boolean;
}