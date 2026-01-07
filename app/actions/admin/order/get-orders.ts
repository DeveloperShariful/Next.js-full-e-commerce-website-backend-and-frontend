// File Location: app/actions/admin/orders/get-orders.ts

"use server";

import { db } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export async function getOrders(
  page: number = 1, 
  limit: number = 20, 
  status?: string, 
  query?: string
) {
  try {
    const skip = (page - 1) * limit;
    const isTrashMode = status === 'trash';

    // 1. Base Filter Conditions
    const whereCondition: any = {
      AND: [
        // 🔥 TRASH LOGIC: 
        // যদি Trash মোড হয়, তবে deletedAt ভ্যালু থাকবে।
        // যদি Normal মোড হয়, তবে deletedAt অবশ্যই null হতে হবে (যাতে ডিলিট হওয়া অর্ডার মেইন লিস্টে না আসে)।
        isTrashMode 
            ? { deletedAt: { not: null } } 
            : { deletedAt: null },

        // Status Filter (Trash বা All বাদে অন্য স্ট্যাটাস হলে ফিল্টার করবে)
        status && status !== 'all' && status !== 'trash' 
            ? { status: status as OrderStatus } 
            : {},

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

    // 2. Parallel Data Fetching
    const [orders, totalCount, statusCounts, trashCount] = await Promise.all([
      // A. Fetch Orders based on filter
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

      // B. Total Count for Pagination (Current View)
      db.order.count({ where: whereCondition }),

      // C. Group Count for Status Tabs (Only Active Orders)
      db.order.groupBy({
        by: ['status'],
        _count: { status: true },
        where: { deletedAt: null } // শুধু একটিভ অর্ডারের কাউন্ট
      }),

      // D. 🔥 Trash Count (আলাদা করে ট্র্যাশ বিনে কতগুলো আছে তা গোনা)
      db.order.count({
        where: { deletedAt: { not: null } }
      })
    ]);

    // 3. Format Status Counts for UI Tabs
    const counts = {
      all: statusCounts.reduce((acc, curr) => acc + curr._count.status, 0),
      pending: statusCounts.find(s => s.status === 'PENDING')?._count.status || 0,
      processing: statusCounts.find(s => s.status === 'PROCESSING')?._count.status || 0,
      completed: statusCounts.find(s => s.status === 'DELIVERED')?._count.status || 0, 
      cancelled: statusCounts.find(s => s.status === 'CANCELLED')?._count.status || 0,
      trash: trashCount // 🔥 Added Trash Count
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