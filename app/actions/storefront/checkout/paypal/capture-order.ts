"use server";

import { db } from "@/lib/prisma";
import { decrypt } from "@/app/actions/admin/settings/payments/crypto";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { clearCart } from "../../cart/clear-cart";

// (getAccessToken ফাংশনটি এখানেও লাগবে বা শেয়ার্ড ফাইলে রাখতে পারেন)
async function getAccessToken(clientId: string, clientSecret: string, isSandbox: boolean) {
    const baseUrl = isSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const response = await fetch(`${baseUrl}/v1/oauth2/token`, { method: "POST", body: "grant_type=client_credentials", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" } });
    const data = await response.json();
    return data.access_token;
}

export async function capturePayPalOrder(payPalOrderId: string, cartId: string, customerInfo: any, shippingInfo: any, shippingMethodId: string) {
  try {
    // ১. ক্রেডেনশিয়াল আনা
    const config = await db.paypalConfig.findFirst({ where: { paymentMethod: { isEnabled: true } } });
    if (!config) throw new Error("PayPal config missing");
    
    const isSandbox = config.sandbox;
    const clientId = isSandbox ? config.sandboxClientId : config.liveClientId;
    const clientSecret = decrypt((isSandbox ? config.sandboxClientSecret : config.liveClientSecret) ?? "");

    // ২. PayPal Capture API কল
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

        // ৩. অর্ডার ডাটাবেসে সেভ করা (WooCommerce স্টাইল)
        const cart = await db.cart.findUnique({ 
            where: { id: cartId },
            include: { items: { include: { product: true, variant: true } } }
        });

        if(!cart) throw new Error("Cart not found during capture");

        // Order Number Generate
        const count = await db.order.count();
        const orderNumber = `ORD-${1000 + count + 1}`;

        const newOrder = await db.$transaction(async (tx) => {
            // A. Create Order
            const order = await tx.order.create({
                data: {
                    orderNumber,
                    status: OrderStatus.PROCESSING, // পেমেন্ট হয়ে গেছে, তাই প্রসেসিং
                    paymentStatus: PaymentStatus.PAID,
                    paymentMethod: "PayPal",
                    paymentId: captureId, // ট্রানজ্যাকশন আইডি
                    total: totalAmount,
                    subtotal: totalAmount, // (Simplified logic, you can calculate exact)
                    shippingTotal: 0, // (Simplified)
                    
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
                            price: item.variant?.price || item.product.price,
                            total: (item.variant?.price || item.product.price) * item.quantity
                        }))
                    }
                }
            });

            // B. Create Transaction Log
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

            // C. Stock Deduction (গুরুত্বপূর্ণ)
            for (const item of cart.items) {
                if (item.variantId && item.variant?.trackQuantity) {
                    await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { decrement: item.quantity } } });
                } else if (item.product.trackQuantity) {
                    await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
                }
            }

            return order;
        });

        // ৪. কার্ট ক্লিয়ার
        await clearCart();

        return { success: true, orderId: newOrder.id };
    } 
    
    return { success: false, error: "Payment not completed" };

  } catch (error: any) {
    console.error("Capture Error:", error);
    return { success: false, error: error.message };
  }
}