// app/actions/order.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { OrderStatus } from "@prisma/client";

// --- TYPES ---
export type OrderListType = {
  id: string;
  orderNumber: string;
  createdAt: Date;
  status: OrderStatus;
  total: number; 
  user: { name: string | null; email: string } | null;
  items: { quantity: number }[];
  _count: { items: number };
};

// --- 1. GET ORDERS ---
export async function getOrders(
  page: number = 1, 
  limit: number = 20, 
  status?: string, 
  query?: string
) {
  try {
    const skip = (page - 1) * limit;

    const whereCondition: any = {
      AND: [
        status && status !== 'all' ? { status: status as OrderStatus } : {},
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

    const [orders, totalCount, statusCounts] = await Promise.all([
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
        _count: { status: true }
      })
    ]);

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

// --- 2. GET ORDER DETAILS ---
export async function getOrderDetails(orderId: string) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: true,
        shipments: true,
        refunds: true,
        orderNotes: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!order) return { success: false, error: "Order not found" };
    return { success: true, data: order };
  } catch (error) {
    return { success: false, error: "Database error" };
  }
}

// --- 3. UPDATE ORDER STATUS ---
export async function updateOrderStatus(formData: FormData) {
  try {
    const orderId = formData.get("orderId") as string;
    const status = formData.get("status") as OrderStatus;

    if (!orderId || !status) return { success: false, error: "Invalid data" };

    await db.order.update({
      where: { id: orderId },
      data: { status: status }
    });

    await db.orderNote.create({
      data: {
        orderId,
        content: `Order status changed to ${status}`,
        isSystem: true
      }
    });
    
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true, message: "Status updated successfully" };
  } catch (error) {
    return { success: false, error: "Update failed" };
  }
}

// --- 4. ADD ORDER NOTE ---
export async function addOrderNote(formData: FormData) {
  try {
    const orderId = formData.get("orderId") as string;
    const content = formData.get("content") as string;
    const notify = formData.get("notify") === "on";

    if (!orderId || !content) return { success: false, error: "Content required" };

    await db.orderNote.create({
      data: {
        orderId,
        content,
        notify,
        isSystem: false
      }
    });

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true, message: "Note added successfully" };
  } catch (error) {
    return { success: false, error: "Failed to add note" };
  }
}

// --- 5. DELETE ORDER (এই ফাংশনটি মিসিং ছিল) ---
export async function deleteOrder(orderId: string) {
  try {
    await db.order.delete({ where: { id: orderId } });
    revalidatePath("/admin/orders");
    return { success: true, message: "Order deleted" };
  } catch (error) {
    return { success: false, error: "Delete failed" };
  }
}