//File: app/actions/storefront/checkout/paypal-payments.ts

"use server";

import { db } from "@/lib/prisma";
import { decrypt } from "@/app/actions/admin/settings/payments/crypto";
import { secureAction } from "@/lib/server-action-wrapper";
import { createOrder } from "./create-order"; 
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { clearCart } from "../cart/clear-cart";
import { calculateCartTotals } from "./checkout-utils"; 
import { z } from "zod";
import { revalidatePath } from "next/cache"; 

const CreatePayPalSchema = z.object({
    cartId: z.string(),
    shippingMethodId: z.string(),
    shippingAddress: z.any(), 
    couponCode: z.string().optional()
});

export async function createPayPalOrder(params: z.infer<typeof CreatePayPalSchema>) {
    return secureAction(params, { actionName: "CREATE_PAYPAL_ORDER", schema: CreatePayPalSchema, role: "PUBLIC" }, async (input) => {
        const calculation = await calculateCartTotals(
            input.cartId, 
            input.shippingMethodId, 
            input.shippingAddress, 
            input.couponCode,
            "paypal"
        );
        
        const grandTotal = calculation.total; 
        
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
                    amount: { 
                        currency_code: "AUD", 
                        value: grandTotal 
                    }
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
        const captureRes = await fetch(isSandbox ? `https://api-m.sandbox.paypal.com/v2/checkout/orders/${input.payPalOrderId}/capture` : `https://api-m.paypal.com/v2/checkout/orders/${input.payPalOrderId}/capture`, {
            method: "POST",
            headers: { Authorization: `Bearer ${tokenData.access_token}`, "Content-Type": "application/json" }
        });

        const captureData = await captureRes.json();

        if (captureData.status === "COMPLETED" || captureData.status === "APPROVED") {
            const captureId = captureData.purchase_units[0].payments.captures[0].id;
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
                console.error("CRITICAL: PayPal Captured but Order Creation Failed", captureId);
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

        throw new Error("PayPal Capture Failed: " + (captureData.details?.[0]?.description || "Unknown error"));
    });
}