//app/actions/storefront/checkout/create-order.ts
"use server";

import { db } from "@/lib/prisma";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { clearCart } from "../cart/clear-cart";
import { sendNotification } from "@/app/api/email/send-notification";
import { cookies } from "next/headers";
import { calculateCartTotals } from "./checkout-utils";
import { z } from "zod";

const CreateOrderSchema = z.object({
  cartId: z.string().uuid(),
  billing: z.any(),
  shipping: z.any(),
  shippingMethodId: z.string(),
  paymentMethod: z.string(),
  paymentIntentId: z.string().optional(),
  customerNote: z.string().optional(),
  couponCode: z.string().optional().nullable(),
  retainCart: z.boolean().optional(),
});

export async function createOrder(input: z.infer<typeof CreateOrderSchema>) {
  try {
    const data = CreateOrderSchema.parse(input);
    const calculation = await calculateCartTotals(
      data.cartId,
      data.shippingMethodId,
      data.shipping,
      data.couponCode || undefined,
      data.paymentMethod
    );

    const { cart } = calculation;
    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty or invalid.");
    }
    const cookieStore = await cookies();
    const affiliateSlug = cookieStore.get("affiliate_token")?.value;
    let affiliateId: string | null = null;

    if (affiliateSlug) {
      const affiliate = await db.affiliateAccount.findUnique({
        where: { slug: affiliateSlug, status: "ACTIVE" },
        select: { id: true }
      });
      affiliateId = affiliate?.id || null;
    }
    const newOrder = await db.$transaction(async (tx) => {
      for (const item of cart.items) {
        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId }
          });

          if (!variant) throw new Error(`Product variant not found: ${item.product.name}`);
          
          if (variant.trackQuantity) {
            if (variant.stock < item.quantity) {
              throw new Error(`Insufficient stock for ${item.product.name} (${variant.name})`);
            }
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { decrement: item.quantity } }
            });
          }
        } else {
          const product = await tx.product.findUnique({
            where: { id: item.productId }
          });

          if (!product) throw new Error(`Product not found: ${item.product.name}`);

          if (product.trackQuantity) {
            if (product.stock < item.quantity) {
              throw new Error(`Insufficient stock for ${item.product.name}`);
            }
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } }
            });
          }
        }
      }
      let discountId: string | null = null;
      if (data.couponCode) {
        const discount = await tx.discount.findUnique({
            where: { code: data.couponCode }
        });
        
        if (discount) {
            if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
                throw new Error("Coupon usage limit reached during checkout.");
            }
            discountId = discount.id;
            await tx.discount.update({
                where: { id: discount.id },
                data: { usedCount: { increment: 1 } }
            });
        }
      }
      const count = await tx.order.count();
      const orderNumber = `ORD-${1000 + count + 1}`;
      let gatewayName = "OFFLINE";
      const pmUpper = data.paymentMethod.toUpperCase();
      if (pmUpper.includes("STRIPE")) gatewayName = "STRIPE";
      else if (pmUpper.includes("PAYPAL")) gatewayName = "PAYPAL";
      return await tx.order.create({
        data: {
          orderNumber,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.UNPAID,
          paymentGateway: gatewayName,
          paymentMethod: data.paymentMethod,
          paymentId: data.paymentIntentId || null,
          subtotal: calculation.subtotal,
          shippingTotal: calculation.shippingCost,
          discountTotal: calculation.discount,
          surcharge: calculation.surcharge,
          total: calculation.total,
          couponCode: data.couponCode || null,
          discountId: discountId,
          guestEmail: data.billing.email,
          shippingAddress: data.shipping,
          billingAddress: data.billing,
          shippingMethod: data.shippingMethodId,
          customerNote: data.customerNote,
          
          affiliateId: affiliateId,

          items: {
            create: cart.items.map(item => {
              const price = item.variant 
                ? (item.variant.salePrice ?? item.variant.price)
                : (item.product.salePrice ?? item.product.price);

              return {
                productId: item.productId,
                variantId: item.variantId,
                productName: item.product.name,
                variantName: item.variant?.name,
                sku: item.variant?.sku || item.product.sku,
                price: price, 
                quantity: item.quantity,
                total: Number(price) * item.quantity, 
                image: item.variant?.image || item.product.featuredImage
              };
            })
          }
        }
      });
    }, {
      maxWait: 5000, 
      timeout: 10000 
    });
    
    if (!data.retainCart) {
      await clearCart();
    }

    sendNotification({
      trigger: "ORDER_PENDING",
      recipient: data.billing.email,
      orderId: newOrder.id,
      data: {
        order_number: newOrder.orderNumber,
        customer_name: `${data.billing.firstName} ${data.billing.lastName}`,
        total_amount: calculation.total, 
      }
    }).catch(err => console.error("Order Email Failed:", err.message));
    if (affiliateId) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const apiKey = process.env.INTERNAL_API_KEY || "";
      
      fetch(`${appUrl}/api/affiliate/process-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({ orderId: newOrder.id })
      }).catch(err => console.error("Affiliate Trigger Failed:", err.message));
    }

    return {
      success: true,
      id: newOrder.id,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      orderKey: "key_" + newOrder.id,
      grandTotal: calculation.total
    };

  } catch (error: any) {
    console.error("Create Order Error:", error);
    return { 
      success: false, 
      error: error.message || "Failed to create order. Please try again." 
    };
  }
}