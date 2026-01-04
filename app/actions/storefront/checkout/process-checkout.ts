// File: app/actions/storefront/checkout/process-checkout.ts
"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateNextOrderNumber } from "./generate-order-number"; 
import { sendNotification } from "@/app/api/email/send-notification"; 
import { OrderStatus, PaymentStatus } from "@prisma/client";

interface CheckoutPayload {
  cartId: string;
  userId?: string; // ✅ This is crucial
  guestInfo?: { email: string; name: string; phone: string };
  shippingAddress: any;
  billingAddress: any;
  paymentMethod: string;
  paymentId?: string; 
  shippingData: {
    method: string;
    cost: number;
    carrier?: string;
    methodId?: string;
  };
  discountId?: string;
  couponCode?: string;
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
      return { success: false, error: "Cart expired or empty." };
    }

    // 2. Fetch User Email (If Logged In)
    // ✅ FIX: Guest ইমেইল না থাকলে User ID দিয়ে ইমেইল বের করা
    let customerEmail = payload.guestInfo?.email;
    let customerName = payload.guestInfo?.name || "Customer";

    if (!customerEmail && payload.userId) {
        const user = await db.user.findUnique({
            where: { id: payload.userId },
            select: { email: true, name: true }
        });
        if (user) {
            customerEmail = user.email;
            customerName = user.name || "Customer";
        }
    }

    let finalDiscountId = payload.discountId;
    if (!finalDiscountId && payload.couponCode) {
        const discount = await db.discount.findUnique({
            where: { code: payload.couponCode.toUpperCase() }
        });
        if (discount) {
            finalDiscountId = discount.id;
        }
    }

    // 3. Calculate Subtotal & Prepare Items
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

    const finalTotal = calculatedSubtotal + Number(payload.shippingData.cost) + Number(payload.totals.tax) - (payload.totals.discount || 0);
    const orderNumber = await generateNextOrderNumber();

    // 4. Payment Status Logic
    const isOnline = payload.paymentMethod === "stripe" || payload.paymentMethod === "paypal";
    const isPaid = isOnline && !!payload.paymentId;
    const paymentStatus = isPaid ? PaymentStatus.PAID : PaymentStatus.UNPAID;
    
    // 5. DB Transaction
    const newOrder = await db.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: payload.userId || null,
          // ✅ FIX: Save resolved email if guest email is missing
          guestEmail: payload.guestInfo?.email || (!payload.userId ? customerEmail : null),
          
          status: OrderStatus.PENDING,
          paymentStatus: paymentStatus,
          paymentMethod: payload.paymentMethod,
          paymentId: payload.paymentId,
          
          subtotal: calculatedSubtotal,
          taxTotal: payload.totals.tax,
          shippingTotal: payload.shippingData.cost,
          discountTotal: payload.totals.discount || 0,
          total: finalTotal,
          netAmount: finalTotal,
          
          shippingAddress: payload.shippingAddress,
          billingAddress: payload.billingAddress,
          
          shippingMethod: payload.shippingData.carrier || "Standard",
          shippingType: (payload.shippingData.method === "transdirect" || payload.shippingData.methodId?.startsWith("transdirect")) 
            ? "CARRIER_CALCULATED" 
            : "FLAT_RATE",
            
          selectedCourierService: payload.shippingData.carrier,
          
          discountId: payload.discountId, // We assume ID is resolved or passed correctly now, or handle like previous fix
          couponCode: payload.couponCode,
          
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

    // ==========================================
    // 6. NOTIFICATIONS (Updated Logic)
    // ==========================================
    
    const [storeSettings, emailConfig] = await Promise.all([
        db.storeSettings.findUnique({ where: { id: "settings" }, select: { storeEmail: true } }),
        db.emailConfiguration.findUnique({ where: { id: "email_config" }, select: { senderEmail: true } })
    ]);

    const adminEmail = storeSettings?.storeEmail || emailConfig?.senderEmail;

    const emailData = {
        order_number: newOrder.orderNumber,
        customer_name: customerName, // ✅ Using resolved name
        total: `$${finalTotal.toFixed(2)}`
    };

    // A. Notify Customer (✅ Now works for Logged In users too)
    if (customerEmail) {
        const customerTrigger = isPaid ? "PAYMENT_PAID" : "ORDER_PENDING";
        await sendNotification({ 
            trigger: customerTrigger, 
            recipient: customerEmail, 
            data: emailData,
            orderId: newOrder.id 
        });
        console.log(`✅ Customer email queued for: ${customerEmail}`);
    } else {
        console.error("❌ Customer email not found, skipping notification.");
    }

    // B. Notify Admin
    if (adminEmail) {
        await sendNotification({
            trigger: "ADMIN_ORDER_PENDING",
            recipient: adminEmail,
            data: emailData,
            orderId: newOrder.id
        });
    }

    revalidatePath("/");
    return { success: true, orderId: newOrder.id, orderNumber: newOrder.orderNumber };

  } catch (error: any) {
    console.error("🔥 Checkout Process Error:", error);
    return { success: false, error: error.message || "Order processing failed." };
  }
}