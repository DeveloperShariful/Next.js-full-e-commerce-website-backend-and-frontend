//app/actions/admin/dashboard/index.ts

"use server";

import { startOfDay, endOfDay, subDays } from "date-fns";
import { getAllStats } from "./fetch-stats";
import { getActionAlerts } from "./fetch-alerts";
import { getGraphData, getRecentData, getStoreSettings } from "./fetch-misc";

export async function getDashboardOverview() {
  const now = new Date(); // Server Time

  try {
    // 1. Setup Date Ranges
    const todayStart = startOfDay(now);
    // For testing future data (2026), extend end date. In production, use endOfDay(now)
    const todayEnd = new Date(new Date().setFullYear(new Date().getFullYear() + 5)); 
    
    const yesterdayStart = startOfDay(subDays(now, 1));
    const yesterdayEnd = endOfDay(subDays(now, 1));
    
    const weekStart = startOfDay(subDays(now, 7));
    const monthStart = startOfDay(subDays(now, 30));

    // Comparison Ranges
    const prevDayStart = startOfDay(subDays(now, 2));
    const prevWeekStart = startOfDay(subDays(now, 14));
    const prevMonthStart = startOfDay(subDays(now, 60));

    // 2. Execute All Queries in Parallel
    const [
      [todayStats, yesterdayStats, weekStats, monthStats],
      alerts,
      graphData,
      { recentOrders, recentActivities },
      currencySymbol
    ] = await Promise.all([
      getAllStats(todayStart, todayEnd, yesterdayStart, yesterdayEnd, weekStart, monthStart, prevDayStart, prevWeekStart, prevMonthStart),
      getActionAlerts(),
      getGraphData(now),
      getRecentData(),
      getStoreSettings()
    ]);

    // 3. Return Combined Data
    return {
      stats: {
        today: todayStats,
        yesterday: yesterdayStats,
        week: weekStats,
        month: monthStats
      },
      alerts,
      graphData,
      recentOrders,
      recentActivities,
      currencySymbol
    };

  } catch (error) {
    console.error("DASHBOARD_AGGREGATION_ERROR", error);
    return null;
  }
}