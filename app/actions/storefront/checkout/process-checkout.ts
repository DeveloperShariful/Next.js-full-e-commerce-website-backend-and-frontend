// File: app/actions/storefront/checkout/process-checkout.ts
"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateNextOrderNumber } from "./generate-order-number"; 
import { sendNotification } from "./send-notification"; 
import { getCheckoutSummary } from "./get-checkout-summary"; // 🔥 Secure Calculation
import { OrderStatus, PaymentStatus } from "@prisma/client";

interface CheckoutPayload {
  cartId: string;
  userId?: string;
  guestInfo?: { email: string; name: string; phone: string };
  shippingAddress: any;
  billingAddress: any;
  paymentMethod: string;
  paymentId?: string; // Stripe/PayPal Transaction ID
  
  // Shipping Data from UI (We verify ID, but ignore cost)
  shippingData: {
    method: string; // 'flat_rate' | 'transdirect'
    carrier: string; // 'Standard' or Service Name
    methodId: string; // 🔥 NEW: We need the ID to verify cost (e.g. 'rate_123')
    cost: number;
  };
  
  couponCode?: string; 
  totals: any;// 🔥 NEW: Pass code instead of ID/Amount to verify
}

export async function processCheckout(payload: CheckoutPayload) {
  console.log("\n🚀 [SERVER START] Process Checkout Initiated");
  
  try {
    // ১. কার্ট ভ্যালিডেশন
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
      return { success: false, error: "Cart expired or empty." };
    }

    // ২. সার্ভার সাইড রিক্যালকুলেশন (Hacking prevention 🔒)
    // আমরা ক্লায়েন্টের totals বিশ্বাস করছি না। নতুন করে হিসাব করছি।
    const summary = await getCheckoutSummary({
        cartId: payload.cartId,
        shippingAddress: payload.shippingAddress,
        shippingMethodId: payload.shippingData.methodId,
        couponCode: payload.couponCode
    });

    if (!summary.success || !summary.breakdown) {
        return { success: false, error: "Price calculation mismatch. Please try again." };
    }

    const { 
        subtotal, 
        tax: taxTotal, 
        shipping: shippingTotal, 
        discount: discountTotal, 
        total: finalTotal,
        discountId
    } = summary.breakdown;

    // ৩. অর্ডার আইটেম প্রস্তুত করা
    const orderItemsPayload = cart.items.map(item => {
        let imgUrl = item.product.featuredImage;
        if (item.variant && item.variant.image) imgUrl = item.variant.image;
        else if (item.product.images && item.product.images.length > 0) imgUrl = item.product.images[0].url;

        const price = item.variant 
            ? (item.variant.salePrice ?? item.variant.price) 
            : (item.product.salePrice ?? item.product.price);

        return {
            productId: item.productId,
            variantId: item.variantId,
            productName: item.product.name,
            variantName: item.variant?.name,
            sku: item.variant?.sku || item.product.sku,
            image: imgUrl || "",
            price: price,
            quantity: item.quantity,
            total: price * item.quantity,
            // Tax is calculated globally, storing per item is optional or requires complex logic
            // keeping it simple for now
        };
    });

    const orderNumber = await generateNextOrderNumber();

    // ৪. পেমেন্ট স্ট্যাটাস নির্ধারণ
    const isOnline = payload.paymentMethod === "stripe" || payload.paymentMethod === "paypal";
    // TODO: Ideally verify paymentId with Stripe/PayPal API here if needed immediately
    // For now, we trust that if paymentId exists for online methods, client handled it via SDK.
    // Webhooks will double-verify later.
    const paymentStatus = (isOnline && payload.paymentId) ? PaymentStatus.PAID : PaymentStatus.UNPAID;
    
    // ৫. ডাটাবেস ট্রানজেকশন
    console.log("⚙️ [DB] Creating Order in Database...");
    const newOrder = await db.$transaction(async (tx) => {
      
      // A. Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: payload.userId || null,
          guestEmail: payload.guestInfo?.email,
          status: OrderStatus.PENDING,
          paymentStatus: paymentStatus,
          paymentMethod: payload.paymentMethod,
          paymentId: payload.paymentId,
          
          // Secure values from Server Calculation
          subtotal,
          taxTotal,
          shippingTotal,
          discountTotal,
          total: finalTotal,
          netAmount: finalTotal, // Can be adjusted if fees are calculated
          
          shippingAddress: payload.shippingAddress,
          billingAddress: payload.billingAddress,
          
          shippingMethod: payload.shippingData.carrier || "Standard",
          shippingType: payload.shippingData.method === "transdirect" ? "CARRIER_CALCULATED" : "FLAT_RATE",
          selectedCourierService: payload.shippingData.carrier,
          
          discountId: discountId,
          couponCode: payload.couponCode, // Save code for reference
          
          items: { create: orderItemsPayload }
        }
      });

      // B. Delete Cart
      await tx.cart.delete({ where: { id: payload.cartId } });

      // C. Update Stock (Inventory)
      for (const item of cart.items) {
        if (item.variantId) {
            // Variant Stock
            await tx.inventoryLevel.updateMany({
                 where: { variantId: item.variantId },
                 data: { quantity: { decrement: item.quantity } }
            });
            await tx.productVariant.update({ 
                where: { id: item.variantId }, 
                data: { stock: { decrement: item.quantity } } 
            });
        } else {
            // Simple Product Stock
            await tx.inventoryLevel.updateMany({
                where: { productId: item.productId, variantId: null },
                data: { quantity: { decrement: item.quantity } }
           });
            await tx.product.update({ 
                where: { id: item.productId }, 
                data: { stock: { decrement: item.quantity } } 
            });
        }
        // Also update Sold Count for analytics
        await tx.product.update({
            where: { id: item.productId },
            data: { soldCount: { increment: item.quantity } }
        });
      }
      
      // D. Update Coupon Usage
      if (discountId) {
          await tx.discount.update({
              where: { id: discountId },
              data: { usedCount: { increment: 1 } }
          });
      }

      return order;
    });

    console.log(`✅ [SUCCESS] Order Created: ${newOrder.orderNumber}`);

    // ৬. ইমেইল নোটিফিকেশন (Async - Don't block response)
    if (payload.guestInfo?.email) {
        const customerTrigger = paymentStatus === "PAID" ? "PAYMENT_PAID" : "ORDER_PENDING";
        const emailData = {
            order_number: newOrder.orderNumber,
            customer_name: payload.guestInfo?.name || "Customer",
            total: `$${finalTotal.toFixed(2)}`
        };

        // Fire and forget email
        sendNotification({ 
            trigger: customerTrigger, 
            recipient: payload.guestInfo.email, 
            data: emailData, 
            orderId: newOrder.id 
        }).catch(err => console.error("📧 Email Error:", err));

        // Notify Admin
        sendNotification({
            trigger: "ADMIN_NEW_ORDER", // Ensure this template exists
            recipient: "admin", 
           // recipientType: "admin",
            data: emailData,
            orderId: newOrder.id
        }).catch(err => console.error("📧 Admin Email Error:", err));
    }

    revalidatePath("/");
    return { success: true, orderId: newOrder.id, orderNumber: newOrder.orderNumber };

  } catch (error: any) {
    console.error("🔥 [FATAL ERROR] Checkout Process:", error);
    return { success: false, error: error.message || "Order processing failed." };
  }
}