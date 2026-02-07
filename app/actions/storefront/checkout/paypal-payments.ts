//File: app/actions/storefront/checkout/paypal-payments.ts

"use server";

import { db } from "@/lib/prisma";
import { decrypt } from "@/app/actions/admin/settings/payments/crypto";
import { secureAction } from "@/lib/security/server-action-wrapper";
import { createOrder } from "./create-order"; 
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { clearCart } from "../cart/clear-cart";
import { calculateShippingServerSide } from "./get-shipping-rates";
import { validateCoupon } from "./validate-coupon";
import { z } from "zod";
import { revalidatePath } from "next/cache"; 

// ✅ আপডেট ১: অ্যাড্রেস রিসিভ করা হচ্ছে
async function calculateCartTotalForPayPal(
    cartId: string, 
    shippingMethodId: string, 
    shippingAddress: any, 
    couponCode?: string
) {
    const cart = await db.cart.findUnique({
        where: { id: cartId },
        include: { items: { include: { product: true, variant: true } } }
    });

    if (!cart || cart.items.length === 0) throw new Error("Cart is empty");

    let subtotal = 0;
    for (const item of cart.items) {
        const price = Number(item.variant ? (item.variant.salePrice || item.variant.price) : (item.product.salePrice || item.product.price));
        subtotal += price * item.quantity;
    }

    // ✅ আপডেট ২: সঠিক অ্যাড্রেস দিয়ে শিপিং ক্যালকুলেশন
    let shippingCost = 0;
    if (shippingMethodId) {
        // এখানে shippingAddress পাস করা হলো, আগে {} ফাঁকা অবজেক্ট ছিল
        const cost = await calculateShippingServerSide(cartId, shippingAddress, shippingMethodId); 
        if (cost !== null) shippingCost = cost;
    }

    let discountAmount = 0;
    if (couponCode) {
        const couponRes = await validateCoupon(couponCode, cartId);
        if (couponRes.success && couponRes.discountAmount) {
            discountAmount = couponRes.discountAmount;
        }
    }

    // Surcharge Calculation
    let surcharge = 0;
    const paypalConf = await db.paypalConfig.findFirst({ include: { paymentMethod: true } });
    const surchargeBase = Math.max(0, subtotal + shippingCost - discountAmount);

    if (paypalConf?.paymentMethod.surchargeEnabled) {
        surcharge = paypalConf.paymentMethod.surchargeType === 'percentage'
            ? (surchargeBase * Number(paypalConf.paymentMethod.surchargeAmount)) / 100
            : Number(paypalConf.paymentMethod.surchargeAmount);
    }

    const grandTotal = Math.max(0, subtotal + shippingCost + surcharge - discountAmount);
    
    console.log(`💰 PayPal Calc: Sub: ${subtotal} | Ship: ${shippingCost} | Disc: ${discountAmount} | Total: ${grandTotal}`);
    
    return grandTotal.toFixed(2);
}

// ✅ আপডেট ৩: স্কিমাতে shippingAddress অ্যাড করা হলো
const CreatePayPalSchema = z.object({
    cartId: z.string(),
    shippingMethodId: z.string(),
    shippingAddress: z.any(), // New
    couponCode: z.string().optional()
});

