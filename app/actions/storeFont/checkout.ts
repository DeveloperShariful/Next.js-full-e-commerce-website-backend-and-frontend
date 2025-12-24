// app/actions/checkout.ts

"use server";

import { db } from "@/lib/db";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// --- TYPES ---
type CartItem = {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

type CheckoutData = {
  items: CartItem[];
  total: number;
  shippingAddress: any;
  paymentMethod: string;
};

// ==========================================
// PROCESS CHECKOUT (CREATE ORDER)
// ==========================================

export async function processCheckout(data: CheckoutData) {
  try {
    // 1. Authenticate User (Clerk)
    const { userId } = await auth();
    const clerkUser = await currentUser();

    if (!userId || !clerkUser) {
      return { success: false, message: "Please login to place an order" };
    }

    // 2. Find Database User (Sync check)
    // We use email to ensure we link to the correct DB record
    const dbUser = await db.user.findUnique({
      where: { email: clerkUser.emailAddresses[0].emailAddress }
    });

    if (!dbUser) {
      return { success: false, message: "User account not synced. Please contact support." };
    }

    // 3. Generate Order Number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 4. Database Transaction
    const newOrder = await db.$transaction(async (tx) => {
      
      // A. Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: dbUser.id,
          total: data.total,
          subtotal: data.total, // Assuming no tax/shipping calc for simple example
          status: "PENDING",
          paymentStatus: "UNPAID",
          paymentMethod: data.paymentMethod,
          shippingAddress: data.shippingAddress,
          billingAddress: data.shippingAddress, 
          guestEmail: dbUser.email,
        }
      });

      // B. Create Order Items
      for (const item of data.items) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            variantId: item.variantId,
            productName: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity,
          }
        });

        // C. Update Stock (Optional - if tracking stock)
        if (item.variantId) {
           await tx.productVariant.update({
             where: { id: item.variantId },
             data: { stock: { decrement: item.quantity } }
           });
        }
      }

      return order;
    });

    revalidatePath("/orders");
    revalidatePath("/admin/orders");
    
    return { success: true, message: "Order placed successfully", orderId: newOrder.id };

  } catch (error) {
    console.error("CHECKOUT_ERROR", error);
    return { success: false, message: "Failed to process order" };
  }
}