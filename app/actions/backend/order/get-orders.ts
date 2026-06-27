// File Location: app/actions/admin/orders/get-orders.ts

"use server";

import { db } from "@/lib/prisma";
import { OrderStatus, Prisma } from "@prisma/client";

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

    // Accurate Timezone Calculation for Full Day
    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;

    if (startDate) {
      parsedStartDate = new Date(startDate);
      parsedStartDate.setHours(0, 0, 0, 0); // Start of the day
    }

    if (endDate) {
      parsedEndDate = new Date(endDate);
      parsedEndDate.setHours(23, 59, 59, 999); // End of the day
    }

    // 🔥 FIXED: Separate Base Filter array created
    // এটি ডেট, পেমেন্ট মেথড এবং সার্চ কোয়ারিগুলো ধরে রাখবে।
    const baseFilterParams: Prisma.OrderWhereInput[] = [];

    if (query) {
      baseFilterParams.push({
        OR: [
          { orderNumber: { contains: query, mode: 'insensitive' } },
          { user: { name: { contains: query, mode: 'insensitive' } } },
          { user: { email: { contains: query, mode: 'insensitive' } } },
          { guestEmail: { contains: query, mode: 'insensitive' } },
          // JSON Address Search (Guest Search Supported)
          { billingAddress: { path: ['firstName'], string_contains: query } },
          { billingAddress: { path: ['phone'], string_contains: query } }
        ]
      });
    }

    if (parsedStartDate) {
      baseFilterParams.push({ createdAt: { gte: parsedStartDate } });
    }

    if (parsedEndDate) {
      baseFilterParams.push({ createdAt: { lte: parsedEndDate } });
    }

    if (paymentMethod && paymentMethod !== "all") {
      baseFilterParams.push({
        OR: [
            { paymentGateway: { contains: paymentMethod, mode: 'insensitive' } },
            { paymentMethod: { contains: paymentMethod, mode: 'insensitive' } }
        ]
      });
    }

    const whereCondition: Prisma.OrderWhereInput = {
      AND: [
        ...baseFilterParams,
        isTrashMode ? { deletedAt: { not: null } } : { deletedAt: null },
        status && status !== "all" && status !== "trash" ? { status: status as OrderStatus } : {}
      ]
    };

    const [orders, totalCount, statusCounts, trashCount] = await Promise.all([
      db.order.findMany({
        where: whereCondition,
        include: {
          user: { select: { name: true, email: true } },
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

      // 🔥 FIXED: GroupBy now uses baseFilterParams 
      // ফলে ডেট সিলেক্ট করলে শুধু ওই ডেটের Pending, Processing কাউন্ট হবে!
      db.order.groupBy({
        by: ['status'],
        _count: { status: true },
        where: { 
          AND: [
            ...baseFilterParams,
            { deletedAt: null }
          ] 
        }
      }),

      // 🔥 FIXED: Trash count also respects date & search filters
      db.order.count({
        where: { 
          AND: [
            ...baseFilterParams,
            { deletedAt: { not: null } }
          ] 
        }
      })
    ]);

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
      all:             statusCounts.reduce((acc, curr) => acc + curr._count.status, 0),
      pending:         statusCounts.find(s => s.status === 'PENDING')?._count.status || 0,
      processing:      statusCounts.find(s => s.status === 'PROCESSING')?._count.status || 0,
      completed:       statusCounts.find(s => s.status === 'DELIVERED')?._count.status || 0,
      cancelled:       statusCounts.find(s => s.status === 'CANCELLED')?._count.status || 0,
      refunded:        statusCounts.find(s => s.status === 'REFUNDED')?._count.status || 0,
      failed:          statusCounts.find(s => s.status === 'FAILED')?._count.status || 0,
      draft:           statusCounts.find(s => s.status === 'DRAFT')?._count.status || 0,
      awaitingPayment: statusCounts.find(s => s.status === 'AWAITING_PAYMENT')?._count.status || 0,
      packed:          statusCounts.find(s => s.status === 'PACKED')?._count.status || 0,
      shipped:         statusCounts.find(s => s.status === 'SHIPPED')?._count.status || 0,
      returned:        statusCounts.find(s => s.status === 'RETURNED')?._count.status || 0,
      readyForPickup:  statusCounts.find(s => s.status === 'READY_FOR_PICKUP')?._count.status || 0,
      partiallyPaid:   statusCounts.find(s => s.status === 'PARTIALLY_PAID')?._count.status || 0,
      trash:           trashCount
    };

    return { 
      success: true, 
      data: serializedOrders, 
      meta: { total: totalCount, pages: Math.ceil(totalCount / limit), counts } 
    };

  } catch (error: unknown) {
    console.error("GET_ORDERS_ERROR", error);
    return { success: false, error: "Failed to fetch orders" };
  }
}

export async function getOrderDetails(orderId: string) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        affiliate: { include: { user: true } },
        referrals: { select: { commissionRate: true, commissionType: true, commissionAmount: true }, take: 1 },
        subscription: true,
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
        shipments: { orderBy: { shippedDate: 'desc' } },
        pickupLocation: true, 
        transactions: { orderBy: { createdAt: 'desc' } },
        refunds: { orderBy: { createdAt: 'desc' } },
        disputes: true, 
        discount: true, 
        returns: true, 
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