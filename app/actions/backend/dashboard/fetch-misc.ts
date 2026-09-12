//app/actions/admin/dashboard/fetch-misc.ts

"use server";

import { db } from "@/lib/prisma";
import { startOfYear, endOfYear } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { SUCCESS_STATUSES } from "@/app/actions/backend/analytics/shared.utils";

export async function getGraphData(nowUtc: Date, timezone: string) {
  const nowZoned = toZonedTime(nowUtc, timezone);
  const yearStart = fromZonedTime(startOfYear(nowZoned), timezone);
  const yearEnd   = fromZonedTime(endOfYear(nowZoned), timezone);

  // ⚠️ FIX: আগে এখানে `total` (subtotal+shipping+tax+surcharge-discount) যোগ
  // হতো, আর কোনো paymentStatus/deletedAt filter-ই ছিল না — ফলে unpaid,
  // refunded, এমনকি trash করা order-ও যোগ হয়ে যেত। এখন Store Performance
  // card (fetch-stats.ts) আর Analytics (sync-analytics/route.ts,
  // analytics/shared.utils.ts) দুটোই যে সংজ্ঞা ব্যবহার করে — সেই একই
  // SUCCESS_STATUSES (analytics-এর single-source-of-truth) + deletedAt:null
  // filter, আর max(0, subtotal-discountTotal) formula — এখানেও বসানো হলো,
  // যাতে চার্টের সংখ্যা বাকি ড্যাশবোর্ডের "Net Sales"-এর সাথে মিলে যায়।
  const yearOrders = await db.order.findMany({
    where: {
      createdAt: { gte: yearStart, lte: yearEnd },
      status: { in: SUCCESS_STATUSES },
      deletedAt: null,
    },
    select: { createdAt: true, subtotal: true, discountTotal: true }
  });

  const graphData = Array(12).fill(0).map((_, i) => ({
    name: new Date(0, i).toLocaleString('default', { month: 'short' }),
    total: 0
  }));

  yearOrders.forEach(order => {
    // Group by month in store timezone (not UTC)
    const month = toZonedTime(order.createdAt, timezone).getMonth();
    graphData[month].total += Math.max(0, Number(order.subtotal) - Number(order.discountTotal));
  });

  return graphData;
}

export async function getRecentData() {
  const recentOrders = await db.order.findMany({
    take: 7,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, email: true } } }
  });

  // ✅ FIX: Convert total to number for serialization
  const serializedOrders = recentOrders.map(order => ({
    ...order,
    total: Number(order.total),
    subtotal: Number(order.subtotal),
    taxTotal: Number(order.taxTotal),
    shippingTotal: Number(order.shippingTotal),
    discountTotal: Number(order.discountTotal)
  }));

  const recentActivities = await db.activityLog.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, image: true, role: true } } }
  });

  return { recentOrders: serializedOrders, recentActivities };
}

export async function getStoreSettings() {
  const settings = await db.storeSettings.findUnique({ where: { id: "settings" }, select: { currencySymbol: true } });
  return settings?.currencySymbol || "$";
}