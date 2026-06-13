//File: app/actions/backend/analytics/shared.utils.ts

import { Analytics } from "@prisma/client";

export interface DateRange {
  from: Date;
  to: Date;
}

export interface SerializedAnalytics {
  date: string;
  grossSales: number;
  netSales: number;
  totalTax: number;
  totalShipping: number;
  totalDiscounts: number;
  totalRefunds: number;
  totalOrders: number;
  productsSold: number;
  variationsSold: number;
  newCustomers: number;
  returningCustomers: number;
  abandonedCheckouts: number;
  recoveredCheckouts: number;
  totalVisitors: number;
  totalPageViews: number;
}

export function serializeAnalyticsData(data: Analytics): SerializedAnalytics {
  return {
    date: data.date.toISOString(),
    grossSales: Number(data.grossSales),
    netSales: Number(data.netSales),
    totalTax: Number(data.totalTax),
    totalShipping: Number(data.totalShipping),
    totalDiscounts: Number(data.totalDiscounts),
    totalRefunds: Number(data.totalRefunds),
    totalOrders: data.totalOrders,
    productsSold: data.productsSold,
    variationsSold: data.variationsSold,
    newCustomers: data.newCustomers,
    returningCustomers: data.returningCustomers,
    abandonedCheckouts: data.abandonedCheckouts,
    recoveredCheckouts: data.recoveredCheckouts,
    totalVisitors: data.totalVisitors,
    totalPageViews: data.totalPageViews,
  };
}

export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  const change = ((current - previous) / previous) * 100;
  return Number(change.toFixed(2));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-AU").format(value);
}

export function parseDateRange(
  period: string, 
  compare: string, 
  customFrom?: string, 
  customTo?: string
): { current: DateRange; previous: DateRange } {
  const currentFrom = new Date();
  const currentTo = new Date();

  // 🔴 100% ACCURATE CUSTOM DATE LOGIC
  if (period === "custom" && customFrom && customTo) {
    const parsedFrom = new Date(customFrom);
    const parsedTo = new Date(customTo);
    
    currentFrom.setTime(parsedFrom.getTime());
    currentFrom.setHours(0, 0, 0, 0);
    
    currentTo.setTime(parsedTo.getTime());
    currentTo.setHours(23, 59, 59, 999);
  } else {
    // PRESET LOGIC
    switch (period) {
      case "today":
        currentFrom.setHours(0, 0, 0, 0);
        currentTo.setHours(23, 59, 59, 999);
        break;
      case "yesterday":
        currentFrom.setDate(currentFrom.getDate() - 1);
        currentFrom.setHours(0, 0, 0, 0);
        currentTo.setDate(currentTo.getDate() - 1);
        currentTo.setHours(23, 59, 59, 999);
        break;
      case "week_to_date":
        const dayOfWeek = currentFrom.getDay();
        const diffToMonday = currentFrom.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        currentFrom.setDate(diffToMonday);
        currentFrom.setHours(0, 0, 0, 0);
        currentTo.setHours(23, 59, 59, 999);
        break;
      case "last_week":
        const lastWeekDate = new Date();
        lastWeekDate.setDate(lastWeekDate.getDate() - 7);
        const lwDayOfWeek = lastWeekDate.getDay();
        const lwDiffToMonday = lastWeekDate.getDate() - lwDayOfWeek + (lwDayOfWeek === 0 ? -6 : 1);
        currentFrom.setDate(lwDiffToMonday - 7);
        currentFrom.setHours(0, 0, 0, 0);
        currentTo.setDate(lwDiffToMonday - 1);
        currentTo.setHours(23, 59, 59, 999);
        break;
      case "month_to_date":
        currentFrom.setDate(1);
        currentFrom.setHours(0, 0, 0, 0);
        currentTo.setHours(23, 59, 59, 999);
        break;
      case "last_month":
        currentFrom.setMonth(currentFrom.getMonth() - 1, 1);
        currentFrom.setHours(0, 0, 0, 0);
        currentTo.setMonth(currentTo.getMonth(), 0);
        currentTo.setHours(23, 59, 59, 999);
        break;
      case "year_to_date":
        currentFrom.setMonth(0, 1);
        currentFrom.setHours(0, 0, 0, 0);
        currentTo.setHours(23, 59, 59, 999);
        break;
      case "last_year":
      default:
        currentFrom.setFullYear(currentFrom.getFullYear() - 1, 0, 1);
        currentFrom.setHours(0, 0, 0, 0);
        currentTo.setFullYear(currentTo.getFullYear() - 1, 11, 31);
        currentTo.setHours(23, 59, 59, 999);
        break;
    }
  }

  // COMPARE PERIOD LOGIC (Calculates exact millisecond differences for accuracy)
  const previousFrom = new Date(currentFrom.getTime());
  const previousTo = new Date(currentTo.getTime());

  if (compare === "previous_year") {
    previousFrom.setFullYear(previousFrom.getFullYear() - 1);
    previousTo.setFullYear(previousTo.getFullYear() - 1);
  } else {
    // previous_period (E.g., if 5 days selected, compare to the 5 days before it)
    const durationInMs = currentTo.getTime() - currentFrom.getTime();
    previousTo.setTime(currentFrom.getTime() - 1);
    previousFrom.setTime(previousTo.getTime() - durationInMs);
  }

  return {
    current: { from: currentFrom, to: currentTo },
    previous: { from: previousFrom, to: previousTo }
  };
}