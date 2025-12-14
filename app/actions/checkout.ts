// app/actions/checkout.ts

"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function placeOrder(orderData: any, cartItems: any[]) {
  try {
    const session = await auth();
    const userId = session?.user?.id; // লগইন থাকলে আইডি পাবে, না থাকলে undefined

    // 1. Generate Order Number (Random 6 digits)
    const orderNumber = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Create Order
    const order = await db.order.create({
      data: {
        orderNumber,
        userId: userId || null, // Guest or User
        guestEmail: !userId ? orderData.email : null, // Save email if guest
        
        // Address Snapshots
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.shippingAddress, // Assuming same for now

        // Financials
        subtotal: orderData.subtotal,
        shippingTotal: orderData.shippingCost,
        discountTotal: orderData.discount,
        total: orderData.total,
        
        paymentMethod: "COD", // আপাতত শুধু ক্যাশ অন ডেলিভারি
        paymentStatus: "UNPAID",
        status: "PENDING",

        // Order Items
        items: {
          create: cartItems.map((item: any) => ({
            productId: item.id,
            productName: item.name,
            variantId: item.selectedVariantId || null,
            variantName: item.selectedVariantName || null,
            sku: item.sku,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity
          }))
        }
      }
    });

    // 3. Optional: Decrease Stock (Advanced Step)
    // লুপ চালিয়ে স্টক কমানো যেতে পারে, আপাতত স্কিপ করছি কমপ্লেক্সিটি কমানোর জন্য

    return { success: true, orderId: order.id, orderNumber };

  } catch (error) {
    console.error("ORDER_PLACE_ERROR", error);
    return { success: false, error: "Failed to place order" };
  }
}