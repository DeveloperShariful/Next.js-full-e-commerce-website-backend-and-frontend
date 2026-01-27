// File: app/actions/admin/settings/affiliates/_services/payout-service.ts

import { db } from "@/lib/prisma";
import { PayoutQueueItem } from "../types";
import { PayoutStatus, Prisma } from "@prisma/client";
import { sendNotification } from "@/app/api/email/send-notification"; // Ensure correct path

export const payoutService = {
  
  async getPayouts(
    page: number = 1,
    limit: number = 20,
    status?: PayoutStatus
  ) {
    const skip = (page - 1) * limit;
    
    const where: Prisma.AffiliatePayoutWhereInput = status ? { status } : {};

    const [total, data] = await Promise.all([
      db.affiliatePayout.count({ where }),
      db.affiliatePayout.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
        include: {
          affiliate: {
            include: {
              user: { select: { name: true, email: true } }
            }
          }
        }
      })
    ]);

    const items: PayoutQueueItem[] = data.map(p => ({
      id: p.id,
      affiliateId: p.affiliateId,
      affiliateName: p.affiliate.user.name || "Unknown",
      affiliateEmail: p.affiliate.user.email,
      amount: p.amount.toNumber(),
      method: p.method,
      status: p.status,
      requestedAt: p.createdAt,
      bankDetails: p.affiliate.bankDetails,
      paypalEmail: p.affiliate.paypalEmail
    }));

    return { items, total, totalPages: Math.ceil(total / limit) };
  },

  async markAsPaid(payoutId: string, transactionId?: string, note?: string) {
    // Check Existence
    const payout = await db.affiliatePayout.findUnique({ 
        where: { id: payoutId },
        include: { affiliate: { include: { user: true } } } 
    });
    
    if (!payout) throw new Error("Payout not found");
    if (payout.status === "COMPLETED") throw new Error("Payout is already completed.");

    // Update DB
    await db.affiliatePayout.update({
      where: { id: payoutId },
      data: {
        status: "COMPLETED",
        transactionId,
        note,
        processedAt: new Date()
      }
    });

    // Notify Affiliate
    await sendNotification({
        trigger: "PAYOUT_PROCESSED",
        recipient: payout.affiliate.user.email,
        data: {
            affiliate_name: payout.affiliate.user.name,
            payout_amount: payout.amount.toString(),
            transaction_id: transactionId || "N/A"
        },
        userId: payout.affiliate.userId
    });
    
    return { success: true };
  },

  async rejectPayout(payoutId: string, reason: string) {
    const payout = await db.affiliatePayout.findUnique({ 
      where: { id: payoutId },
      include: { affiliate: { include: { user: true } } } 
    });
    
    if (!payout) throw new Error("Payout not found");
    if (payout.status !== "PENDING") throw new Error("Can only reject pending payouts");

    return await db.$transaction(async (tx) => {
      // 1. Cancel Payout
      await tx.affiliatePayout.update({
        where: { id: payoutId },
        data: { 
          status: "CANCELLED",
          note: reason 
        }
      });

      // 2. Refund to Balance
      await tx.affiliateAccount.update({
        where: { id: payout.affiliateId },
        data: {
          balance: { increment: payout.amount }
        }
      });

      // 3. Log Return
      await tx.affiliateLedger.create({
        data: {
          affiliateId: payout.affiliateId,
          type: "REFUND_DEDUCTION", 
          amount: payout.amount,
          balanceBefore: payout.affiliate.balance,
          balanceAfter: payout.affiliate.balance.add(payout.amount),
          description: `Payout Rejected: ${reason}`,
          referenceId: payout.id
        }
      });

      // 4. Notify Affiliate
      await sendNotification({
        trigger: "PAYOUT_REJECTED",
        recipient: payout.affiliate.user.email,
        data: {
            affiliate_name: payout.affiliate.user.name,
            payout_amount: payout.amount.toString(),
            rejection_reason: reason
        },
        userId: payout.affiliate.userId
      });
    });
  }
};