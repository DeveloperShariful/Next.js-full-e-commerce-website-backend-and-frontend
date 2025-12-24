// File: app/actions/order/process-refund.ts

"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";

export async function processRefund(formData: FormData) {
  try {
    const orderId = formData.get("orderId") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const reason = formData.get("reason") as string;

    if (!orderId || !amount) return { success: false, error: "Invalid data" };

    // ১. অর্ডার এবং পেমেন্ট কনফিগারেশন আনা
    const order = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!order) return { success: false, error: "Order not found" };

    // ভ্যালিডেশন: অর্ডারের টোটালের বেশি রিফান্ড করা যাবে না
    const alreadyRefunded = order.refundedAmount || 0;
    if ((alreadyRefunded + amount) > order.total) {
        return { success: false, error: "Refund amount exceeds order total." };
    }

    let gatewayRefundId = "";
    let transactionStatus = "FAILED";

    // ==========================================
    // ২. পেমেন্ট গেটওয়ে লজিক (STRIPE)
    // ==========================================
    if (order.paymentGateway === "stripe") {
        const stripeConfig = await db.stripeConfig.findFirst({ where: { enableStripe: true } });
        
        if (!stripeConfig || (!stripeConfig.liveSecretKey && !stripeConfig.testSecretKey)) {
            return { success: false, error: "Stripe configuration missing." };
        }

        const secretKey = stripeConfig.testMode ? stripeConfig.testSecretKey : stripeConfig.liveSecretKey;
        const stripe = new Stripe(secretKey as string, { apiVersion: '2025-01-27.acacia' as any });

        try {
            // Stripe API Call
            const refund = await stripe.refunds.create({
                payment_intent: order.paymentIntentId || undefined, // or charge: order.chargeId
                charge: order.chargeId || undefined,
                amount: Math.round(amount * 100), // Stripe cents এ কাজ করে
                reason: "requested_by_customer",
            });
            
            gatewayRefundId = refund.id;
            transactionStatus = "SUCCESS";

        } catch (err: any) {
            console.error("Stripe Error:", err);
            return { success: false, error: err.message };
        }
    }

    // ==========================================
    // ৩. পেমেন্ট গেটওয়ে লজিক (PAYPAL)
    // ==========================================
    else if (order.paymentGateway === "paypal") {
        const ppConfig = await db.paypalConfig.findFirst({ where: { enablePaypal: true } });
        
        if (!ppConfig) return { success: false, error: "PayPal config missing" };

        const clientId = ppConfig.sandbox ? ppConfig.sandboxClientId : ppConfig.liveClientId;
        const secret = ppConfig.sandbox ? ppConfig.sandboxClientSecret : ppConfig.liveClientSecret;
        const baseUrl = ppConfig.sandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";

        try {
            // A. Get Access Token
            const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
            const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
                method: "POST",
                body: "grant_type=client_credentials",
                headers: { Authorization: `Basic ${auth}` },
            });
            const tokenData = await tokenRes.json();
            
            // B. Process Refund
            // PayPal Capture ID লাগে (যা আমরা order.paymentId তে রাখি)
            const refundRes = await fetch(`${baseUrl}/v2/payments/captures/${order.paymentId}/refund`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    amount: {
                        value: amount.toString(),
                        currency_code: order.currency
                    },
                    note_to_payer: reason
                }),
            });

            const refundData = await refundRes.json();
            
            if (!refundRes.ok) {
                throw new Error(refundData.message || "PayPal refund failed");
            }

            gatewayRefundId = refundData.id;
            transactionStatus = "SUCCESS";

        } catch (err: any) {
            console.error("PayPal Error:", err);
            return { success: false, error: err.message };
        }
    }
    
    // ==========================================
    // ৪. ম্যানুয়াল/অফলাইন রিফান্ড (COD)
    // ==========================================
    else {
        // অফলাইন রিফান্ড হলে সরাসরি সাকসেস ধরে নিচ্ছি
        gatewayRefundId = `MANUAL-REF-${Date.now()}`;
        transactionStatus = "SUCCESS";
    }

    // ==========================================
    // ৫. ডাটাবেস আপডেট (Transaction)
    // ==========================================
    if (transactionStatus === "SUCCESS") {
        await db.$transaction([
            // A. Create Refund Record
            db.refund.create({
                data: {
                    orderId: order.id,
                    amount: amount,
                    reason: reason,
                    status: "completed",
                    gatewayRefundId: gatewayRefundId
                }
            }),
            // B. Log Transaction
            db.orderTransaction.create({
                data: {
                    orderId: order.id,
                    gateway: order.paymentGateway || "manual",
                    type: "REFUND",
                    amount: amount,
                    currency: order.currency,
                    transactionId: gatewayRefundId,
                    status: "SUCCESS"
                }
            }),
            // C. Update Order Status
            db.order.update({
                where: { id: order.id },
                data: {
                    refundedAmount: { increment: amount },
                    paymentStatus: (alreadyRefunded + amount) >= order.total ? "REFUNDED" : "PARTIALLY_REFUNDED"
                }
            })
        ]);

        revalidatePath(`/admin/orders/${orderId}`);
        return { success: true, message: "Refund processed successfully" };
    }

    return { success: false, error: "Refund failed unknown error" };

  } catch (error) {
    console.error("REFUND_ACTION_ERROR:", error);
    return { success: false, error: "Internal server error" };
  }
}