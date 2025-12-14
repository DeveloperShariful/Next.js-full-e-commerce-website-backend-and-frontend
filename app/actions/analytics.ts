// app/actions/analytics.ts

"use server";

import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";

// --- TYPES ---
export type AnalyticsData = {
  summary: {
    revenue: number;
    orders: number;
    aov: number; // Average Order Value
    refunded: number;
  };
  chartData: { date: string; sales: number; orders: number }[];
  topProducts: { name: string; sales: number; quantity: number }[];
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

    // 2. Fetch Orders (Only Valid Orders)
    const orders = await db.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { not: OrderStatus.CANCELLED } // বাতিল অর্ডার বাদ
      },
      include: {
        items: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // 3. Fetch Refunds
    const refunds = await db.refund.findMany({
      where: {
        createdAt: { gte: startDate },
        status: 'approved'
      }
    });

    // 4. Calculate Summary
    const totalRevenue = orders.reduce((acc, order) => acc + Number(order.total), 0);
    const totalOrders = orders.length;
    const totalRefunded = refunds.reduce((acc, ref) => acc + Number(ref.amount), 0);
    const aov = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

    // 5. Prepare Chart Data (Group by Date)
    const chartMap = new Map<string, { sales: number; orders: number }>();

    orders.forEach(order => {
      // Format Date: "Dec 10"
      const dateStr = new Date(order.createdAt).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
      
      const existing = chartMap.get(dateStr) || { sales: 0, orders: 0 };
      chartMap.set(dateStr, {
        sales: existing.sales + Number(order.total),
        orders: existing.orders + 1
      });
    });

    const chartData = Array.from(chartMap.entries()).map(([date, data]) => ({
      date,
      sales: data.sales,
      orders: data.orders
    }));

    // 6. Calculate Top Products
    const productMap = new Map<string, { sales: number; quantity: number }>();

    orders.forEach(order => {
      order.items.forEach(item => {
        const existing = productMap.get(item.productName) || { sales: 0, quantity: 0 };
        productMap.set(item.productName, {
          sales: existing.sales + Number(item.total),
          quantity: existing.quantity + item.quantity
        });
      });
    });

    const topProducts = Array.from(productMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.sales - a.sales) // Highest sales first
      .slice(0, 5); // Top 5

    return {
      success: true,
      data: {
        summary: {
          revenue: totalRevenue,
          orders: totalOrders,
          aov,
          refunded: totalRefunded
        },
        chartData,
        topProducts
      }
    };

  } catch (error) {
    console.error("ANALYTICS_ERROR", error);
    return { 
        success: false, 
        data: { 
            summary: { revenue: 0, orders: 0, aov: 0, refunded: 0 }, 
            chartData: [], 
            topProducts: [] 
        } 
    };
  }
}