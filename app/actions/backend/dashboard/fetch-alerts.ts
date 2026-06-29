//app/actions/admin/dashboard/fetch-alerts.ts

"use server";

import { db } from "@/lib/prisma";
import { DisputeStatus, ProductStatus, ReturnStatus } from "@prisma/client";
import { ActionAlerts } from "./types";

export async function getActionAlerts(): Promise<ActionAlerts> {
  const [totalProducts, pendingReviews, pendingReturns, openDisputes, lowStockCount] = await Promise.all([

    // 1. TOTAL ACTIVE PRODUCTS
    db.product.count({
      where: { status: ProductStatus.ACTIVE, deletedAt: null },
    }),

    // 2. PENDING REVIEWS (waiting for approval)
    db.review.count({
      where: { status: "PENDING", deletedAt: null },
    }),

    // 3. RETURNS
    db.returnRequest.count({ where: { status: ReturnStatus.REQUESTED } }),

    // 4. DISPUTES
    db.dispute.count({
      where: { status: { in: [DisputeStatus.NEEDS_RESPONSE, DisputeStatus.WARNING_NEEDS_RESPONSE] } },
    }),

    // 5. LOW STOCK
    db.product.count({ where: { status: ProductStatus.ACTIVE, stock: { lte: 5 } } }),
  ]);

  return {
    totalProducts,
    pendingReviews,
    returns: pendingReturns,
    disputes: openDisputes,
    lowStock: lowStockCount,
  };
}
