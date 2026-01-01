// File: app/actions/storefront/checkout/process-checkout.ts
"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateNextOrderNumber } from "./generate-order-number"; 
import { sendNotification } from "./send-notification"; 
import { OrderStatus, PaymentStatus } from "@prisma/client";

interface CheckoutPayload {
  cartId: string;
  userId?: string;
  guestInfo?: { email: string; name: string; phone: string };
  shippingAddress: any;
  billingAddress: any;
  paymentMethod: string;
  paymentId?: string; 
  shippingData: {
    method: string;
    cost: number;
    carrier?: string;
  };
  discountId?: string;
  totals: {
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
  };
}

export async function processCheckout(payload: CheckoutPayload) {
  console.log("\n🚀 [SERVER START] Process Checkout Initiated");
  
  try {
    // 1. Validate Cart
    const cart = await db.cart.findUnique({
      where: { id: payload.cartId },
      include: { 
        items: { 
          include: { 
            product: { include: { images: true } }, 
            variant: { include: { images: true } } 
          } 
        } 
      }
    });

    if (!cart || !cart.items.length) {
      console.error("❌ [ERROR] Cart not found or empty.");
      return { success: false, error: "Cart expired or empty." };
    }

    // 2. Calculate Order
    let calculatedSubtotal = 0;
    const orderItemsPayload = cart.items.map(item => {
        let imgUrl = item.product.featuredImage;
        if (item.variant && item.variant.image) imgUrl = item.variant.image;
        else if (item.product.images && item.product.images.length > 0) imgUrl = item.product.images[0].url;

        const price = item.variant 
            ? (item.variant.salePrice ?? item.variant.price) 
            : (item.product.salePrice ?? item.product.price);

        calculatedSubtotal += (price * item.quantity);

        return {
            productId: item.productId,
            variantId: item.variantId,
            productName: item.product.name,
            variantName: item.variant?.name,
            sku: item.variant?.sku || item.product.sku,
            image: imgUrl || "",
            price: price,
            quantity: item.quantity,
            total: price * item.quantity
        };
    });

    const finalTotal = calculatedSubtotal + Number(payload.shippingData.cost) - (payload.totals.discount || 0);
    const orderNumber = await generateNextOrderNumber();

    // 3. Payment Status
    const isOnline = payload.paymentMethod === "stripe" || payload.paymentMethod === "paypal";
    const isPaid = isOnline && !!payload.paymentId;
    const paymentStatus = isPaid ? PaymentStatus.PAID : PaymentStatus.UNPAID;
    
    // 4. DB Transaction
    console.log("⚙️ [DB] Creating Order in Database...");
    const newOrder = await db.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: payload.userId || null,
          guestEmail: payload.guestInfo?.email,
          status: OrderStatus.PENDING,
          paymentStatus: paymentStatus,
          paymentMethod: payload.paymentMethod,
          paymentId: payload.paymentId,
          subtotal: calculatedSubtotal,
          taxTotal: 0,
          shippingTotal: payload.shippingData.cost,
          discountTotal: payload.totals.discount || 0,
          total: finalTotal,
          netAmount: finalTotal,
          shippingAddress: payload.shippingAddress,
          billingAddress: payload.billingAddress,
          shippingMethod: payload.shippingData.carrier || "Standard",
          shippingType: payload.shippingData.method === "transdirect" ? "CARRIER_CALCULATED" : "FLAT_RATE",
          selectedCourierService: payload.shippingData.carrier,
          discountId: payload.discountId,
          items: { create: orderItemsPayload }
        }
      });

      await tx.cart.delete({ where: { id: payload.cartId } });

      for (const item of cart.items) {
        if (item.variantId) {
            await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { decrement: item.quantity } } });
        } else {
            await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
        }
      }
      return order;
    });

    console.log(`✅ [SUCCESS] Order Created: ${newOrder.orderNumber} (ID: ${newOrder.id})`);

    // ==========================================
    // 5. EMAIL NOTIFICATION DEBUG SECTION
    // ==========================================
    
    console.log("🔍 [EMAIL DEBUG] Checking Guest Info:", payload.guestInfo);

    if (payload.guestInfo?.email) {
        console.log(`📨 [EMAIL DEBUG] Email found: ${payload.guestInfo.email}. Preparing notification...`);

        const customerTrigger = isPaid ? "PAYMENT_PAID" : "ORDER_PENDING";
        console.log(`🎯 [EMAIL DEBUG] Selected Trigger: ${customerTrigger}`);

        const emailData = {
            order_number: newOrder.orderNumber,
            customer_name: payload.guestInfo?.name || "Customer",
            total: `$${finalTotal.toFixed(2)}`
        };

        // Customer Email (With Explicit Error Catching)
        try {
            console.log("🚀 [EMAIL DEBUG] Calling sendNotification()...");
            const res = await sendNotification({ 
                trigger: customerTrigger, 
                recipient: payload.guestInfo.email, 
                data: emailData,
                orderId: newOrder.id 
            });
            console.log("📬 [EMAIL DEBUG] Result:", res);
        } catch (e) {
            console.error("🔥 [EMAIL DEBUG] CRITICAL ERROR calling sendNotification:", e);
        }

        // Admin Email
        sendNotification({
            trigger: "ADMIN_ORDER_PENDING",
            recipient: "admin", 
            data: emailData,
            orderId: newOrder.id
        }).catch(err => console.error("⚠️ Admin Email Failed:", err));

    } else {
        console.error("❌ [EMAIL DEBUG] Guest Email is MISSING/UNDEFINED. Skipping email.");
    }

    revalidatePath("/");
    return { success: true, orderId: newOrder.id, orderNumber: newOrder.orderNumber };

  } catch (error: any) {
    console.error("🔥 [FATAL ERROR] Checkout Process:", error);
    return { success: false, error: error.message || "Order processing failed." };
  }
}