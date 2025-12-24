// File Location: app/actions/admin/orders/get-orders.ts

"use server";

import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";

export async function getOrders(
  page: number = 1, 
  limit: number = 20, 
  status?: string, 
  query?: string
) {
  try {
    const skip = (page - 1) * limit;

    // Build dynamic filter conditions
    const whereCondition: any = {
      AND: [
        // Status Filter
        status && status !== 'all' ? { status: status as OrderStatus } : {},
        // Search Query (Order Number, Customer Name, Email)
        query ? {
          OR: [
            { orderNumber: { contains: query, mode: 'insensitive' } },
            { user: { name: { contains: query, mode: 'insensitive' } } },
            { user: { email: { contains: query, mode: 'insensitive' } } },
            { guestEmail: { contains: query, mode: 'insensitive' } }
          ]
        } : {}
      ]
    };

    // Parallel Data Fetching for Performance
    const [orders, totalCount, statusCounts] = await Promise.all([
      // 1. Fetch Orders
      db.order.findMany({
        where: whereCondition,
        include: {
          user: { select: { name: true, email: true } },
          items: { select: { quantity: true } }, 
          _count: { select: { items: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      // 2. Total Count for Pagination
      db.order.count({ where: whereCondition }),
      // 3. Group Count for Status Tabs
      db.order.groupBy({
        by: ['status'],
        _count: { status: true }
      })
    ]);

    // Format Status Counts for UI Tabs
    const counts = {
      all: statusCounts.reduce((acc, curr) => acc + curr._count.status, 0),
      pending: statusCounts.find(s => s.status === 'PENDING')?._count.status || 0,
      processing: statusCounts.find(s => s.status === 'PROCESSING')?._count.status || 0,
      completed: statusCounts.find(s => s.status === 'DELIVERED')?._count.status || 0, 
      cancelled: statusCounts.find(s => s.status === 'CANCELLED')?._count.status || 0,
    };

    return { 
      success: true, 
      data: orders, 
      meta: { total: totalCount, pages: Math.ceil(totalCount / limit), counts } 
    };

  } catch (error: any) {
    console.error("GET_ORDERS_ERROR", error);
    return { success: false, error: "Failed to fetch orders" };
  }
}