//File: app/actions/storefront/checkout/paypal-payments.ts

"use server";

import { db } from "@/lib/prisma";
import { decrypt } from "@/app/actions/admin/settings/payments/crypto";
import { secureAction } from "@/lib/security/server-action-wrapper";
import { createOrder } from "./create-order";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { clearCart } from "../cart/clear-cart"; // ✅ Import clearCart
import { z } from "zod";

async function getPayPalAccessToken(clientId: string, clientSecret: string, isSandbox: boolean) {
  const baseUrl = isSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  
  try {
      const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: "POST",
        body: "grant_type=client_credentials",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
        cache: "no-store"
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.access_token) {
          console.error("❌ PayPal Token Error:", JSON.stringify(data, null, 2));
          throw new Error(`Auth Failed: ${data.error_description || "Check Client ID/Secret"}`);
      }
      return data.access_token;
  } catch (error: any) {
      console.error("❌ PayPal Network Error:", error.message);
      throw new Error("Could not connect to PayPal");
  }
}

const CreatePayPalSchema = z.object({
    cartId: z.string(),
    shippingMethodId: z.string(),
    shippingAddress: z.any(),
    billingAddress: z.any(),
    couponCode: z.string().optional(),
    customerNote: z.string().optional()
});

export async function createPayPalOrder(params: z.infer<typeof CreatePayPalSchema>) {
    return secureAction(params, { actionName: "CREATE_PAYPAL_ORDER", schema: CreatePayPalSchema, role: "PUBLIC" }, async (input) => {
        
        // 1. Create DB Order but KEEP CART (retainCart: true)
        const orderRes = await createOrder({
            cartId: input.cartId,
            billing: input.billingAddress,
            shipping: input.shippingAddress,
            shippingMethodId: input.shippingMethodId,
            paymentMethod: "paypal",
            couponCode: input.couponCode || null,
            customerNote: input.customerNote,
            retainCart: true // ✅ Fix: Don't clear cart yet!
        });

        if (!orderRes.success || !orderRes.orderId) {
            throw new Error(orderRes.error || "Failed to create local order");
        }

        const dbOrderId = orderRes.orderId;
        const grandTotal = Number(orderRes.grandTotal).toFixed(2);

        // 2. Fetch Config
        const config = await db.paypalConfig.findFirst({ where: { paymentMethod: { isEnabled: true } }, include: { paymentMethod: true } });
        if (!config) throw new Error("PayPal Unavailable");

        const isSandbox = config.sandbox;
        const clientId = isSandbox ? config.sandboxClientId : config.liveClientId;
        const rawSecret = isSandbox ? config.sandboxClientSecret : config.liveClientSecret;
        const secret = rawSecret ? decrypt(rawSecret) : "";
        
        if (!clientId || !secret) throw new Error("PayPal Credentials Missing");

        // 3. Get Token
        const accessToken = await getPayPalAccessToken(clientId, secret, isSandbox);
        const baseUrl = isSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";

        // 4. Create PayPal Order
        const payload = {
            intent: config.intent || "CAPTURE",
            purchase_units: [{
                reference_id: dbOrderId,
                custom_id: dbOrderId,
                amount: {
                    currency_code: "AUD",
                    value: grandTotal
                },
                description: `Order ${orderRes.orderNumber}`
            }]
        };

        const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (response.ok && data.status === "CREATED") {
            // Update DB with PayPal ID
            await db.order.update({
                where: { id: dbOrderId },
                data: { paymentId: data.id }
            });
            
            return { success: true, orderID: data.id, dbOrderId: dbOrderId };
        } else {
            // Log full error for debugging
            console.error("❌ PayPal API Error:", JSON.stringify(data, null, 2));
            const issue = data.details?.[0]?.issue || data.name || "Unknown Error";
            throw new Error(`PayPal Rejected: ${issue}`);
        }
    });
}

const CapturePayPalSchema = z.object({
    payPalOrderId: z.string(),
    dbOrderId: z.string()
});

export async function capturePayPalOrder(params: z.infer<typeof CapturePayPalSchema>) {
    return secureAction(params, { actionName: "CAPTURE_PAYPAL_ORDER", schema: CapturePayPalSchema, role: "PUBLIC" }, async (input) => {
        const config = await db.paypalConfig.findFirst({ where: { paymentMethod: { isEnabled: true } } });
        if(!config) throw new Error("Config missing");       
        
        const isSandbox = config.sandbox;
        const clientId = isSandbox ? config.sandboxClientId : config.liveClientId;
        const secret = decrypt(isSandbox ? config.sandboxClientSecret! : config.liveClientSecret!);
        const accessToken = await getPayPalAccessToken(clientId!, secret, isSandbox);
        const baseUrl = isSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";

        const response = await fetch(`${baseUrl}/v2/checkout/orders/${input.payPalOrderId}/capture`, {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }
        });

        const data = await response.json();

        if ((data.status === "COMPLETED") || (data.status === "APPROVED")) {
            const captureId = data.purchase_units[0].payments.captures[0].id;
            
            await db.$transaction(async (tx) => {
                await tx.order.update({
                    where: { id: input.dbOrderId },
                    data: {
                        status: OrderStatus.PROCESSING,
                        paymentStatus: PaymentStatus.PAID,
                        paymentId: captureId,
                        capturedAt: new Date(),
                        paymentGateway: "PAYPAL",
                    }
                });

                await tx.orderTransaction.create({
                    data: {
                        orderId: input.dbOrderId,
                        gateway: "PAYPAL",
                        type: "SALE",
                        amount: data.purchase_units[0].amount.value,
                        currency: "AUD",
                        transactionId: captureId,
                        status: "COMPLETED",
                        rawResponse: data 
                    }
                });
            });

            // ✅ CRITICAL FIX: Clear Cart ONLY AFTER successful capture
            await clearCart();

            return { success: true, orderId: input.dbOrderId };
        }
        
        console.error("❌ Capture Failed:", data);
        throw new Error("Payment capture failed");
    });
}