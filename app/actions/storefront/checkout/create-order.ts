//app/actions/storefront/checkout/create-order.ts

"use server";

import { db } from "@/lib/prisma";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { clearCart } from "../cart/clear-cart";
import { calculateShippingServerSide } from "./get-shipping-rates";
import { sendNotification } from "@/app/api/email/send-notification";
import { cookies } from "next/headers";

interface OrderInput {
  cartId: string;
  billing: any;
  shipping: any;
  shippingMethodId: string;
  paymentMethod: string;
  customerNote?: string;
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
    const cart = await db.cart.findUnique({
      where: { id: data.cartId },
      include: { items: { include: { product: true, variant: true } } }
    });

    if (!cart || cart.items.length === 0) {
      return { success: false, error: "Cart is empty" };
    }

    // 1. Affiliate Tracking Logic
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

    let subtotal = 0;
    const orderItemsData: OrderItemData[] = [];

    for (const item of cart.items) {
      const price = Number(item.variant ? (item.variant.salePrice || item.variant.price) : (item.product.salePrice || item.product.price));
      
      const currentStock = item.variant ? item.variant.stock : item.product.stock;
      const trackQuantity = item.variant ? item.variant.trackQuantity : item.product.trackQuantity;
      
      if (trackQuantity && currentStock < item.quantity) {
        return { success: false, error: `Product ${item.product.name} is out of stock.` };
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

    let shippingCost = 0;
    if (data.shippingMethodId) {
      const validCost = await calculateShippingServerSide(
        data.cartId, 
        data.shipping, 
        data.shippingMethodId
      );
      
      if (validCost === null) {
        return { success: false, error: "Invalid shipping method selected. Please refresh." };
      }
      shippingCost = validCost;
    }

    const grandTotal = subtotal + shippingCost;

    const newOrder = await db.$transaction(async (tx) => {
      const count = await tx.order.count();
      const orderNumber = `ORD-${1000 + count + 1}`;

      const order = await tx.order.create({
        data: {
          orderNumber,
          status: OrderStatus.PENDING, 
          paymentStatus: PaymentStatus.UNPAID,
          subtotal: subtotal, 
          shippingTotal: shippingCost,
          total: grandTotal,
          
          guestEmail: data.billing.email,
          shippingAddress: data.shipping,
          billingAddress: data.billing,
          
          paymentMethod: data.paymentMethod,
          shippingMethod: data.shippingMethodId,
          customerNote: data.customerNote,
          
          // Saving Affiliate ID
          affiliateId: affiliateId,

          items: {
            create: orderItemsData
          }
        }
      });
      
      const isOffline = data.paymentMethod.startsWith('offline') || data.paymentMethod === 'cod' || data.paymentMethod === 'bank_transfer';
      
      if (isOffline) {
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
      }

      return order;
    });

    // Send Notifications
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

    await sendNotification({
      trigger: "ORDER_CREATED_ADMIN",
      recipient: "", 
      orderId: newOrder.id,
      data: {
        order_number: newOrder.orderNumber,
        customer_name: `${data.billing.firstName} ${data.billing.lastName}`,
        total_amount: grandTotal.toFixed(2),
      }
    }).catch(err => console.error("Admin Email Error:", err));

    const isOffline = data.paymentMethod.startsWith('offline') || data.paymentMethod === 'cod' || data.paymentMethod === 'bank_transfer';
    
    if (isOffline) {
      await clearCart();

      // Trigger Affiliate Engine for Offline Orders
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      fetch(`${appUrl}/api/affiliate/process-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.INTERNAL_API_KEY!
        },
        body: JSON.stringify({ orderId: newOrder.id })
      }).catch(err => console.error("Offline Affiliate Trigger Failed:", err));
    }

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