// File: app/(backend)/admin/refunds/types.ts

import { Prisma, PaymentStatus } from "@prisma/client";

// Prisma-এর জেনারেট করা টাইপ থেকে Refund (with Order relations) বের করা হলো
export type RefundWithRelations = Prisma.RefundGetPayload<{
  include: {
    order: {
      select: {
        id: true;
        orderNumber: true;
        paymentStatus: true;
        currency: true; // ডায়নামিক কারেন্সির জন্য
        guestEmail: true;
        user: { select: { name: true; email: true } };
      };
    };
  };
}>;

// ফ্রন্টএন্ড থেকে সার্চ ও পেজিনেশনের জন্য প্যারামিটার
export interface RefundQueryParams {
  search?: string;
  status?: "ALL" | "pending" | "approved" | "rejected";
  page?: number;
  limit?: number;
}

// উপরের স্ট্যাটাস লিংকের কাউন্ট রাখার জন্য
export interface RefundCounts {
  ALL: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface RefundStats {
  totalRefundedAmount: number;
  pendingCount: number;
  currency: string; // <-- এটি নতুন যোগ করা হলো
}

// সার্ভার অ্যাকশনের রেসপন্স টাইপ
export interface GetRefundsResponse {
  success: boolean;
  data?: RefundWithRelations[];
  meta?: {
    total: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
  counts?: RefundCounts;
  stats?: RefundStats;
  error?: string;
}