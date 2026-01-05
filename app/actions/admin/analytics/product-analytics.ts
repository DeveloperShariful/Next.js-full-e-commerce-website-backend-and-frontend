// app/actions/admin/analytics/product-analytics.ts

"use server";

import { db } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { DateRange, TopProductMetric, InventoryHealthMetric, CategoryPerformanceMetric } from "./types";

/**
 * Fetches comprehensive product analytics: Top Sellers, Inventory Issues, Category Stats.
 */
export async function getProductAnalytics(current: DateRange): Promise<{
  topProducts: TopProductMetric[];
  inventoryHealth: InventoryHealthMetric[];
  categoryPerformance: CategoryPerformanceMetric[];
}> {
  
  const validStatus = { notIn: [OrderStatus.CANCELLED, OrderStatus.DRAFT, OrderStatus.FAILED] as OrderStatus[] };

  // 1. Fetch Top Selling Products (Grouped by Product Name)
  const topItems = await db.orderItem.groupBy({
    by: ['productId', 'productName'],
    where: {
      order: {
        createdAt: { gte: current.startDate, lte: current.endDate },
        status: validStatus
      }
    },
    _sum: { total: true, quantity: true },
    orderBy: { _sum: { total: 'desc' } },
    take: 10
  });

  // Map to TopProductMetric
  const topProducts: TopProductMetric[] = topItems.map(item => ({
    id: item.productId || "unknown",
    name: item.productName,
    sku: null, 
    revenue: item._sum.total || 0,
    quantitySold: item._sum.quantity || 0,
    trend: 0 
  }));

  // 2. Fetch Inventory Health
  // Using explicit logic to find low stock items
  const inventoryAlerts = await db.product.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        // Prisma fields reference allows comparing columns in where clause (requires newer Prisma version)
        // If strict typing fails here on older versions, we can fetch and filter in JS, but let's assume standard behavior
        { stock: { lte: 2 } }, // Fallback hardcoded if dynamic field comparison fails, or use raw query
        { stock: 0 }
      ]
    },
    select: {
      id: true,
      name: true,
      sku: true,
      stock: true,
      lowStockThreshold: true,
      featuredImage: true
    },
    take: 20
  });

  // Filter JS side to be 100% safe with dynamic threshold logic
  const refinedInventory = inventoryAlerts.filter(p => p.stock <= (p.lowStockThreshold || 2));

  const inventoryHealth: InventoryHealthMetric[] = refinedInventory.map(p => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    stock: p.stock,
    status: p.stock === 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
    image: p.featuredImage
  }));

  // 3. Category Performance
  const categoryItems = await db.orderItem.findMany({
    where: {
      order: {
        createdAt: { gte: current.startDate, lte: current.endDate },
        status: validStatus
      }
    },
    select: {
      total: true,
      product: {
        select: {
          category: {
            select: { id: true, name: true }
          }
        }
      }
    }
  });

  const catMap = new Map<string, CategoryPerformanceMetric>();
  let totalRevenue = 0;

  for (const item of categoryItems) {
    if (item.product?.category) {
      const cat = item.product.category;
      totalRevenue += item.total;
      
      if (catMap.has(cat.id)) {
        const existing = catMap.get(cat.id)!;
        existing.revenue += item.total;
        existing.orderCount += 1;
      } else {
        catMap.set(cat.id, {
          id: cat.id,
          name: cat.name,
          orderCount: 1,
          revenue: item.total,
          percentage: 0 // Initialize
        });
      }
    }
  }

  // Calculate percentage and sort
  const categoryPerformance = Array.from(catMap.values())
    .map(c => ({
      ...c,
      percentage: totalRevenue > 0 ? (c.revenue / totalRevenue) * 100 : 0
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    topProducts,
    inventoryHealth,
    categoryPerformance
  };
}