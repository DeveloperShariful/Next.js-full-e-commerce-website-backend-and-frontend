// File: app/actions/frontend/my-account/subscription-service.ts

"use server";

import { db } from "@/lib/prisma";
import { syncUser } from "@/lib/auth-sync";
import { SubscriptionStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const cancelSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid(),
  reason: z.string().optional().or(z.literal("")),
});

async function getAuthCustomer() {
  const user = await syncUser();
  if (!user) throw new Error("Unauthorized: Customer session not found.");
  return user;
}

// =========================================
// WRITE OPERATIONS (MUTATIONS)
// =========================================

export async function pauseSubscriptionAction(subscriptionId: string) {
  try {
    const customer = await getAuthCustomer();

    const subscription = await db.subscription.findUnique({
      where: { id: subscriptionId }
    });

    if (!subscription || subscription.userId !== customer.id) {
      return { success: false, message: "Subscription not found." };
    }

    if (subscription.status !== "ACTIVE") {
      return { success: false, message: "Only active subscriptions can be paused." };
    }

    await db.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.PAUSED
      }
    });

    revalidatePath("/my-account");
    return { success: true, message: "Subscription paused successfully." };

  } catch (error: any) {
    return { success: false, message: error.message || "Failed to pause subscription." };
  }
}

export async function cancelSubscriptionAction(data: z.infer<typeof cancelSubscriptionSchema>) {
  try {
    const customer = await getAuthCustomer();

    const result = cancelSubscriptionSchema.safeParse(data);
    if (!result.success) return { success: false, message: "Invalid parameters." };

    const { subscriptionId, reason } = result.data;

    const subscription = await db.subscription.findUnique({
      where: { id: subscriptionId }
    });

    if (!subscription || subscription.userId !== customer.id) {
      return { success: false, message: "Subscription not found." };
    }

    if (subscription.status === "CANCELLED") {
      return { success: false, message: "Subscription is already cancelled." };
    }

    await db.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
        metadata: {
          cancelReason: reason || "User cancelled manually"
        }
      }
    });

    revalidatePath("/my-account");
    return { success: true, message: "Subscription cancelled successfully." };

  } catch (error: any) {
    return { success: false, message: error.message || "Failed to cancel subscription." };
  }
}