//app/actions/admin/dashboard/fetch-misc.ts

"use server";

import { db } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { startOfYear, endOfYear } from "date-fns";

export async function getGraphData(now: Date) {
  const yearOrders = await db.order.findMany({
    where: {
      createdAt: { gte: startOfYear(now), lte: endOfYear(now) },
      status: { not: OrderStatus.CANCELLED }
    },
    select: { createdAt: true, total: true }
  });

  const graphData = Array(12).fill(0).map((_, i) => ({
    name: new Date(0, i).toLocaleString('default', { month: 'short' }),
    total: 0
  }));

  yearOrders.forEach(order => {
    const month = new Date(order.createdAt).getMonth();
    graphData[month].total += order.total;
  });

  return graphData;
}

export async function getRecentData() {
  const recentOrders = await db.order.findMany({
    take: 7,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, email: true } } }
  });

  const recentActivities = await db.activityLog.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, image: true, role: true } } }
  });

  return { recentOrders, recentActivities };
}

export async function getStoreSettings() {
  const settings = await db.storeSettings.findUnique({ where: { id: "settings" }, select: { currencySymbol: true } });
  return settings?.currencySymbol || "$";
}