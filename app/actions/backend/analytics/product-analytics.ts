// app/actions/admin/analytics/product-analytics.ts

"use server";

import { db } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { DateRange, TopProductMetric, InventoryHealthMetric, CategoryPerformanceMetric } from "./types";

export async function getProductAnalytics(current: DateRange): Promise<{
  topProducts: TopProductMetric[];
  inventoryHealth: InventoryHealthMetric[];
  categoryPerformance: CategoryPerformanceMetric[];
}> {
  
  const validStatus = { notIn: [OrderStatus.CANCELLED, OrderStatus.DRAFT, OrderStatus.FAILED] as OrderStatus[] };

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

  const topProducts: TopProductMetric[] = topItems.map(item => ({
    id: item.productId || "unknown",
    name: item.productName,
    sku: null, 
    // ✅ FIX: Decimal -> Number
    revenue: Number(item._sum.total || 0),
    quantitySold: item._sum.quantity || 0,
    trend: 0 
  }));

  const inventoryAlerts = await db.product.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { stock: { lte: 2 } }, 
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

  const refinedInventory = inventoryAlerts.filter(p => p.stock <= (p.lowStockThreshold || 2));

  const inventoryHealth: InventoryHealthMetric[] = refinedInventory.map(p => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    stock: p.stock,
    status: p.stock === 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
    image: p.featuredImage
  }));

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
      // ✅ FIX: Decimal -> Number
      const itemTotal = Number(item.total);
      
      totalRevenue += itemTotal;
      
      if (catMap.has(cat.id)) {
        const existing = catMap.get(cat.id)!;
        existing.revenue += itemTotal;
        existing.orderCount += 1;
      } else {
        catMap.set(cat.id, {
          id: cat.id,
          name: cat.name,
          orderCount: 1,
          revenue: itemTotal,
          percentage: 0 
        });
      }
    }
  }

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