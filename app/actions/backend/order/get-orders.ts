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
          // 🔥 NEW: Added affiliate relation to fetch dynamic Origin
          affiliate: {
            include: {
              user: { select: { name: true } }
            }
          },
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

    // 🔥 NEW: Added missing status counts for WooCommerce header
    const counts = {
      all: statusCounts.reduce((acc, curr) => acc + curr._count.status, 0),
      pending: statusCounts.find(s => s.status === 'PENDING')?._count.status || 0,
      processing: statusCounts.find(s => s.status === 'PROCESSING')?._count.status || 0,
      completed: statusCounts.find(s => s.status === 'DELIVERED')?._count.status || 0, 
      cancelled: statusCounts.find(s => s.status === 'CANCELLED')?._count.status || 0,
      refunded: statusCounts.find(s => s.status === 'REFUNDED')?._count.status || 0,
      failed: statusCounts.find(s => s.status === 'FAILED')?._count.status || 0,
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

export async function getOrderDetails(orderId: string) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        // 1. Customer
        user: true,
        
        // 🔥 NEW: Affiliate & Subscription (From Schema)
        affiliate: { include: { user: true } },
        subscription: true,
        
        // 2. Items with LIVE Product Data
        items: {
            include: {
                product: { 
                  select: { 
                    id: true, 
                    stock: true, 
                    name: true, 
                    featuredImage: true 
                  } 
                }
            }
        },
        
        // 3. Logistics
        shipments: { orderBy: { shippedDate: 'desc' } },
        pickupLocation: true, 
        
        // 4. Financials
        transactions: { orderBy: { createdAt: 'desc' } },
        refunds: { orderBy: { createdAt: 'desc' } },
        disputes: true, 
        
        // 5. Marketing
        discount: true, 
        
        // 6. After Sales
        returns: true, 

        // 7. Communication
        orderNotes: { orderBy: { createdAt: 'desc' } }
      }
    });
    
    if (!order) return { success: false, error: "Order not found" };
    return { success: true, data: order };
    
  } catch (error) {
    console.error("GET_ORDER_DETAILS_ERROR", error);
    return { success: false, error: "Database error" };
  }
}