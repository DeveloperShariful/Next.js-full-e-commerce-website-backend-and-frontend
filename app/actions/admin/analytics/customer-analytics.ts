//app/actions/admin/analytics/customer-analytics.ts

"use server";

import { db } from "@/lib/prisma";
import { OrderStatus, Prisma } from "@prisma/client";
import { 
  DateRange, 
  CustomerDemographic, 
  CustomerTypeBreakdown 
} from "./types";

// Helper Interface for casting the JSON Address field safely
interface AddressJson {
  city?: string;
  country?: string;
  state?: string;
}

/**
 * Calculates advanced customer metrics: 
 * 1. Geographic distribution (Heatmap data)
 * 2. Retention (New vs Returning breakdown)
 * 3. Top Spending Customers (VIPs)
 */
export async function getCustomerAnalytics(current: DateRange): Promise<{
  customerDemographics: CustomerDemographic[];
  customerTypeBreakdown: CustomerTypeBreakdown;
  topCustomers: { id: string; name: string; email: string; totalSpent: number; orders: number }[];
}> {
  
  // Define valid order status (completed sales)
  const validStatus = { notIn: [OrderStatus.CANCELLED, OrderStatus.DRAFT, OrderStatus.FAILED] as OrderStatus[] };

  // ====================================================
  // 1. Customer Demographics (City/Country Analysis)
  // ====================================================
  // We fetch shipping addresses to map out where sales are coming from.
  const ordersWithAddress = await db.order.findMany({
    where: {
      createdAt: { gte: current.startDate, lte: current.endDate },
      status: validStatus
    },
    select: {
      shippingAddress: true,
      total: true
    },
    take: 5000 // Performance safeguard: Analyze sample set if data is huge
  });

  const geoMap = new Map<string, { city: string; country: string; count: number; revenue: number }>();

  ordersWithAddress.forEach(order => {
    // Safe Cast JSON to known structure
    // We treat unknown as 'Unknown Location'
    const addr = order.shippingAddress as unknown as AddressJson;
    
    if (addr && typeof addr === 'object') {
      // Normalize data (Title Case)
      const city = addr.city || "Unknown City";
      const country = addr.country || "Unknown";
      
      const key = `${city}-${country}`;
      
      if (geoMap.has(key)) {
        const existing = geoMap.get(key)!;
        existing.count += 1;
        existing.revenue += order.total;
      } else {
        geoMap.set(key, {
          city: city,
          country: country,
          count: 1,
          revenue: order.total
        });
      }
    }
  });

  const customerDemographics = Array.from(geoMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10); // Top 10 Locations

  // ====================================================
  // 2. New vs Returning Customers
  // ====================================================
  // Logic: 
  // - New Customer: User created account within this period OR First order ever is in this period.
  // - Returning Customer: User created account BEFORE this period.
  
  // Fetch orders with user info
  const ordersWithUser = await db.order.findMany({
    where: {
      createdAt: { gte: current.startDate, lte: current.endDate },
      status: validStatus,
      userId: { not: null } // Only analyze registered users for retention accuracy
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

  // Use a set to count unique customers per period, not just orders
  const processedUsers = new Set<string>();

  ordersWithUser.forEach(order => {
    if (order.user && order.userId) {
      const userCreatedDate = new Date(order.user.createdAt);
      const isNewUser = userCreatedDate >= current.startDate && userCreatedDate <= current.endDate;

      if (isNewUser) {
        newCustRev += order.total;
        if (!processedUsers.has(order.userId)) {
          newCustCount++;
          processedUsers.add(order.userId);
        }
      } else {
        retCustRev += order.total;
        if (!processedUsers.has(order.userId)) {
          retCustCount++;
          processedUsers.add(order.userId);
        }
      }
    }
  });

  // ====================================================
  // 3. Top Spending Customers (VIPs)
  // ====================================================
  // Group by UserID to find big spenders
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

  // Fetch User Details for these IDs (Prisma groupBy doesn't return relation fields)
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
      totalSpent: agg._sum.total || 0,
      orders: agg._count.id || 0
    };
  }).filter(c => c.id !== "guest"); // Filter out nulls if any slipped through

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