export async function createPayPalOrder(params: z.infer<typeof CreatePayPalSchema>) {
    return secureAction(params, { actionName: "CREATE_PAYPAL_ORDER", schema: CreatePayPalSchema, role: "PUBLIC" }, async (input) => {
        
        // টোটাল ক্যালকুলেশনের সময় অ্যাড্রেস পাঠানো হচ্ছে
        const grandTotal = await calculateCartTotalForPayPal(
            input.cartId, 
            input.shippingMethodId, 
            input.shippingAddress, 
            input.couponCode
        );
        
        console.log(`🚀 Init PayPal: Cart ${input.cartId} | Total: ${grandTotal}`);

        const config = await db.paypalConfig.findFirst({ 
            where: { paymentMethod: { isEnabled: true } }, 
            include: { paymentMethod: true } 
        });
        
        if (!config) throw new Error("PayPal config missing");

        const isSandbox = config.sandbox;
        const clientId = isSandbox ? config.sandboxClientId : config.liveClientId;
        const secret = decrypt(isSandbox ? config.sandboxClientSecret! : config.liveClientSecret!);
        
        const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
        const tokenRes = await fetch(isSandbox ? "https://api-m.sandbox.paypal.com/v1/oauth2/token" : "https://api-m.paypal.com/v1/oauth2/token", {
            method: "POST",
            body: "grant_type=client_credentials",
            headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" }
        });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) throw new Error("PayPal Auth Failed");

        const orderRes = await fetch(isSandbox ? "https://api-m.sandbox.paypal.com/v2/checkout/orders" : "https://api-m.paypal.com/v2/checkout/orders", {
            method: "POST",
            headers: { Authorization: `Bearer ${tokenData.access_token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                intent: config.intent || "CAPTURE",
                purchase_units: [{
                    amount: { currency_code: "AUD", value: grandTotal }
                }]
            })
        });

        const orderData = await orderRes.json();
        
        if (orderData.id) {
            return { 
                success: true, 
                data: { orderID: orderData.id } 
            };
        } else {
            console.error("PayPal Create Error Response:", orderData);
            throw new Error("PayPal ID generation failed");
        }
    });
}

// ... Capture Function (নিচে যা আছে তাই থাকবে, কোনো পরিবর্তন নেই) ...
const CapturePayPalSchema = z.object({
    payPalOrderId: z.string(),
    cartId: z.string(),
    shippingMethodId: z.string(),
    shippingAddress: z.any(),
    billingAddress: z.any(),
    couponCode: z.string().optional(),
    customerNote: z.string().optional()
});

export async function capturePayPalOrder(params: z.infer<typeof CapturePayPalSchema>) {
    return secureAction(params, { actionName: "CAPTURE_PAYPAL_ORDER", schema: CapturePayPalSchema, role: "PUBLIC" }, async (input) => {
        
        const config = await db.paypalConfig.findFirst({ where: { paymentMethod: { isEnabled: true } } });
        if(!config) throw new Error("Config missing");

        const isSandbox = config.sandbox;
        const clientId = isSandbox ? config.sandboxClientId : config.liveClientId;
        const secret = decrypt(isSandbox ? config.sandboxClientSecret! : config.liveClientSecret!);
        
        const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
        const tokenRes = await fetch(isSandbox ? "https://api-m.sandbox.paypal.com/v1/oauth2/token" : "https://api-m.paypal.com/v1/oauth2/token", {
            method: "POST", body: "grant_type=client_credentials", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" }
        });
        const tokenData = await tokenRes.json();

        // 1. Capture Payment
        const captureRes = await fetch(isSandbox ? `https://api-m.sandbox.paypal.com/v2/checkout/orders/${input.payPalOrderId}/capture` : `https://api-m.paypal.com/v2/checkout/orders/${input.payPalOrderId}/capture`, {
            method: "POST",
            headers: { Authorization: `Bearer ${tokenData.access_token}`, "Content-Type": "application/json" }
        });

        const captureData = await captureRes.json();

        if (captureData.status === "COMPLETED" || captureData.status === "APPROVED") {
            const captureId = captureData.purchase_units[0].payments.captures[0].id;

            // 2. Create Order in DB
            const orderRes = await createOrder({
                cartId: input.cartId,
                billing: input.billingAddress,
                shipping: input.shippingAddress,
                shippingMethodId: input.shippingMethodId,
                paymentMethod: "paypal",
                paymentIntentId: captureId, 
                couponCode: input.couponCode || null,
                customerNote: input.customerNote,
                retainCart: true 
            });

            if (!orderRes.success || !orderRes.orderId) {
                throw new Error("Payment captured but Order Creation Failed: " + orderRes.error);
            }

            // 3. Update Status
            await db.order.update({
                where: { id: orderRes.orderId },
                data: {
                    status: OrderStatus.PROCESSING,
                    paymentStatus: PaymentStatus.PAID,
                    capturedAt: new Date(),
                }
            });
            
            await db.orderTransaction.create({
                data: {
                    orderId: orderRes.orderId,
                    gateway: "PAYPAL",
                    type: "SALE",
                    amount: captureData.purchase_units[0].amount.value,
                    currency: "AUD",
                    transactionId: captureId,
                    status: "COMPLETED",
                    rawResponse: captureData as any
                }
            });

            await clearCart();
            revalidatePath('/checkout');

            return { 
                success: true, 
                data: { orderId: orderRes.orderId } 
            };
        }

        throw new Error("PayPal Capture Failed");
    });
}