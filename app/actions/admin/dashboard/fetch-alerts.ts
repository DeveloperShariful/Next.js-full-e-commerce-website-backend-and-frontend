//app/actions/admin/dashboard/fetch-alerts.ts

"use server";

import { db } from "@/lib/prisma";
import { FulfillmentStatus, OrderStatus, ReturnStatus, DisputeStatus, ProductStatus } from "@prisma/client";
import { ActionAlerts } from "./types";

export async function getActionAlerts(): Promise<ActionAlerts> {
  const [unfulfilledCount, pendingReturns, openDisputes, lowStockCount] = await Promise.all([
    
    // 1. TO SHIP (Paid + Unfulfilled)
    // ----------------------------------------------------
    db.order.count({
      where: { 
        paymentStatus: "PAID",               // 👈 MUST BE PAID
        fulfillmentStatus: "UNFULFILLED",    // 👈 MUST BE NOT SHIPPED
        status: { not: OrderStatus.CANCELLED } // Not Cancelled
      }
    }),

    // 2. RETURNS
    db.returnRequest.count({ where: { status: ReturnStatus.REQUESTED } }),

    // 3. DISPUTES
    db.dispute.count({ where: { status: { in: [DisputeStatus.NEEDS_RESPONSE, DisputeStatus.WARNING_NEEDS_RESPONSE] } } }),

    // 4. LOW STOCK
    db.product.count({ where: { status: ProductStatus.ACTIVE, stock: { lte: 5 } } })
  ]);

  return {
    unfulfilled: unfulfilledCount,
    returns: pendingReturns,
    disputes: openDisputes,
    lowStock: lowStockCount
  };
}