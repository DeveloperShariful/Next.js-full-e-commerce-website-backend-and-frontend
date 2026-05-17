//app/actions/admin/analytics/customer-analytics.ts

"use server";

import { db } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { 
  DateRange, 
  CustomerDemographic, 
  CustomerTypeBreakdown 
} from "./types";

interface AddressJson {
  city?: string;
  country?: string;
  state?: string;
}

export async function getCustomerAnalytics(current: DateRange): Promise<{
  customerDemographics: CustomerDemographic[];
  customerTypeBreakdown: CustomerTypeBreakdown;
  topCustomers: { id: string; name: string; email: string; totalSpent: number; orders: number }[];
}> {
  
  const validStatus = { notIn: [OrderStatus.CANCELLED, OrderStatus.DRAFT, OrderStatus.FAILED] as OrderStatus[] };

  const ordersWithAddress = await db.order.findMany({
    where: {
      createdAt: { gte: current.startDate, lte: current.endDate },
      status: validStatus
    },
    select: {
      shippingAddress: true,
      total: true
    },
    take: 5000
  });

  const geoMap = new Map<string, { city: string; country: string; count: number; revenue: number }>();

  ordersWithAddress.forEach(order => {
    const addr = order.shippingAddress as unknown as AddressJson;
    
    if (addr && typeof addr === 'object') {
      const city = addr.city || "Unknown City";
      const country = addr.country || "Unknown";
      
      const key = `${city}-${country}`;
      
      // ✅ FIX: Decimal to Number Conversion
      const orderTotal = Number(order.total);

      if (geoMap.has(key)) {
        const existing = geoMap.get(key)!;
        existing.count += 1;
        existing.revenue += orderTotal;
      } else {
        geoMap.set(key, {
          city: city,
          country: country,
          count: 1,
          revenue: orderTotal
        });
      }
    }
  });

  const customerDemographics = Array.from(geoMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const ordersWithUser = await db.order.findMany({
    where: {
      createdAt: { gte: current.startDate, lte: current.endDate },
      status: validStatus,
      userId: { not: null }
    },
    select: {
      total: true,
      userId: true,
      user: {
        select: { createdAt: true }
      }
    }
  });

  let newCustCount = 0;
  let retCustCount = 0;
  let newCustRev = 0;
  let retCustRev = 0;

  const processedUsers = new Set<string>();

  ordersWithUser.forEach(order => {
    if (order.user && order.userId) {
      const userCreatedDate = new Date(order.user.createdAt);
      const isNewUser = userCreatedDate >= current.startDate && userCreatedDate <= current.endDate;
      
      // ✅ FIX: Decimal to Number Conversion
      const orderTotal = Number(order.total);

      if (isNewUser) {
        newCustRev += orderTotal;
        if (!processedUsers.has(order.userId)) {
          newCustCount++;
          processedUsers.add(order.userId);
        }
      } else {
        retCustRev += orderTotal;
        if (!processedUsers.has(order.userId)) {
          retCustCount++;
          processedUsers.add(order.userId);
        }
      }
    }
  });

  const topSpendersAgg = await db.order.groupBy({
    by: ['userId'],
    where: {
      createdAt: { gte: current.startDate, lte: current.endDate },
      status: validStatus,
      userId: { not: null }
    },
    _sum: { total: true },
    _count: { id: true },
    orderBy: { _sum: { total: 'desc' } },
    take: 5
  });

  const userIds = topSpendersAgg.map(u => u.userId).filter(id => id !== null) as string[];
  
  const userDetails = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true }
  });

  const topCustomers = topSpendersAgg.map(agg => {
    const user = userDetails.find(u => u.id === agg.userId);
    return {
      id: agg.userId || "guest",
      name: user?.name || "Guest User",
      email: user?.email || "N/A",
      // ✅ FIX: Decimal to Number Conversion
      totalSpent: Number(agg._sum.total || 0),
      orders: agg._count.id || 0
    };
  }).filter(c => c.id !== "guest");

  return {
    customerDemographics,
    customerTypeBreakdown: {
      newCustomers: newCustCount,
      returningCustomers: retCustCount,
      newRevenue: newCustRev,
      returningRevenue: retCustRev
    },
    topCustomers
  };
}