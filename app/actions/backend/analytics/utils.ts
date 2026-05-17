// app/actions/admin/analytics/utils.ts

import { startOfDay, endOfDay, subDays, subMonths, subYears, format } from "date-fns";
import { Period, DateRange } from "./types";

/**
 * Calculates the date range for the current period and the previous comparison period.
 * Comparison is essential for "Pro" analytics (e.g., This Month vs Last Month).
 */
export function getAnalyticsDateRanges(period: Period, customStart?: Date, customEnd?: Date): { current: DateRange; previous: DateRange } {
  const now = new Date();
  const todayEnd = endOfDay(now);

  let currentStart: Date;
  let previousStart: Date;
  let previousEnd: Date;

  switch (period) {
    case "7d":
      currentStart = startOfDay(subDays(now, 7));
      previousStart = startOfDay(subDays(now, 14));
      previousEnd = endOfDay(subDays(now, 8));
      break;
    case "90d":
      currentStart = startOfDay(subDays(now, 90));
      previousStart = startOfDay(subDays(now, 180));
      previousEnd = endOfDay(subDays(now, 91));
      break;
    case "year":
      currentStart = startOfDay(subYears(now, 1));
      previousStart = startOfDay(subYears(now, 2));
      previousEnd = endOfDay(subYears(now, 1).setDate(subYears(now, 1).getDate() - 1)); // Approximate
      break;
    case "custom":
      if (!customStart || !customEnd) throw new Error("Custom dates required");
      currentStart = startOfDay(customStart);
      const duration = customEnd.getTime() - customStart.getTime();
      previousEnd = endOfDay(new Date(currentStart.getTime() - 1)); // Day before start
      previousStart = startOfDay(new Date(previousEnd.getTime() - duration));
      todayEnd.setTime(customEnd.getTime()); // Override end
      break;
    case "30d":
    default:
      currentStart = startOfDay(subDays(now, 30));
      previousStart = startOfDay(subDays(now, 60));
      previousEnd = endOfDay(subDays(now, 31));
      break;
  }

  return {
    current: { startDate: currentStart, endDate: todayEnd },
    previous: { startDate: previousStart, endDate: previousEnd },
  };
}

/**
 * Calculates percentage change between two numbers safely.
 * Returns 0 if division by zero would occur.
 */
export function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Determines trend direction string.
 */
export function getTrend(val: number): "up" | "down" | "neutral" {
  if (val > 0) return "up";
  if (val < 0) return "down";
  return "neutral";
}