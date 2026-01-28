//app/actions/admin/settings/affiliate/_services/analytics-service.ts
// File: app/actions/admin/settings/affiliate/_services/analytics-service.ts

"use server";

import { db } from "@/lib/prisma";
import { subMonths, format, startOfMonth } from "date-fns";
import { Prisma } from "@prisma/client";

export async function getTopProducts(limit: number = 5) {
  try {
    const result = await db.$queryRaw<any[]>`
      SELECT 
        "productName" as name,
        SUM(total) as revenue,
        SUM(quantity) as sales
      FROM "OrderItem"
      WHERE "orderId" IN (
        SELECT id FROM "Order" WHERE "affiliateId" IS NOT NULL
      )
      GROUP BY "productName"
      ORDER BY revenue DESC
      LIMIT ${limit}
    `;

    return result.map(p => ({
      name: p.name,
      revenue: Number(p.revenue),
      sales: Number(p.sales)
    }));
  } catch (error) {
    console.error("Top Products Error:", error);
    return [];
  }
}

export async function getTrafficSources() {
  try {
    const result = await db.$queryRaw<any[]>`
      SELECT 
        referrer as source,
        COUNT(id) as visits
      FROM "AffiliateClick"
      GROUP BY referrer
      ORDER BY visits DESC
      LIMIT 10
    `;

    return result.map(s => ({
      source: s.source ? new URL(s.source).hostname : "Direct / Email",
      visits: Number(s.visits)
    }));
  } catch (error) {
    return [];
  }
}

export async function getTopAffiliates(limit: number = 5) {
  const top = await db.affiliateAccount.findMany({
    orderBy: { totalEarnings: "desc" },
    take: limit,
    select: {
      id: true,
      user: { select: { name: true, email: true, image: true } },
      totalEarnings: true,
      slug: true
    }
  });

  return top.map(a => ({
    name: a.user.name || "Unknown",
    email: a.user.email,
    avatar: a.user.image,
    earnings: a.totalEarnings.toNumber(),
    slug: a.slug
  }));
}

export async function getMonthlyPerformance() {
  try {
    const start = subMonths(startOfMonth(new Date()), 5);
    
    const result = await db.$queryRaw<any[]>`
      SELECT 
        TO_CHAR("createdAt", 'Mon YYYY') as month,
        DATE_TRUNC('month', "createdAt") as date_sort,
        SUM("totalOrderAmount") as revenue,
        SUM("commissionAmount") as commission
      FROM "Referral"
      WHERE "createdAt" >= ${start}
        AND status IN ('APPROVED', 'PAID')
      GROUP BY month, date_sort
      ORDER BY date_sort ASC
    `;

    return result.map(r => ({
      month: r.month,
      revenue: Number(r.revenue || 0),
      commission: Number(r.commission || 0)
    }));
  } catch (error) {
    console.error("Analytics Error:", error);
    return [];
  }
}