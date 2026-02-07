//app/actions/storefront/checkout/create-order.ts
// app/actions/storefront/checkout/create-order.ts

"use server";

import { db } from "@/lib/prisma";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { clearCart } from "../cart/clear-cart";
import { calculateShippingServerSide } from "./get-shipping-rates";
import { sendNotification } from "@/app/api/email/send-notification";
import { cookies } from "next/headers";
import { validateCoupon } from "./validate-coupon";

interface OrderInput {
  cartId: string;
  billing: any;
  shipping: any;
  shippingMethodId: string;
  paymentMethod: string;
  paymentIntentId?: string;
  customerNote?: string;
  couponCode?: string | null;
  retainCart?: boolean; // ✅ NEW OPTION: To prevent clearing cart prematurely
}

interface OrderItemData {
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string | undefined;
  price: number;
  quantity: number;
  total: number;
  image: string | null;
}

export async function createOrder(data: OrderInput) {
  try {
    // 1. Fetch Cart
    const cart = await db.cart.findUnique({
      where: { id: data.cartId },
      include: { items: { include: { product: true, variant: true } } }
    });

    if (!cart || cart.items.length === 0) {
      return { success: false, error: "Cart is empty" };
    }

    // 2. Affiliate Tracking
    const cookieStore = await cookies();
    const affiliateSlug = cookieStore.get("affiliate_token")?.value;
    let affiliateId: string | null = null;

    if (affiliateSlug) {
      const affiliate = await db.affiliateAccount.findUnique({
        where: { slug: affiliateSlug, status: "ACTIVE" },
        select: { id: true }
      });
      if (affiliate) {
        affiliateId = affiliate.id;
      }
    }

    // 3. Calculate Totals & Validate Stock
    let subtotal = 0;
    const orderItemsData: OrderItemData[] = [];

    for (const item of cart.items) {
      // Use salePrice if available, otherwise price
      const price = Number(
        item.variant 
          ? (item.variant.salePrice ?? item.variant.price) 
          : (item.product.salePrice ?? item.product.price)
      );
      
      const currentStock = item.variant ? item.variant.stock : item.product.stock;
      const trackQuantity = item.variant ? item.variant.trackQuantity : item.product.trackQuantity;
      
      if (trackQuantity && currentStock < item.quantity) {
        return { success: false, error: `Product "${item.product.name}" is out of stock.` };
      }

      subtotal += price * item.quantity;

      orderItemsData.push({
        productId: item.productId,
        variantId: item.variantId,
        productName: item.product.name,
        variantName: item.variant?.name,
        price: price,
        quantity: item.quantity,
        total: price * item.quantity,
        image: item.variant?.image || item.product.featuredImage
      });
    }

    // 4. Shipping
    let shippingCost = 0;
    if (data.shippingMethodId) {
      const validCost = await calculateShippingServerSide(
        data.cartId, 
        data.shipping, 
        data.shippingMethodId
      );
      if (validCost === null) return { success: false, error: "Invalid shipping method." };
      shippingCost = validCost;
    }

    // 5. Discount
    let discountAmount = 0;
    let discountId = null;
    if (data.couponCode) {
        const couponRes = await validateCoupon(data.couponCode, data.cartId);
        if (couponRes.success && couponRes.discountAmount) {
            discountAmount = couponRes.discountAmount;
            const discount = await db.discount.findUnique({ where: { code: data.couponCode } });
            if (discount) discountId = discount.id;
        }
    }

    // 6. Surcharge Calculation
    let surcharge = 0;
    let paymentGatewayName = "OFFLINE";

    // Helper to calculate percentage or fixed amount
    const calculateSurchargeValue = (amount: number, type: string, baseAmount: number) => {
        return type === 'percentage' 
            ? (baseAmount * amount) / 100 
            : amount;
    };

    // Calculate base amount for surcharge (usually Subtotal + Shipping - Discount)
    const surchargeBase = Math.max(0, subtotal + shippingCost - discountAmount);

    if (data.paymentMethod === 'stripe_card' || data.paymentMethod.startsWith('stripe_')) {
        paymentGatewayName = "STRIPE";
        const stripeConf = await db.stripeConfig.findFirst({ include: { paymentMethod: true } });
        
        if (stripeConf?.paymentMethod?.surchargeEnabled) {
             surcharge = calculateSurchargeValue(
                 Number(stripeConf.paymentMethod.surchargeAmount),
                 stripeConf.paymentMethod.surchargeType,
                 surchargeBase
             );
        }
    } 
    else if (data.paymentMethod === 'paypal') {
        paymentGatewayName = "PAYPAL";
        const paypalConf = await db.paypalConfig.findFirst({ include: { paymentMethod: true } });
        
        if (paypalConf?.paymentMethod?.surchargeEnabled) {
             surcharge = calculateSurchargeValue(
                 Number(paypalConf.paymentMethod.surchargeAmount),
                 paypalConf.paymentMethod.surchargeType,
                 surchargeBase
             );
        }
    }
    else {
        // Offline / Manual Methods
        const offlineConf = await db.paymentMethodConfig.findFirst({ where: { identifier: data.paymentMethod } });
        if (offlineConf?.surchargeEnabled) {
             surcharge = calculateSurchargeValue(
                 Number(offlineConf.surchargeAmount),
                 offlineConf.surchargeType,
                 surchargeBase
             );
        }
    }

    // Ensure grand total is never negative
    const grandTotal = Math.max(0, subtotal + shippingCost + surcharge - discountAmount);

    // 7. Transaction (Create Order & Update Stock)
    const newOrder = await db.$transaction(async (tx) => {
      const count = await tx.order.count();
      const orderNumber = `ORD-${1000 + count + 1}`;
      
      const order = await tx.order.create({
        data: {
          orderNumber,
          status: OrderStatus.PENDING, 
          paymentStatus: PaymentStatus.UNPAID,
          paymentGateway: paymentGatewayName,
          paymentMethod: data.paymentMethod,
          paymentId: data.paymentIntentId || null,
          
          subtotal: subtotal, 
          shippingTotal: shippingCost,
          discountTotal: discountAmount,
          surcharge: surcharge,
          total: grandTotal,
          
          couponCode: data.couponCode || null, 
          discountId: discountId,
          
          guestEmail: data.billing.email,
          shippingAddress: data.shipping,
          billingAddress: data.billing,
          shippingMethod: data.shippingMethodId,
          customerNote: data.customerNote,
          
          affiliateId: affiliateId,

          items: {
            create: orderItemsData
          }
        }
      });
      
      // Deduct Stock
      for (const item of cart.items) {
           if (item.variantId && item.variant?.trackQuantity) {
             await tx.productVariant.update({ 
               where: { id: item.variantId }, 
               data: { stock: { decrement: item.quantity } } 
             });
           } else if (item.product.trackQuantity) {
             await tx.product.update({ 
               where: { id: item.productId }, 
               data: { stock: { decrement: item.quantity } } 
             });
           }
      }
      
      // Increment Coupon Usage
      if (data.couponCode && discountAmount > 0) {
          await tx.discount.update({
              where: { code: data.couponCode },
              data: { usedCount: { increment: 1 } }
          });
      }

      return order;
    });

    // 8. Notifications (Async - don't block if fails)
    if (!data.retainCart) { 
        sendNotification({
            trigger: "ORDER_PENDING",
            recipient: data.billing.email,
            orderId: newOrder.id,
            data: {
                order_number: newOrder.orderNumber,
                customer_name: `${data.billing.firstName} ${data.billing.lastName}`,
                total_amount: grandTotal.toFixed(2),
            }
        }).catch(err => console.error("Email Error:", err));
    }

    // 9. Clear Cart
    if (!data.retainCart) { 
        await clearCart(); 
    }

    // 10. Affiliate Trigger (Safe Fetch)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const apiKey = process.env.INTERNAL_API_KEY;
    
    if (affiliateId && apiKey) {
        fetch(`${appUrl}/api/affiliate/process-order`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey
            },
            body: JSON.stringify({ orderId: newOrder.id })
        }).catch(err => console.error("Affiliate Trigger Failed:", err));
    }

    // ✅ SUCCESS RETURN
    return { 
      success: true, 
      id: newOrder.id, // Important: match this key with frontend expectation
      orderId: newOrder.id, 
      orderNumber: newOrder.orderNumber,
      orderKey: "key_" + newOrder.id, 
      grandTotal: grandTotal 
    };

  } catch (error: any) {
    console.error("Create Order Error:", error);
    // Return a clean error message
    return { success: false, error: error.message || "Failed to create order" };
  }
}