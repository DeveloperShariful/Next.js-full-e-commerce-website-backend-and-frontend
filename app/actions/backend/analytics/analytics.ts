//app/actions/admin/analytics/analytics.ts 

"use server";

import { db } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export type AnalyticsSummary = {
  revenue: number;
  orders: number;
  aov: number; 
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
    const now = new Date();
    const startDate = new Date();
    
    if (period === "7d") startDate.setDate(now.getDate() - 7);
    else if (period === "30d") startDate.setDate(now.getDate() - 30);
    else if (period === "90d") startDate.setDate(now.getDate() - 90);
    else if (period === "year") startDate.setFullYear(now.getFullYear() - 1);

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
        status: 'approved'
      }
    });

    // ✅ FIX: Decimal to Number Conversion
    const revenue = Number(orderAggregates._sum.total || 0);
    const totalOrders = orderAggregates._count.id || 0;
    const refunded = Number(refundAggregates._sum.amount || 0);
    const aov = totalOrders > 0 ? (revenue / totalOrders) : 0;

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

    const chartMap = new Map<string, { sales: number; orders: number }>();

    ordersForChart.forEach(order => {
      const dateStr = new Date(order.createdAt).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
      
      const existing = chartMap.get(dateStr) || { sales: 0, orders: 0 };
      chartMap.set(dateStr, {
        // ✅ FIX: Decimal to Number Conversion
        sales: existing.sales + Number(order.total || 0),
        orders: existing.orders + 1
      });
    });

    const chartData = Array.from(chartMap.entries()).map(([date, data]) => ({
      date,
      sales: data.sales,
      orders: data.orders
    }));

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
      // ✅ FIX: Decimal to Number Conversion
      sales: Number(item._sum.total || 0),
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