// File: app/actions/backend/header-sideber/get-notifications.ts

"use server";

import { db } from "@/lib/prisma";
import { OrderStatus, ReviewStatus } from "@prisma/client";
import { auth } from "@/auth";

export type NotificationType = "ORDER" | "STOCK" | "REVIEW" | "SUPPORT" | "WARRANTY" | "USER";

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string; // ISO string for client-side relative formatting
  type: NotificationType;
  link: string;
}

export async function getSystemNotifications(): Promise<SystemNotification[]> {
  const session = await auth();
  if (!session?.user?.email) return [];

  const notifications: SystemNotification[] = [];

  const [newOrders, lowStock, pendingReviews, openTickets, pendingWarranty, newUsers] =
    await Promise.all([
      // 1. Pending orders
      db.order.findMany({
        where: { status: OrderStatus.PENDING },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, orderNumber: true, createdAt: true, user: { select: { name: true } } },
      }),

      // 2. Low stock (qty ≤ 5)
      db.inventoryLevel.findMany({
        where: { quantity: { lte: 5 } },
        orderBy: { quantity: "asc" },
        take: 5,
        select: { id: true, quantity: true, product: { select: { id: true, name: true } } },
      }),

      // 3. Pending reviews
      db.review.findMany({
        where: { status: ReviewStatus.PENDING },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, createdAt: true, user: { select: { name: true } } },
      }),

      // 4. Open support tickets
      db.supportTicket.findMany({
        where: { status: "OPEN" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, subject: true, createdAt: true, user: { select: { name: true } } },
      }),

      // 5. Pending warranty claims
      db.warrantyClaim.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, createdAt: true },
      }),

      // 6. New users (last 24 hours)
      db.user.findMany({
        where: {
          role: "CUSTOMER",
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, email: true, createdAt: true },
      }),
    ]);

  newOrders.forEach((o) => {
    notifications.push({
      id: `order-${o.id}`,
      title: "New Pending Order",
      message: `Order #${o.orderNumber} from ${o.user?.name || "Guest"}`,
      createdAt: o.createdAt.toISOString(),
      type: "ORDER",
      link: `/admin/orders/${o.id}`,
    });
  });

  lowStock.forEach((item) => {
    notifications.push({
      id: `stock-${item.id}`,
      title: "Low Stock Alert",
      message: `${item.product.name} — only ${item.quantity} left`,
      createdAt: new Date().toISOString(),
      type: "STOCK",
      link: `/admin/inventory`,
    });
  });

  pendingReviews.forEach((r) => {
    notifications.push({
      id: `review-${r.id}`,
      title: "Review Awaiting Approval",
      message: `${r.user?.name || "Someone"} left a review: "${r.title || "No title"}"`,
      createdAt: r.createdAt.toISOString(),
      type: "REVIEW",
      link: `/admin/reviews/${r.id}`,
    });
  });

  openTickets.forEach((t) => {
    notifications.push({
      id: `ticket-${t.id}`,
      title: "Open Support Ticket",
      message: `${t.user?.name || "Customer"}: ${t.subject}`,
      createdAt: t.createdAt.toISOString(),
      type: "SUPPORT",
      link: `/admin/support/${t.id}`,
    });
  });

  pendingWarranty.forEach((w) => {
    notifications.push({
      id: `warranty-${w.id}`,
      title: "Warranty Claim Pending",
      message: `Claim from ${w.name}`,
      createdAt: w.createdAt.toISOString(),
      type: "WARRANTY",
      link: `/admin/warranty-claims`,
    });
  });

  newUsers.forEach((u) => {
    notifications.push({
      id: `user-${u.id}`,
      title: "New Customer Registered",
      message: `${u.name || u.email} just signed up`,
      createdAt: u.createdAt.toISOString(),
      type: "USER",
      link: `/admin/users`,
    });
  });

  // Sort newest first
  return notifications.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
