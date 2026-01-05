//app/actions/admin/analytics/analytics.ts 

"use server";

import { db } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

// --- TYPES ---
export type AnalyticsSummary = {
  revenue: number;
  orders: number;
  aov: number; // Average Order Value
  refunded: number;
};

export type ChartDataPoint = {
  date: string;
  sales: number;
  orders: number;
};

export type TopProduct = {
  name: string;
  sales: number;
  quantity: number;
};

export type AnalyticsResponse = {
  summary: AnalyticsSummary;
  chartData: ChartDataPoint[];
  topProducts: TopProduct[];
};

export async function getAnalyticsData(period: string = "30d") {
  try {
    // 1. Calculate Date Range
    const now = new Date();
    const startDate = new Date();
    
    if (period === "7d") startDate.setDate(now.getDate() - 7);
    else if (period === "30d") startDate.setDate(now.getDate() - 30);
    else if (period === "90d") startDate.setDate(now.getDate() - 90);
    else if (period === "year") startDate.setFullYear(now.getFullYear() - 1);

    // 2. Fetch Summary using AGGREGATE (Much Faster)
    const orderAggregates = await db.order.aggregate({
      _sum: { total: true },
      _count: { id: true },
      where: {
        createdAt: { gte: startDate },
        status: { not: OrderStatus.CANCELLED }
      }
    });

    const refundAggregates = await db.refund.aggregate({
      _sum: { amount: true },
      where: {
        createdAt: { gte: startDate },
        status: 'approved' // Ensure status matches your DB logic
      }
    });

    const revenue = orderAggregates._sum.total || 0;
    const totalOrders = orderAggregates._count.id || 0;
    const refunded = refundAggregates._sum.amount || 0;
    const aov = totalOrders > 0 ? (revenue / totalOrders) : 0;

    // 3. Fetch Data for Chart (Lightweight Query)
    // We only fetch createdAt and total, not the whole order object
    const ordersForChart = await db.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { not: OrderStatus.CANCELLED }
      },
      select: {
        createdAt: true,
        total: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by Date for Chart
    const chartMap = new Map<string, { sales: number; orders: number }>();

    ordersForChart.forEach(order => {
      // Format: "Dec 10"
      const dateStr = new Date(order.createdAt).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
      
      const existing = chartMap.get(dateStr) || { sales: 0, orders: 0 };
      chartMap.set(dateStr, {
        sales: existing.sales + (order.total || 0),
        orders: existing.orders + 1
      });
    });

    const chartData = Array.from(chartMap.entries()).map(([date, data]) => ({
      date,
      sales: data.sales,
      orders: data.orders
    }));

    // 4. Fetch Top Products using GROUP BY (Optimized)
    const topItems = await db.orderItem.groupBy({
      by: ['productName'],
      _sum: {
        quantity: true,
        total: true,
      },
      where: {
        order: {
          createdAt: { gte: startDate },
          status: { not: OrderStatus.CANCELLED }
        }
      },
      orderBy: {
        _sum: {
          total: 'desc'
        }
      },
      take: 5
    });

    const topProducts = topItems.map(item => ({
      name: item.productName,
      sales: item._sum.total || 0,
      quantity: item._sum.quantity || 0
    }));

    return {
      success: true,
      data: {
        summary: { revenue, orders: totalOrders, aov, refunded },
        chartData,
        topProducts
      }
    };

  } catch (error) {
    console.error("ANALYTICS_ERROR", error);
    return { success: false, error: "Failed to fetch analytics data" };
  }
}