// File: app/actions/frontend/my-account/warranty-service.ts

"use server";

import { db } from "@/lib/prisma";
import { syncUser } from "@/lib/auth-sync";
import { ClaimStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const warrantySchema = z.object({
  orderNumber: z.string().min(3, "Valid order number is required."),
  productName: z.string().min(2, "Product name is required."),
  description: z.string().min(10, "Please describe the issue in detail (minimum 10 characters)."),
  mediaUrl: z.string().url("Please upload an image or video showing the defect.").optional().or(z.literal("")),
  shopPurchased: z.string().default("GoBike Australia"),
});

type WarrantyInput = z.infer<typeof warrantySchema>;

async function getAuthCustomer() {
  const user = await syncUser();
  if (!user) throw new Error("Unauthorized: Customer session not found.");
  return user;
}

// =========================================
// WRITE OPERATIONS (MUTATIONS)
// =========================================

export async function createWarrantyClaimAction(data: WarrantyInput) {
  try {
    const customer = await getAuthCustomer();

    const result = warrantySchema.safeParse(data);
    if (!result.success) {
      return { success: false, message: result.error.issues[0].message };
    }

    const payload = result.data;

    // Verify order exists in DB to prevent fake claims
    const order = await db.order.findFirst({
      where: {
        orderNumber: payload.orderNumber.trim(),
        userId: customer.id
      }
    });

    if (!order) {
      return { 
        success: false, 
        message: "We couldn't find an order with this number associated with your account." 
      };
    }

    // ✅ FIXED: Concatenated productName and description into the 'description' field to match your Schema exactly!
    const formattedDescription = `Product: ${payload.productName.trim()} | Issue: ${payload.description.trim()}`;

    await db.warrantyClaim.create({
      data: {
        name: customer.name || "Customer",
        email: customer.email,
        orderNumber: payload.orderNumber.trim(),
        orderDate: order.orderDate,
        description: formattedDescription, // Saved beautifully here!
        mediaUrl: payload.mediaUrl || null,
        shopPurchased: payload.shopPurchased,
        status: ClaimStatus.PENDING,
        wpEmail: customer.email,
        wpName: customer.name
      }
    });

    revalidatePath("/my-account");
    return { success: true, message: "Warranty claim submitted successfully. Our engineers will review it." };

  } catch (error: unknown) {
    console.error("Warranty Claim Error:", error);
    const msg = error instanceof Error ? error.message : "Failed to submit warranty claim.";
    return { success: false, message: msg };
  }
}