//app/actions/storefront/checkout/paypal/capture-order.ts

"use server";

import { db } from "@/lib/prisma";
import { decrypt } from "@/app/actions/admin/settings/payments/crypto";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { clearCart } from "../../cart/clear-cart";

async function getAccessToken(clientId: string, clientSecret: string, isSandbox: boolean) {
    const baseUrl = isSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const response = await fetch(`${baseUrl}/v1/oauth2/token`, { method: "POST", body: "grant_type=client_credentials", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" } });
    const data = await response.json();
    return data.access_token;
}

export async function capturePayPalOrder(payPalOrderId: string, cartId: string, customerInfo: any, shippingInfo: any, shippingMethodId: string) {
  try {
    const config = await db.paypalConfig.findFirst({ where: { paymentMethod: { isEnabled: true } } });
    if (!config) throw new Error("PayPal config missing");
    
    const isSandbox = config.sandbox;
    const clientId = isSandbox ? config.sandboxClientId : config.liveClientId;
    const rawSecret = isSandbox ? config.sandboxClientSecret : config.liveClientSecret;
    const clientSecret = rawSecret ? decrypt(rawSecret) : "";

    const accessToken = await getAccessToken(clientId!, clientSecret, isSandbox);
    const baseUrl = isSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";

    const response = await fetch(`${baseUrl}/v2/checkout/orders/${payPalOrderId}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }
    });

    const data = await response.json();

    if (data.status === "COMPLETED") {
        const captureId = data.purchase_units[0].payments.captures[0].id;
        const totalAmount = parseFloat(data.purchase_units[0].payments.captures[0].amount.value);

        const cart = await db.cart.findUnique({ 
            where: { id: cartId },
            include: { items: { include: { product: true, variant: true } } }
        });

        if(!cart) throw new Error("Cart not found");

        const newOrder = await db.$transaction(async (tx) => {
            // 1. Order Number
            const count = await tx.order.count();
            const orderNumber = `ORD-${1000 + count + 1}`;

            // 2. Create Order
            const order = await tx.order.create({
                data: {
                    orderNumber,
                    status: OrderStatus.PROCESSING,
                    paymentStatus: PaymentStatus.PAID,
                    paymentMethod: "PayPal",
                    paymentId: captureId,
                    total: totalAmount,
                    subtotal: totalAmount, // (Note: You can store exact breakdown if needed)
                    shippingTotal: 0, 
                    guestEmail: customerInfo.email,
                    billingAddress: customerInfo,
                    shippingAddress: shippingInfo,
                    shippingMethod: shippingMethodId,
                    items: {
                        create: cart.items.map(item => ({
                            productName: item.product.name,
                            productId: item.productId,
                            variantId: item.variantId,
                            quantity: item.quantity,
                            price: Number(item.variant?.price || item.product.price),
                            total: Number(item.variant?.price || item.product.price) * item.quantity
                        }))
                    }
                }
            });

            // 3. Transaction Log
            await tx.orderTransaction.create({
                data: {
                    orderId: order.id,
                    gateway: "PAYPAL",
                    type: "SALE",
                    amount: totalAmount,
                    currency: "AUD",
                    transactionId: captureId,
                    status: "COMPLETED",
                    rawResponse: data
                }
            });

            // 4. 🔥 STOCK DEDUCTION (The Missing Part)
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

            return order;
        });

        await clearCart();
        return { success: true, orderId: newOrder.id };
    } 
    
    return { success: false, error: "Payment not completed" };

  } catch (error: any) {
    console.error("Capture Error:", error);
    return { success: false, error: error.message };
  }
}