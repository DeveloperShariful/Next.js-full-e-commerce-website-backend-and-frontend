//app/actions/admin/settings/affiliate/_services/ledger-service.ts

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * SERVICE LAYER: FINANCIAL LEDGER
 * Tracks every single movement of money (Commission in, Payout out).
 */
export const ledgerService = {

  /**
   * Get Global Ledger History (For Admin Audit)
   */
  async getLedgerHistory(page: number = 1, limit: number = 20, type?: string) {
    const skip = (page - 1) * limit;

    const where: Prisma.AffiliateLedgerWhereInput = type ? {
        type: type as any
    } : {};

    const [total, data] = await Promise.all([
      db.affiliateLedger.count({ where }),
      db.affiliateLedger.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
        include: {
          affiliate: {
            select: {
              slug: true,
              user: { select: { name: true, email: true } }
            }
          }
        }
      })
    ]);

    return { 
      transactions: data, 
      total, 
      totalPages: Math.ceil(total / limit) 
    };
  },

  /**
   * Get Specific Affiliate Ledger (For User Profile)
   */
  async getAffiliateLedger(affiliateId: string) {
    return await db.affiliateLedger.findMany({
        where: { affiliateId },
        orderBy: { createdAt: "desc" }
    });
  },

  /**
   * Create Manual Adjustment (Bonus/Penalty)
   */
  async createAdjustment(affiliateId: string, amount: number, note: string, type: "BONUS" | "ADJUSTMENT") {
    // 1. Get current balance
    const affiliate = await db.affiliateAccount.findUnique({ where: { id: affiliateId } });
    if (!affiliate) throw new Error("Affiliate not found");

    const currentBalance = affiliate.balance.toNumber();
    const newBalance = currentBalance + amount;

    // 2. Transaction
    await db.$transaction([
        // Update Balance
        db.affiliateAccount.update({
            where: { id: affiliateId },
            data: { balance: { increment: amount } }
        }),
        // Add Ledger Entry
        db.affiliateLedger.create({
            data: {
                affiliateId,
                type: type,
                amount: amount,
                balanceBefore: currentBalance,
                balanceAfter: newBalance,
                description: note
            }
        })
    ]);

    return { success: true };
  }
};