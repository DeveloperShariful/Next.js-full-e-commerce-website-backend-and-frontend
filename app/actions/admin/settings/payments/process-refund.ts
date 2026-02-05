//File: app/actions/admin/payments/process-refund.ts

"use server"

import { db } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { decrypt } from "@/app/actions/admin/settings/payments/crypto"
import { auditService } from "@/lib/services/audit-service"
import Stripe from "stripe"

interface RefundParams {
  orderId: string;
  amount?: number; 
  reason?: string;
}

export async function processRefund({ orderId, amount, reason }: RefundParams) {
  const { userId } = await auth();
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { transactions: true }
  });

  if (!order) return { success: false, error: "Order not found" };

  const chargeTransaction = order.transactions.find(
    t => (t.type === "SALE" || t.type === "CAPTURE") && t.status === "COMPLETED"
  );

  if (!chargeTransaction) {
    return { success: false, error: "No refundable transaction found for this order." };
  }

  const maxRefundable = Number(order.totalPaid) - Number(order.refundedAmount);
  const refundAmount = amount ? amount : maxRefundable;

  if (refundAmount <= 0) return { success: false, error: "Refund amount must be greater than 0" };
  if (refundAmount > maxRefundable) return { success: false, error: "Refund amount exceeds total paid." };

  try {
    let gatewayRefundId = "";
    let refundStatus = "pending";

    // ============================================
    // A. STRIPE REFUND LOGIC
    // ============================================
    if (chargeTransaction.gateway === "STRIPE") {
        const config = await db.stripeConfig.findFirst({
            where: { paymentMethod: { isEnabled: true } }
        });
        if (!config) throw new Error("Stripe config missing");

        const secretKey = decrypt(config.testMode ? config.testSecretKey! : config.liveSecretKey!);
        const stripe = new Stripe(secretKey, { apiVersion: "2025-01-27.acacia" as any });

        const refund = await stripe.refunds.create({
            payment_intent: chargeTransaction.transactionId,
            amount: Math.round(refundAmount * 100), // Convert to cents
            reason: "requested_by_customer",
            metadata: { order_id: orderId, reason: reason || "" }
        });

        gatewayRefundId = refund.id;
        refundStatus = refund.status === "succeeded" ? "COMPLETED" : "PENDING";
    }

    // ============================================
    // B. PAYPAL REFUND LOGIC
    // ============================================
    else if (chargeTransaction.gateway === "PAYPAL") {
        const config = await db.paypalConfig.findFirst({
            where: { paymentMethod: { isEnabled: true } }
        });
        if (!config) throw new Error("PayPal config missing");

        const isSandbox = config.sandbox;
        const clientId = isSandbox ? config.sandboxClientId : config.liveClientId;
        const secret = decrypt(isSandbox ? config.sandboxClientSecret! : config.liveClientSecret!);
        
        // Get Token
        const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
        const tokenRes = await fetch(
            `https://api-m.${isSandbox ? "sandbox." : ""}paypal.com/v1/oauth2/token`,
            {
                method: "POST",
                body: "grant_type=client_credentials",
                headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" }
            }
        );
        const tokenData = await tokenRes.json();

        // Process Refund
        const captureId = chargeTransaction.transactionId; // PayPal Capture ID
        const refundRes = await fetch(
            `https://api-m.${isSandbox ? "sandbox." : ""}paypal.com/v2/payments/captures/${captureId}/refund`,
            {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${tokenData.access_token}`, 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({
                    amount: { value: refundAmount.toFixed(2), currency_code: order.currency },
                    note_to_payer: reason
                })
            }
        );
        
        const refundData = await refundRes.json();
        if (!refundRes.ok) throw new Error(refundData.message || "PayPal refund failed");

        gatewayRefundId = refundData.id;
        refundStatus = refundData.status === "COMPLETED" ? "COMPLETED" : "PENDING";
    }

    // ============================================
    // C. DATABASE UPDATES (TRANSACTIONAL)
    // ============================================
    await db.$transaction(async (tx) => {
        // 1. Create Refund Record
        await tx.refund.create({
            data: {
                id: gatewayRefundId || undefined, // Use gateway ID as DB ID if possible, else UUID
                orderId: order.id,
                amount: refundAmount,
                reason: reason,
                status: refundStatus,
                gatewayRefundId: gatewayRefundId,
            }
        });

        // 2. Log Transaction
        await tx.orderTransaction.create({
            data: {
                orderId: order.id,
                gateway: chargeTransaction.gateway,
                type: "REFUND",
                amount: refundAmount,
                currency: order.currency,
                transactionId: gatewayRefundId || `REF-${Date.now()}`,
                status: refundStatus,
                parentTransactionId: chargeTransaction.id,
                metadata: { reason }
            }
        });

        // 3. Update Order Totals & Status
        const newRefundedTotal = Number(order.refundedAmount) + refundAmount;
        const newStatus = newRefundedTotal >= Number(order.totalPaid) ? "REFUNDED" : "PARTIALLY_REFUNDED";
        
        await tx.order.update({
            where: { id: orderId },
            data: {
                refundedAmount: newRefundedTotal,
                paymentStatus: newStatus, // Update Payment Enum
                status: newStatus === "REFUNDED" ? "REFUNDED" : order.status // Optional: Update Order Status
            }
        });
    });

    // 4. Audit Log
    await auditService.log({
        userId: userId ?? "system",
        action: "PROCESS_REFUND",
        entity: "Order",
        entityId: orderId,
        newData: { amount: refundAmount, gateway: chargeTransaction.gateway }
    });

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true, message: `Successfully refunded ${order.currency} ${refundAmount}` };

  } catch (error: any) {
    await auditService.systemLog("ERROR", "PROCESS_REFUND", error.message, { orderId });
    return { success: false, error: error.message || "Refund failed" };
  }
}