// File: app/actions/storefront/checkout/get-order-success.ts
"use server";

import { db } from "@/lib/prisma";

export async function getOrderSuccess(orderId: string) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        guestEmail: true,
        total: true,
        subtotal: true,
        shippingTotal: true,
        discountTotal: true,
        taxTotal: true,
        createdAt: true,
        paymentMethod: true,
        shippingAddress: true,
        billingAddress: true,
        shippingMethod: true,
        items: {
          include: {
            product: {
              select: { name: true, featuredImage: true, slug: true }
            }
          }
        },
        user: {
          select: { email: true, name: true }
        }
      }
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    return { success: true, order };

  } catch (error) {
    console.error("Success Page Error:", error);
    return { success: false, error: "Failed to load order details" };
  }
}