// File: app/admin/shipments/types.ts

import { Prisma } from "@prisma/client";

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

export interface ShipmentQueryParams {
  search?: string;
  status?: "ALL" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED" | "SYNC_FAILED";
  page?: number;
  limit?: number;
}

export interface ShipmentCounts {
  ALL: number;
  IN_TRANSIT: number;
  DELIVERED: number;
  CANCELLED: number;
  SYNC_FAILED: number;
}

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
