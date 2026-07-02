//app/actions/admin/dashboard/index.ts

"use server";

import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { getAllStats } from "./fetch-stats";
import { getActionAlerts } from "./fetch-alerts";
import { getGraphData, getRecentData, getStoreSettings } from "./fetch-misc";
import { getStoreTimezone } from "@/lib/get-store-timezone";

export async function getDashboardOverview() {
  const [timezone, currencySymbol] = await Promise.all([
    getStoreTimezone(),
    getStoreSettings(),
  ]);

  // Convert server UTC time → store timezone
  const nowUtc = new Date();
  const now = toZonedTime(nowUtc, timezone);

  const tz = (d: Date) => fromZonedTime(d, timezone); // zoned → UTC for DB queries

  try {
    // 1. Setup Date Ranges (all in store timezone, converted to UTC for DB)
    const todayStart    = tz(startOfDay(now));
    // Keep 5-year window so orders created today (in any timezone offset) are included
    const todayEnd      = new Date(nowUtc.getTime()); todayEnd.setFullYear(todayEnd.getFullYear() + 5);

    const yesterdayStart = tz(startOfDay(subDays(now, 1)));
    const yesterdayEnd   = tz(endOfDay(subDays(now, 1)));

    const weekStart  = tz(startOfDay(subDays(now, 7)));
    const monthStart = tz(startOfDay(subDays(now, 30)));

    // This Month (calendar month: 1st of current month → now)
    const thisMonthStart    = tz(startOfMonth(now));
    const prevCalMonthStart = tz(startOfMonth(subMonths(now, 1)));
    const prevCalMonthEnd   = tz(endOfMonth(subMonths(now, 1)));

    // Comparison Ranges
    const prevDayStart   = tz(startOfDay(subDays(now, 2)));
    const prevWeekStart  = tz(startOfDay(subDays(now, 14)));
    const prevMonthStart = tz(startOfDay(subDays(now, 60)));

    // 2. Execute All Queries in Parallel
    const [
      [todayStats, yesterdayStats, weekStats, monthStats, thisMonthStats],
      alerts,
      graphData,
      { recentOrders, recentActivities },
    ] = await Promise.all([
      getAllStats(todayStart, todayEnd, yesterdayStart, yesterdayEnd, weekStart, monthStart, prevDayStart, prevWeekStart, prevMonthStart, thisMonthStart, prevCalMonthStart, prevCalMonthEnd),
      getActionAlerts(),
      getGraphData(nowUtc, timezone),
      getRecentData(),
    ]);

    // 3. Return Combined Data
    return {
      stats: {
        today: todayStats,
        yesterday: yesterdayStats,
        week: weekStats,
        month: monthStats,
        this_month: thisMonthStats,
      },
      alerts,
      graphData,
      recentOrders,
      recentActivities,
      currencySymbol,
      timezone,
    };

  } catch (error) {
    console.error("DASHBOARD_AGGREGATION_ERROR", error);
    return null;
  }
}