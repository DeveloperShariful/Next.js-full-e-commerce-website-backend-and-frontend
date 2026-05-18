// File: app/admin/invoices/types.ts

import { OrderStatus, PaymentStatus, FulfillmentStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";

// Prisma-এর জেনারেট করা টাইপ থেকে সরাসরি আমাদের Invoice (Order) টাইপ বের করে আনা হলো
// এতে করে ভবিষ্যতে স্কিমা চেঞ্জ হলে এখানেও অটো আপডেট হয়ে যাবে।
export type InvoiceWithRelations = Prisma.OrderGetPayload<{
  include: {
    user: {
      select: { name: true; email: true };
    };
    items: true;
  };
}>;

// ফ্রন্টএন্ডে রিকোয়েস্ট পাঠানোর জন্য ফিল্টার প্যারামিটার
export interface InvoiceQueryParams {
  search?: string;
  status?: OrderStatus | "ALL";
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

// স্ট্যাটাস অনুযায়ী ইনভয়েস কাউন্ট (WooCommerce-এর টপ লিংকের জন্য)
export type StatusCounts = {
  ALL: number;
} & Partial<Record<OrderStatus, number>>;

// Server Action থেকে রিটার্ন হওয়া ডেটার রেসপন্স টাইপ
export interface GetInvoicesResponse {
  success: boolean;
  data?: InvoiceWithRelations[];
  meta?: {
    total: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
  counts?: StatusCounts;
  error?: string;
}