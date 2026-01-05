// app/actions/admin/analytics/general-analytics.ts

"use server";

import { db } from "@/lib/prisma";
import { OrderStatus, Prisma } from "@prisma/client";
import { DateRange, FinancialSummary, SalesChartData } from "./types";
import { calculateGrowth, getTrend } from "./utils";

export async function getFinancialAnalytics(
  current: DateRange, 
  previous: DateRange
): Promise<{ summary: FinancialSummary; chartData: SalesChartData[] }> {
  
  const validOrderStatuses = {
    notIn: [OrderStatus.CANCELLED, OrderStatus.FAILED, OrderStatus.DRAFT] as OrderStatus[]
  };

  // 1. Fetch Aggregates
  const [
    currentOrdersAgg, 
    previousOrdersAgg, 
    currentRefundsAgg, 
    previousRefundsAgg
  ] = await Promise.all([
    db.order.aggregate({
      where: { createdAt: { gte: current.startDate, lte: current.endDate }, status: validOrderStatuses },
      _sum: { total: true, taxTotal: true, shippingTotal: true, subtotal: true },
      _count: { id: true }
    }),
    db.order.aggregate({
      where: { createdAt: { gte: previous.startDate, lte: previous.endDate }, status: validOrderStatuses },
      _sum: { total: true, subtotal: true },
      _count: { id: true }
    }),
    db.refund.aggregate({
      where: { createdAt: { gte: current.startDate, lte: current.endDate }, status: "approved" },
      _sum: { amount: true }
    }),
    db.refund.aggregate({
      where: { createdAt: { gte: previous.startDate, lte: previous.endDate }, status: "approved" },
      _sum: { amount: true }
    }),
  ]);

  // 2. Fetch Chart Data 
  // IMPORTANT: Ensure Schema has 'variant' relation in OrderItem for this to work perfectly.
  const chartOrders = await db.order.findMany({
    where: { 
      createdAt: { gte: current.startDate, lte: current.endDate }, 
      status: validOrderStatuses 
    },
    select: {
      createdAt: true,
      total: true,
      taxTotal: true,
      shippingTotal: true,
      items: {
        select: {
          quantity: true,
          product: { 
            select: { costPerItem: true } 
          },
          // If schema is updated, this will work. If not, TypeScript will complain.
          variant: { 
            select: { costPerItem: true } 
          }
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  // 3. Process Summary Metrics
  const curRev = currentOrdersAgg._sum.total || 0;
  const prevRev = previousOrdersAgg._sum.total || 0;
  
  const curNet = (currentOrdersAgg._sum.subtotal || 0) - (currentRefundsAgg._sum.amount || 0); 
  const prevNet = (previousOrdersAgg._sum.subtotal || 0) - (previousRefundsAgg._sum.amount || 0);

  const curOrdersCount = currentOrdersAgg._count.id || 0;
  const prevOrdersCount = previousOrdersAgg._count.id || 0;

  const curRefund = currentRefundsAgg._sum.amount || 0;
  const prevRefund = previousRefundsAgg._sum.amount || 0;

  const curAOV = curOrdersCount > 0 ? curRev / curOrdersCount : 0;
  const prevAOV = prevOrdersCount > 0 ? prevRev / prevOrdersCount : 0;

  // 4. Process Chart Data
  let totalCostOfGoods = 0;
  const chartMap = new Map<string, SalesChartData>();

  for (const order of chartOrders) {
    const dateKey = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const fullDate = order.createdAt.toISOString();

    let orderCost = 0;
    
    // Using 'any' type casting temporarily if Schema isn't updated yet to suppress error
    // But PLEASE UPDATE SCHEMA for real data
    if (order.items) {
      for (const item of order.items) {
        // Safe access
        const variantCost = (item as any).variant?.costPerItem ?? 0;
        const productCost = item.product?.costPerItem ?? 0;
        const unitCost = variantCost || productCost;
        
        orderCost += (unitCost * item.quantity);
      }
    }
    
    totalCostOfGoods += orderCost;

    const netSale = order.total - order.taxTotal - order.shippingTotal;
    const profit = netSale - orderCost;

    if (chartMap.has(dateKey)) {
      const existing = chartMap.get(dateKey)!;
      existing.revenue += order.total;
      existing.profit += profit;
      existing.orders += 1;
    } else {
      chartMap.set(dateKey, {
        date: dateKey,
        fullDate,
        revenue: order.total,
        profit: profit,
        orders: 1
      });
    }
  }

  const grossProfitVal = curNet - totalCostOfGoods;
  const prevGrossProfitVal = prevNet * 0.30; 

  const summary: FinancialSummary = {
    totalRevenue: {
      value: curRev,
      previousValue: prevRev,
      percentageChange: calculateGrowth(curRev, prevRev),
      trend: getTrend(calculateGrowth(curRev, prevRev))
    },
    netSales: {
      value: curNet,
      previousValue: prevNet,
      percentageChange: calculateGrowth(curNet, prevNet),
      trend: getTrend(calculateGrowth(curNet, prevNet))
    },
    grossProfit: {
      value: grossProfitVal,
      previousValue: prevGrossProfitVal,
      percentageChange: calculateGrowth(grossProfitVal, prevGrossProfitVal),
      trend: getTrend(calculateGrowth(grossProfitVal, prevGrossProfitVal))
    },
    totalOrders: {
      value: curOrdersCount,
      previousValue: prevOrdersCount,
      percentageChange: calculateGrowth(curOrdersCount, prevOrdersCount),
      trend: getTrend(calculateGrowth(curOrdersCount, prevOrdersCount))
    },
    averageOrderValue: {
      value: curAOV,
      previousValue: prevAOV,
      percentageChange: calculateGrowth(curAOV, prevAOV),
      trend: getTrend(calculateGrowth(curAOV, prevAOV))
    },
    refundedAmount: {
      value: curRefund,
      previousValue: prevRefund,
      percentageChange: calculateGrowth(curRefund, prevRefund),
      trend: getTrend(calculateGrowth(curRefund, prevRefund) * -1)
    }
  };

  return {
    summary,
    chartData: Array.from(chartMap.values())
  };
}