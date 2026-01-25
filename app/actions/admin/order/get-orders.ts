// File Location: app/actions/admin/orders/get-orders.ts

"use server";

import { db } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export async function getOrders(
  page: number = 1, 
  limit: number = 20, 
  status?: string, 
  query?: string,
  startDate?: string,
  endDate?: string,
  paymentMethod?: string
) {
  try {
    const skip = (page - 1) * limit;
    const isTrashMode = status === 'trash';

    const whereCondition: any = {
      AND: [
        isTrashMode 
            ? { deletedAt: { not: null } } 
            : { deletedAt: null },

        status && status !== 'all' && status !== 'trash' 
            ? { status: status as OrderStatus } 
            : {},

        query ? {
          OR: [
            { orderNumber: { contains: query, mode: 'insensitive' } },
            { user: { name: { contains: query, mode: 'insensitive' } } },
            { user: { email: { contains: query, mode: 'insensitive' } } },
            { guestEmail: { contains: query, mode: 'insensitive' } }
          ]
        } : {},

        startDate ? {
            createdAt: { gte: new Date(startDate) }
        } : {},

        endDate ? {
            createdAt: { lte: new Date(endDate) }
        } : {},

        paymentMethod && paymentMethod !== "all" ? {
            OR: [
                { paymentGateway: { contains: paymentMethod, mode: 'insensitive' } },
                { paymentMethod: { contains: paymentMethod, mode: 'insensitive' } }
            ]
        } : {}
      ]
    };

    const [orders, totalCount, statusCounts, trashCount] = await Promise.all([
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

      db.order.count({ where: whereCondition }),

      db.order.groupBy({
        by: ['status'],
        _count: { status: true },
        where: { deletedAt: null }
      }),

      db.order.count({
        where: { deletedAt: { not: null } }
      })
    ]);

    // 🔥 Serialize Decimals to Numbers
    const serializedOrders = orders.map(order => ({
        ...order,
        total: Number(order.total),
        subtotal: Number(order.subtotal),
        taxTotal: Number(order.taxTotal),
        shippingTotal: Number(order.shippingTotal),
        discountTotal: Number(order.discountTotal),
        refundedAmount: Number(order.refundedAmount || 0),
    }));

    const counts = {
      all: statusCounts.reduce((acc, curr) => acc + curr._count.status, 0),
      pending: statusCounts.find(s => s.status === 'PENDING')?._count.status || 0,
      processing: statusCounts.find(s => s.status === 'PROCESSING')?._count.status || 0,
      completed: statusCounts.find(s => s.status === 'DELIVERED')?._count.status || 0, 
      cancelled: statusCounts.find(s => s.status === 'CANCELLED')?._count.status || 0,
      trash: trashCount
    };

    return { 
      success: true, 
      data: serializedOrders, 
      meta: { total: totalCount, pages: Math.ceil(totalCount / limit), counts } 
    };

  } catch (error: any) {
    console.error("GET_ORDERS_ERROR", error);
    return { success: false, error: "Failed to fetch orders" };
  }
}