//app/actions/storefront/checkout/create-order.ts

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
      const price = Number(item.variant ? (item.variant.salePrice || item.variant.price) : (item.product.salePrice || item.product.price));
      
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

    // 6. Surcharge
    let surcharge = 0;
    let paymentGatewayName = "OFFLINE";

    if (data.paymentMethod === 'stripe_card' || data.paymentMethod.startsWith('stripe_')) {
        paymentGatewayName = "STRIPE";
        const stripeConf = await db.stripeConfig.findFirst({ include: { paymentMethod: true } });
        if (stripeConf?.paymentMethod.surchargeEnabled) {
             surcharge = stripeConf.paymentMethod.surchargeType === 'percentage'
                ? ((subtotal + shippingCost - discountAmount) * Number(stripeConf.paymentMethod.surchargeAmount)) / 100
                : Number(stripeConf.paymentMethod.surchargeAmount);
        }
    } 
    else if (data.paymentMethod === 'paypal') {
        paymentGatewayName = "PAYPAL";
        const paypalConf = await db.paypalConfig.findFirst({ include: { paymentMethod: true } });
        if (paypalConf?.paymentMethod.surchargeEnabled) {
             surcharge = paypalConf.paymentMethod.surchargeType === 'percentage'
                ? ((subtotal + shippingCost - discountAmount) * Number(paypalConf.paymentMethod.surchargeAmount)) / 100
                : Number(paypalConf.paymentMethod.surchargeAmount);
        }
    }
    else {
        const offlineConf = await db.paymentMethodConfig.findFirst({ where: { identifier: data.paymentMethod } });
        if (offlineConf?.surchargeEnabled) {
             surcharge = offlineConf.surchargeType === 'percentage'
                ? ((subtotal + shippingCost - discountAmount) * Number(offlineConf.surchargeAmount)) / 100
                : Number(offlineConf.surchargeAmount);
        }
    }

    const grandTotal = Math.max(0, subtotal + shippingCost + surcharge - discountAmount);

    // 7. Transaction
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
      
      if (data.couponCode && discountAmount > 0) {
          await tx.discount.update({
              where: { code: data.couponCode },
              data: { usedCount: { increment: 1 } }
          });
      }

      return order;
    });

    // 8. Notifications
    if (!data.retainCart) { 
        await sendNotification({
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

    if (!data.retainCart) { 
        await clearCart(); 
    }
    // 10. Affiliate Trigger
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    fetch(`${appUrl}/api/affiliate/process-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.INTERNAL_API_KEY!
      },
      body: JSON.stringify({ orderId: newOrder.id })
    }).catch(err => console.error("Affiliate Trigger Failed:", err));

    return { 
      success: true, 
      orderId: newOrder.id, 
      orderNumber: newOrder.orderNumber,
      orderKey: "key_" + newOrder.id, 
      grandTotal: grandTotal 
    };

  } catch (error: any) {
    console.error("Create Order Error:", error);
    return { success: false, error: error.message || "Failed to create order" };
  }
}