// File: app/actions/admin/notifications/get-notifications.ts

"use server";

import { db } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "ORDER" | "STOCK" | "USER";
  isRead: boolean; // For now default false, needs DB model to track read state per user
}

export async function getSystemNotifications(): Promise<SystemNotification[]> {
  const notifications: SystemNotification[] = [];

  // 1. Fetch Recent Pending Orders (Last 5)
  const newOrders = await db.order.findMany({
    where: { status: OrderStatus.PENDING },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, orderNumber: true, createdAt: true, user: { select: { name: true } } }
  });

  newOrders.forEach(order => {
    notifications.push({
      id: `order-${order.id}`,
      title: "New Order Received",
      message: `Order #${order.orderNumber} by ${order.user?.name || 'Guest'}`,
      time: new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: "ORDER",
      isRead: false
    });
  });

  // 2. Fetch Low Stock Items (Threshold <= 5)
  const lowStockItems = await db.inventoryLevel.findMany({
    where: { quantity: { lte: 5 } },
    take: 5,
    include: { product: { select: { name: true } } }
  });

  lowStockItems.forEach(item => {
    notifications.push({
      id: `stock-${item.id}`,
      title: "Stock Alert",
      message: `${item.product.name} is running low (${item.quantity} left).`,
      time: "Now",
      type: "STOCK",
      isRead: false
    });
  });

  return notifications;
}