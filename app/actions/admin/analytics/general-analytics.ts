// app/actions/admin/analytics/general-analytics.ts

"use server";

import { db } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { DateRange, FinancialSummary, SalesChartData } from "./types";
import { calculateGrowth, getTrend } from "./utils";

export async function getFinancialAnalytics(
  current: DateRange, 
  previous: DateRange
): Promise<{ summary: FinancialSummary; chartData: SalesChartData[] }> {
  
  const validOrderStatuses = {
    notIn: [OrderStatus.CANCELLED, OrderStatus.FAILED, OrderStatus.DRAFT] as OrderStatus[]
  };

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
          variant: { 
            select: { costPerItem: true } 
          }
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  // ✅ FIX: Decimal -> Number
  const curRev = Number(currentOrdersAgg._sum.total || 0);
  const prevRev = Number(previousOrdersAgg._sum.total || 0);
  
  const curNet = (Number(currentOrdersAgg._sum.subtotal || 0)) - (Number(currentRefundsAgg._sum.amount || 0)); 
  const prevNet = (Number(previousOrdersAgg._sum.subtotal || 0)) - (Number(previousRefundsAgg._sum.amount || 0));

  const curOrdersCount = currentOrdersAgg._count.id || 0;
  const prevOrdersCount = previousOrdersAgg._count.id || 0;

  const curRefund = Number(currentRefundsAgg._sum.amount || 0);
  const prevRefund = Number(previousRefundsAgg._sum.amount || 0);

  const curAOV = curOrdersCount > 0 ? curRev / curOrdersCount : 0;
  const prevAOV = prevOrdersCount > 0 ? prevRev / prevOrdersCount : 0;

  let totalCostOfGoods = 0;
  const chartMap = new Map<string, SalesChartData>();

  for (const order of chartOrders) {
    const dateKey = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const fullDate = order.createdAt.toISOString();

    let orderCost = 0;
    
    if (order.items) {
      for (const item of order.items) {
        // ✅ FIX: Decimal -> Number
        const variantCost = Number((item as any).variant?.costPerItem ?? 0);
        const productCost = Number(item.product?.costPerItem ?? 0);
        const unitCost = variantCost || productCost;
        
        orderCost += (unitCost * item.quantity);
      }
    }
    
    totalCostOfGoods += orderCost;

    // ✅ FIX: Decimal -> Number
    const orderTotal = Number(order.total);
    const orderTax = Number(order.taxTotal);
    const orderShipping = Number(order.shippingTotal);

    const netSale = orderTotal - orderTax - orderShipping;
    const profit = netSale - orderCost;

    if (chartMap.has(dateKey)) {
      const existing = chartMap.get(dateKey)!;
      existing.revenue += orderTotal;
      existing.profit += profit;
      existing.orders += 1;
    } else {
      chartMap.set(dateKey, {
        date: dateKey,
        fullDate,
        revenue: orderTotal,
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