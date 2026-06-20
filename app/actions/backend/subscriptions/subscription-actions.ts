"use server";

import { db } from "@/lib/prisma";
import { auth } from "@/auth";
import { Role, SubscriptionStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");
  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user || user.role === Role.CUSTOMER || user.role === Role.SUBSCRIBER) throw new Error("Unauthorized");
  return user;
}

export async function getSubscriptionList(page = 1, search = "", status = "") {
  await requireAdmin();
  const ITEMS_PER_PAGE = 20;
  const skip = (page - 1) * ITEMS_PER_PAGE;

  const where: Prisma.SubscriptionWhereInput = {};

  if (status && status in SubscriptionStatus) {
    where.status = status as SubscriptionStatus;
  }

  if (search) {
    where.user = {
      OR: [
        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ],
    };
  }

  const [subscriptions, total, statusCounts] = await Promise.all([
    db.subscription.findMany({
      where,
      skip,
      take: ITEMS_PER_PAGE,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        plan: { select: { name: true, price: true, currency: true, interval: true, intervalCount: true } },
        _count: { select: { invoices: true, orders: true } },
      },
    }),
    db.subscription.count({ where }),
    db.subscription.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  return {
    subscriptions,
    total,
    totalPages: Math.ceil(total / ITEMS_PER_PAGE),
    statusCounts,
  };
}

export async function updateSubscriptionStatus(
  subscriptionId: string,
  newStatus: SubscriptionStatus
) {
  await requireAdmin();

  if (!subscriptionId) return { success: false, message: "Invalid subscription." };
  if (!(newStatus in SubscriptionStatus)) {
    return { success: false, message: "Invalid status." };
  }

  try {
    const subscription = await db.subscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!subscription) return { success: false, message: "Subscription not found." };

    await db.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: newStatus,
        ...(newStatus === SubscriptionStatus.CANCELLED && !subscription.cancelledAt
          ? { cancelledAt: new Date() }
          : {}),
      },
    });

    revalidatePath("/admin/subscriptions");
    return { success: true, message: `Status updated to ${newStatus}.` };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update status.";
    return { success: false, message };
  }
}
