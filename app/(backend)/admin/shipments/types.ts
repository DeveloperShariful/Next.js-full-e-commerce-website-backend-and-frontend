// File: app/admin/shipments/types.ts

import { Prisma } from "@prisma/client";

// Prisma-এর জেনারেট করা টাইপ থেকে Shipment (with Order relations) বের করা হলো
export type ShipmentWithRelations = Prisma.ShipmentGetPayload<{
  include: {
    order: {
      select: {
        id: true;
        orderNumber: true;
        status: true;
        shippingAddress: true;
        user: { select: { name: true; email: true; phone: true } };
        guestEmail: true;
      };
    };
  };
}>;

// ফ্রন্টএন্ড থেকে সার্চ ও পেজিনেশনের জন্য প্যারামিটার
export interface ShipmentQueryParams {
  search?: string;
  status?: "ALL" | "IN_TRANSIT" | "DELIVERED" | "SYNC_FAILED";
  page?: number;
  limit?: number;
}

// উপরের স্ট্যাটাস লিংকের কাউন্ট রাখার জন্য (WooCommerce Style)
export interface ShipmentCounts {
  ALL: number;
  IN_TRANSIT: number;
  DELIVERED: number;
  SYNC_FAILED: number;
}

// সার্ভার অ্যাকশনের রেসপন্স টাইপ
export interface GetShipmentsResponse {
  success: boolean;
  data?: ShipmentWithRelations[];
  meta?: {
    total: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
  counts?: ShipmentCounts;
  error?: string;
}