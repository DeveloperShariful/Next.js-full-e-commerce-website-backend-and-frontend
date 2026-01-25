// File: app/actions/admin/settings/affiliates/_services/payout-service.ts

import { db } from "@/lib/prisma";
import { PayoutQueueItem } from "../types";
import { PayoutStatus, Prisma } from "@prisma/client";

/**
 * SERVICE LAYER: PAYOUT MANAGEMENT
 * Handles payout requests, approvals, and ledger deductions (Banking Logic).
 */
export const payoutService = {
  
  /**
   * Get Payout Requests with Pagination & Filtering
   */
  async getPayouts(
    page: number = 1,
    limit: number = 20,
    status?: PayoutStatus
  ) {
    const skip = (page - 1) * limit;
    
    // Build Filter
    const where: Prisma.AffiliatePayoutWhereInput = status ? { status } : {};

    // Execute Query
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

    // Map to DTO
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

  /**
   * Mark Payout as Paid (Complete Transaction)
   * The balance is usually deducted when the request is created.
   * This step confirms the money has left the bank/paypal.
   */
  async markAsPaid(payoutId: string, transactionId?: string, note?: string) {
    const payout = await db.affiliatePayout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new Error("Payout not found");

    if (payout.status === "COMPLETED") throw new Error("Payout is already completed.");

    // Update Status
    await db.affiliatePayout.update({
      where: { id: payoutId },
      data: {
        status: "COMPLETED",
        transactionId,
        note,
        processedAt: new Date()
      }
    });

    // NOTE: If method is "STORE_CREDIT", we would call the Wallet Service here
    // to credit the user's shopping wallet.
    
    return { success: true };
  },

  /**
   * Reject Payout
   * CRITICAL: Must REFUND the amount back to Affiliate Balance
   */
  async rejectPayout(payoutId: string, reason: string) {
    const payout = await db.affiliatePayout.findUnique({ 
      where: { id: payoutId },
      include: { affiliate: true } 
    });
    
    if (!payout) throw new Error("Payout not found");
    if (payout.status !== "PENDING") throw new Error("Can only reject pending payouts");

    // Atomic Transaction to ensure data integrity
    return await db.$transaction(async (tx) => {
      // 1. Update Payout Status
      await tx.affiliatePayout.update({
        where: { id: payoutId },
        data: { 
          status: "CANCELLED",
          note: reason 
        }
      });

      // 2. Refund Balance to Affiliate
      await tx.affiliateAccount.update({
        where: { id: payout.affiliateId },
        data: {
          balance: { increment: payout.amount }
        }
      });

      // 3. Create Ledger Entry for refund (Audit Trail)
      await tx.affiliateLedger.create({
        data: {
          affiliateId: payout.affiliateId,
          type: "REFUND_DEDUCTION", // Or ADJUSTMENT
          amount: payout.amount,
          balanceBefore: payout.affiliate.balance,
          balanceAfter: payout.affiliate.balance.add(payout.amount),
          description: `Payout Rejected: ${reason}`,
          referenceId: payout.id
        }
      });
    });
  }
};