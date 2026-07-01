// File: app/actions/backend/order/process-refund.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { safeDecrypt } from "@/app/actions/backend/settings/payments/crypto";
import { restockInventory, sendOrderEmail } from "./order-utils";
import { logActivity } from "@/lib/activity-logger";

export async function processRefund(formData: FormData) {
  try {
    const orderId = formData.get("orderId") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const reason = formData.get("reason") as string;

    if (!orderId || !amount) return { success: false, error: "Invalid data" };

    // ১. অর্ডার আনা
    const order = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!order) return { success: false, error: "Order not found" };

    // Guard: শুধু paid/partially-refunded order রিফান্ড করা যাবে
    const refundableStatuses = ["PAID", "PARTIALLY_REFUNDED", "PARTIALLY_PAID"];
    if (!refundableStatuses.includes(order.paymentStatus)) {
      return { success: false, error: "Only paid orders can be refunded." };
    }

    // ভ্যালিডেশন: অর্ডারের টোটালের বেশি রিফান্ড করা যাবে না
    const currentRefunded = order.refundedAmount ? Number(order.refundedAmount) : 0;
    const orderTotal = Number(order.total);

    if ((currentRefunded + amount) > orderTotal) {
        return { success: false, error: "Refund amount exceeds order total." };
    }

    let gatewayRefundId = "";
    let transactionStatus = "FAILED";

    // =========================================
    // ২. পেমেন্ট গেটওয়ে লজিক (STRIPE)
    // ==========================================
    if (order.paymentGateway === "stripe" || order.paymentGateway?.startsWith("stripe_")) {
        // ✅ NEW: Fetch Stripe from the unified PaymentGateway table
        const stripeConfig = await db.paymentGateway.findUnique({ 
            where: { identifier: "stripe" } 
        });
        
        if (!stripeConfig || !stripeConfig.encryptedSecret) {
            return { success: false, error: "Stripe configuration or secret key is missing." };
        }

        // ✅ NEW: Decrypt the secret key securely
        const secretKey = safeDecrypt(stripeConfig.encryptedSecret);
        if (!secretKey) return { success: false, error: "Stripe secret key is invalid — please re-enter it in Admin → Settings → Payments." };
        
        if (!secretKey) {
            return { success: false, error: "Failed to decrypt Stripe API key." };
        }

        const stripe = new Stripe(secretKey, { apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion });

        try {
            // Stripe API Call
            const refund = await stripe.refunds.create({
                payment_intent: order.paymentIntentId || undefined, 
                charge: order.chargeId || undefined,
                amount: Math.round(amount * 100), // Stripe cents এ কাজ করে
                reason: "requested_by_customer",
                metadata: { order_id: orderId, reason: reason }
            });
            
            gatewayRefundId = refund.id;
            transactionStatus = "SUCCESS";

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Stripe refund failed";
            console.error("Stripe Error:", err);
            return { success: false, error: msg };
        }
    }

    // ==========================================
    // ৩. পেমেন্ট গেটওয়ে লজিক (PAYPAL)
    // ==========================================
    else if (order.paymentGateway === "ppcp-gateway" || order.paymentGateway === "paypal") {
        // ✅ NEW: Fetch PayPal from the unified PaymentGateway table
        const ppConfig = await db.paymentGateway.findFirst({ 
            where: { provider: "PAYPAL" } 
        });
        
        if (!ppConfig || !ppConfig.publicKey || !ppConfig.encryptedSecret) {
            return { success: false, error: "PayPal configuration is missing." };
        }

        const isSandbox = ppConfig.mode === "TEST";
        const clientId = ppConfig.publicKey;
        // ✅ NEW: Decrypt the secret key securely
        const secret = safeDecrypt(ppConfig.encryptedSecret);
        if (!secret) return { success: false, error: "PayPal secret key is invalid — please re-enter it in Admin → Settings → Payments." };
        const baseUrl = isSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";

        try {
            // A. Get Access Token
            const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
            const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
                method: "POST",
                body: "grant_type=client_credentials",
                headers: { Authorization: `Basic ${auth}` },
                cache: "no-store"
            });
            const tokenData = await tokenRes.json();

            if (!tokenRes.ok || !tokenData.access_token) {
                throw new Error("Failed to authenticate with PayPal for refund.");
            }
            
            // B. Process Refund
            // Note: order.paymentId should hold the PayPal Capture ID
            const refundRes = await fetch(`${baseUrl}/v2/payments/captures/${order.paymentId}/refund`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    amount: {
                        value: amount.toFixed(2), // Ensure exactly 2 decimal places for PayPal
                        currency_code: order.currency
                    },
                    note_to_payer: reason || "Refund processed"
                }),
            });

            const refundData = await refundRes.json();
            
            if (!refundRes.ok) {
                throw new Error(refundData.message || refundData.name || "PayPal refund failed");
            }

            gatewayRefundId = refundData.id;
            transactionStatus = "SUCCESS";

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "PayPal refund failed";
            console.error("PayPal Error:", err);
            return { success: false, error: msg };
        }
    }
    
    // ==========================================
    // ৪. ম্যানুয়াল/অফলাইন রিফান্ড (COD / Bank Transfer)
    // ==========================================
    else {
        gatewayRefundId = `MANUAL-REF-${Date.now()}`;
        transactionStatus = "SUCCESS";
    }

    // ==========================================
    // ৫. ডাটাবেস আপডেট (Transaction)
    // ==========================================
    if (transactionStatus === "SUCCESS") {
        await db.$transaction(async (tx) => {
            // A. Create Refund Record
            await tx.refund.create({
                data: {
                    orderId: order.id,
                    amount: amount,
                    reason: reason,
                    status: "completed",
                    gatewayRefundId: gatewayRefundId
                }
            });

            // B. Log Transaction
            await tx.orderTransaction.create({
                data: {
                    orderId: order.id,
                    gateway: order.paymentGateway || "manual",
                    type: "REFUND",
                    amount: amount,
                    currency: order.currency,
                    transactionId: gatewayRefundId,
                    status: "SUCCESS"
                }
            });

            // C. Update Order Status
            const newRefundedTotal = currentRefunded + amount;
            const newPaymentStatus = newRefundedTotal >= orderTotal ? "REFUNDED" : "PARTIALLY_REFUNDED";

            await tx.order.update({
                where: { id: order.id },
                data: {
                    refundedAmount: newRefundedTotal,
                    paymentStatus: newPaymentStatus,
                    status: newPaymentStatus === "REFUNDED" ? "REFUNDED" : order.status
                }
            });

            // D. Restock inventory on full refund
            if (newPaymentStatus === "REFUNDED") {
                await restockInventory(order.id);
            }

            // D. Add Order Note
            await tx.orderNote.create({
                data: {
                    orderId: order.id,
                    content: `Refund of ${order.currency} ${amount} processed. ID: ${gatewayRefundId}`,
                    isSystem: true
                }
            });
        });

        // Notify customer + admin about the refund
        await sendOrderEmail(orderId, "PAYMENT_REFUNDED");

        await logActivity({
          action: "ORDER_REFUNDED",
          entityType: "Order",
          entityId: orderId,
          details: {
            amount,
            currency: order.currency,
            gateway: order.paymentGateway,
            reason,
            refundId: gatewayRefundId,
          },
        });

        revalidatePath(`/admin/orders/${orderId}`);
        return { success: true, message: "Refund processed successfully" };
    }

    return { success: false, error: "Refund failed due to an unknown error." };

  } catch (error) {
    console.error("REFUND_ACTION_ERROR:", error);
    return { success: false, error: "Internal server error" };
  }
}