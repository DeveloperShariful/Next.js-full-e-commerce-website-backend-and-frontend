//File: app/actions/admin/payments/process-refund.ts

"use server"

import { db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { decrypt } from "@/app/actions/admin/settings/payments/crypto"
import { secureAction } from "@/lib/server-action-wrapper"
import Stripe from "stripe"
import { z } from "zod"

// Input Schema
const RefundSchema = z.object({
  orderId: z.string(),
  amount: z.number().optional(),
  reason: z.string().optional()
});

export async function processRefund(params: z.infer<typeof RefundSchema>) {
  return secureAction(
    params,
    {
      actionName: "PROCESS_REFUND",
      auditEntity: "Order", 
      schema: RefundSchema,
      role: "ADMIN",
      idExtractor: (data) => data.orderId 
    },
    async (input, user) => {

      const order = await db.order.findUnique({
        where: { id: input.orderId },
        include: { transactions: true }
      });

      if (!order) throw new Error("Order not found");

      // 2. Find Refundable Transaction
      const chargeTransaction = order.transactions.find(
        t => (t.type === "SALE" || t.type === "CAPTURE") && t.status === "COMPLETED"
      );

      if (!chargeTransaction) throw new Error("No refundable transaction found for this order.");

      // 3. Validation
      const maxRefundable = Number(order.totalPaid) - Number(order.refundedAmount);
      const refundAmount = input.amount ? input.amount : maxRefundable;

      if (refundAmount <= 0) throw new Error("Refund amount must be greater than 0");
      if (refundAmount > maxRefundable) throw new Error("Refund amount exceeds refundable balance.");

      // 4. Gateway Processing
      let gatewayRefundId = "";
      let refundStatus = "pending";

      // --- STRIPE ---
      if (chargeTransaction.gateway === "STRIPE") {
        const config = await db.stripeConfig.findFirst({ where: { paymentMethod: { isEnabled: true } } });
        if (!config) throw new Error("Stripe config missing in DB.");
        
        const secretKey = decrypt(config.testMode ? config.testSecretKey! : config.liveSecretKey!);
        if(!secretKey) throw new Error("Stripe API key not found.");

        const stripe = new Stripe(secretKey, { apiVersion: "2025-01-27.acacia" as any });

        const refund = await stripe.refunds.create({
          payment_intent: chargeTransaction.transactionId,
          amount: Math.round(refundAmount * 100), // Convert to cents
          reason: "requested_by_customer",
          metadata: { order_id: input.orderId, reason: input.reason || "" }
        });
        
        gatewayRefundId = refund.id;
        refundStatus = refund.status === "succeeded" ? "COMPLETED" : "PENDING";
      }
      
      // --- PAYPAL ---
      else if (chargeTransaction.gateway === "PAYPAL") {
        const config = await db.paypalConfig.findFirst({ where: { paymentMethod: { isEnabled: true } } });
        if (!config) throw new Error("PayPal config missing.");

        const isSandbox = config.sandbox;
        const clientId = isSandbox ? config.sandboxClientId : config.liveClientId;
        const secret = decrypt(isSandbox ? config.sandboxClientSecret! : config.liveClientSecret!);
        
        if (!clientId || !secret) throw new Error("PayPal credentials missing.");

        // Get Access Token
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
        if(!tokenData.access_token) throw new Error("Failed to authenticate with PayPal.");

        // Issue Refund
        const refundRes = await fetch(
            `https://api-m.${isSandbox ? "sandbox." : ""}paypal.com/v2/payments/captures/${chargeTransaction.transactionId}/refund`,
            {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${tokenData.access_token}`, 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({
                    amount: { value: refundAmount.toFixed(2), currency_code: order.currency },
                    note_to_payer: input.reason
                })
            }
        );
        const refundData = await refundRes.json();
        if (!refundRes.ok) throw new Error(refundData.message || "PayPal refund failed.");

        gatewayRefundId = refundData.id;
        refundStatus = refundData.status === "COMPLETED" ? "COMPLETED" : "PENDING";
      }

      // 5. Database Updates (Transactional)
      await db.$transaction(async (tx) => {
        // Create Refund Record
        await tx.refund.create({
          data: {
            orderId: order.id,
            amount: refundAmount,
            reason: input.reason,
            status: refundStatus,
            gatewayRefundId: gatewayRefundId,
          }
        });

        // Log Transaction
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
            metadata: { reason: input.reason }
          }
        });

        // Update Order
        const newRefundedTotal = Number(order.refundedAmount) + refundAmount;
        const newStatus = newRefundedTotal >= Number(order.totalPaid) ? "REFUNDED" : "PARTIALLY_REFUNDED";

        await tx.order.update({
          where: { id: input.orderId },
          data: {
            refundedAmount: newRefundedTotal,
            paymentStatus: newStatus,
            status: newStatus === "REFUNDED" ? "REFUNDED" : order.status
          }
        });
      });

      // 6. Revalidate UI
      revalidatePath(`/admin/orders/${input.orderId}`);

      return { 
        success: true, 
        message: `Successfully refunded ${order.currency} ${refundAmount}`,
        data: { orderId: input.orderId, amount: refundAmount, gatewayId: gatewayRefundId }
      };
    }
  );
}