//app/actions/storefront/affiliates/_services/finance-service.ts

import { db } from "@/lib/prisma";
import { AffiliateConfigDTO } from "@/app/actions/storefront/affiliates/types";

/**
 * SERVICE: Finance & Wallet Management
 */
export const financeService = {

  /**
   * Get Wallet Overview (Balance + Config)
   */
  async getWalletData(affiliateId: string) {
    // 1. Get User Balance
    const account = await db.affiliateAccount.findUnique({
      where: { id: affiliateId },
      select: { balance: true, totalEarnings: true, bankDetails: true, paypalEmail: true }
    });

    if (!account) throw new Error("Affiliate account not found.");

    // 2. Get Global Payout Settings
    const settings = await db.storeSettings.findUnique({ where: { id: "settings" } });
    const config = (settings?.affiliateConfig as AffiliateConfigDTO) || {};

    // 3. Calculate Pending Payouts
    const pendingAmount = await db.affiliatePayout.aggregate({
      where: { affiliateId, status: "PENDING" },
      _sum: { amount: true }
    });

    return {
      balance: account.balance.toNumber(),
      totalEarnings: account.totalEarnings.toNumber(),
      pendingPayouts: pendingAmount._sum.amount?.toNumber() || 0,
      config: {
        minimumPayout: Number(config.minimumPayout) || 50,
        payoutMethods: config.payoutMethods || ["STORE_CREDIT"],
        holdingPeriod: Number(config.holdingPeriod) || 14
      },
      paymentDetails: {
        bank: account.bankDetails,
        paypal: account.paypalEmail
      }
    };
  },

  /**
   * Get Payout History
   */
  async getPayoutHistory(affiliateId: string) {
    return await db.affiliatePayout.findMany({
      where: { affiliateId },
      orderBy: { createdAt: "desc" }
    });
  },

  /**
   * Get Ledger (Transaction Log)
   */
  async getLedger(affiliateId: string, limit: number = 50) {
    return await db.affiliateLedger.findMany({
      where: { affiliateId },
      orderBy: { createdAt: "desc" },
      take: limit
    });
  }
};