//File: app/actions/backend/analytics/shared.utils.ts

import { Analytics, OrderStatus } from "@prisma/client";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import {
  startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear,
  addDays, subDays, subMonths, subYears,
} from "date-fns";
import { storeDayStart } from "@/lib/store-time";

// Single source of truth for all analytics files — must match sync-analytics/route.ts
export const SUCCESS_STATUSES: OrderStatus[] = [
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "READY_FOR_PICKUP",
  "PARTIALLY_PAID",
];

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
  customFrom: string | undefined,
  customTo: string | undefined,
  timezone: string
): { current: DateRange; previous: DateRange } {
  // All boundaries are computed on the store's local wall-clock calendar
  // (matching app/actions/backend/dashboard/index.ts's `tz()` pattern), then
  // converted to the equivalent UTC instant for the DB query — otherwise
  // "today"/"this week" etc. drift by ~10 hours against the server's UTC
  // clock (see storeDayStart's doc comment).
  const now = toZonedTime(new Date(), timezone);
  const tzEnd = (d: Date) => fromZonedTime(endOfDay(d), timezone);
  // `d` here is always something derived from `now` (already zoned once,
  // above) — converting straight back with fromZonedTime, exactly mirroring
  // tzEnd. Do NOT route this through storeDayStart: that helper internally
  // calls toZonedTime again on its input, and applying toZonedTime a second
  // time to an already-zoned Date silently jumps a full day forward for
  // part of the day (store-local ~20:00–23:59) — currentFrom would land
  // after currentTo and every query returns zero rows.
  const tzStart = (d: Date) => fromZonedTime(startOfDay(d), timezone);

  let currentFrom: Date;
  let currentTo: Date;

  // 🔴 100% ACCURATE CUSTOM DATE LOGIC
  if (period === "custom" && customFrom && customTo) {
    // customFrom/customTo arrive as "yyyy-MM-dd" already picked in the
    // store's timezone (see date-range-picker.tsx) — parse as a plain
    // calendar date, not a UTC instant. Unlike the preset branches below,
    // these are raw/naive Dates (not already zoned), so storeDayStart's
    // single toZonedTime application is the correct (and needed) conversion
    // here.
    currentFrom = storeDayStart(new Date(`${customFrom}T00:00:00`), timezone);
    currentTo = tzEnd(new Date(`${customTo}T00:00:00`));
  } else {
    // PRESET LOGIC
    switch (period) {
      case "today":
        currentFrom = tzStart(now);
        currentTo = tzEnd(now);
        break;
      case "yesterday":
        currentFrom = tzStart(subDays(now, 1));
        currentTo = tzEnd(subDays(now, 1));
        break;
      case "last_7_days":
        currentFrom = tzStart(subDays(now, 7));
        currentTo = tzEnd(now);
        break;
      case "last_30_days":
        currentFrom = tzStart(subDays(now, 30));
        currentTo = tzEnd(now);
        break;
      case "week_to_date": {
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        currentFrom = tzStart(addDays(now, diffToMonday));
        currentTo = tzEnd(now);
        break;
      }
      case "last_week": {
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const thisMonday = addDays(now, diffToMonday);
        currentFrom = tzStart(subDays(thisMonday, 7));
        currentTo = tzEnd(subDays(thisMonday, 1));
        break;
      }
      case "month_to_date":
        currentFrom = tzStart(startOfMonth(now));
        currentTo = tzEnd(now);
        break;
      case "last_month":
        currentFrom = tzStart(startOfMonth(subMonths(now, 1)));
        currentTo = tzEnd(endOfMonth(subMonths(now, 1)));
        break;
      case "quarter_to_date": {
        const qMonth = Math.floor(now.getMonth() / 3) * 3;
        currentFrom = tzStart(new Date(now.getFullYear(), qMonth, 1));
        currentTo = tzEnd(now);
        break;
      }
      case "last_quarter": {
        const qMonth = Math.floor(now.getMonth() / 3) * 3;
        const thisQuarterStart = new Date(now.getFullYear(), qMonth, 1);
        const lastQuarterEnd = subDays(thisQuarterStart, 1);
        const lqMonth = Math.floor(lastQuarterEnd.getMonth() / 3) * 3;
        currentFrom = tzStart(new Date(lastQuarterEnd.getFullYear(), lqMonth, 1));
        currentTo = tzEnd(lastQuarterEnd);
        break;
      }
      case "year_to_date":
        currentFrom = tzStart(startOfYear(now));
        currentTo = tzEnd(now);
        break;
      case "last_year":
      default:
        currentFrom = tzStart(startOfYear(subYears(now, 1)));
        currentTo = tzEnd(endOfYear(subYears(now, 1)));
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