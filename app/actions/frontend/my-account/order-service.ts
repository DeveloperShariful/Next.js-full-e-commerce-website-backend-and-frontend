// File: app/actions/frontend/my-account/order-service.ts

"use server";

import { db } from "@/lib/prisma";
import { syncUser } from "@/lib/auth-sync";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ReturnStatus } from "@prisma/client";

// Zod Schema for Return/Refund Request
const returnRequestSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().min(5, "Please write a detailed reason (minimum 5 characters)."),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
    productName: z.string()
  })).min(1, "Please select at least one item to return."),
  images: z.array(z.string().url()).optional().default([])
});

type ReturnInput = z.infer<typeof returnRequestSchema>;

async function getAuthCustomer() {
  const user = await syncUser();
  if (!user) throw new Error("Unauthorized: Customer session not found.");
  return user;
}

// =========================================
// READ OPERATIONS (ORDER FETCHING & AUTO-SYNC)
// =========================================

export async function getCustomerOrders() {
  try {
    const customer = await getAuthCustomer();

    // 🌟 THE MASTERSTROKE: Auto-link past Guest Orders matching this customer's email!
    await db.order.updateMany({
      where: {
        guestEmail: customer.email.toLowerCase().trim(),
        userId: null // Only update if it wasn't linked already
      },
      data: {
        userId: customer.id
      }
    });

    // Fetch all linked orders
    const orders = await db.order.findMany({
      where: {
        userId: customer.id,
        deletedAt: null
      },
      orderBy: { orderDate: "desc" },
      include: {
        items: true,
        returns: true
      }
    });

    return orders;
  } catch (error) {
    console.error("Fetch Customer Orders Error:", error);
    return [];
  }
}

// =========================================
// WRITE OPERATIONS (RETURN/REFUND MUTATION)
// =========================================

export async function createReturnRequestAction(data: ReturnInput) {
  try {
    const customer = await getAuthCustomer();

    const result = returnRequestSchema.safeParse(data);
    if (!result.success) {
      return { success: false, message: result.error.issues[0].message };
    }

    const { orderId, reason, items, images } = result.data;

    // Verify order ownership
    const order = await db.order.findUnique({
      where: { id: orderId }
    });

    if (!order || order.userId !== customer.id) {
      return { success: false, message: "Unauthorized: Order not found." };
    }

    // Check if a return request already exists
    const existingRequest = await db.returnRequest.findFirst({
      where: { orderId, status: { in: ["REQUESTED", "APPROVED"] } }
    });

    if (existingRequest) {
      return { success: false, message: "A return request is already active for this order." };
    }

    // Create the Return Request
    await db.returnRequest.create({
      data: {
        orderId,
        status: ReturnStatus.REQUESTED,
        reason: reason.trim(),
        items: items as any, // Strictly typed array converted to Json
        images: images,
      }
    });

    revalidatePath("/my-account");
    return { success: true, message: "Return request submitted successfully. We will review it." };

  } catch (error: any) {
    console.error("Return Request Error:", error);
    return { success: false, message: error.message || "Failed to submit return request." };
  }
}