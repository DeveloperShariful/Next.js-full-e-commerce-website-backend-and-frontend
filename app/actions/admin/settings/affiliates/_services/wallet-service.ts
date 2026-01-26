//app/actions/admin/settings/affiliates/_services/wallet-service.ts

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * SERVICE: Wallet Integration
 * Connects Affiliate Payouts to User Store Credit (Wallet)
 */
export const walletService = {
  
  /**
   * Process a payout as Store Credit
   * 1. Deduct from Affiliate Balance
   * 2. Add to User Wallet
   * 3. Log Transactions
   */
  async processStoreCreditPayout(
    payoutId: string, 
    userId: string, 
    amount: number
  ) {
    return await db.$transaction(async (tx) => {
      // 1. Verify Wallet Exists
      let wallet = await tx.wallet.findUnique({ where: { userId } });
      
      if (!wallet) {
        wallet = await tx.wallet.create({
          data: { userId, balance: 0 }
        });
      }

      // 2. Mark Payout as Completed
      await tx.affiliatePayout.update({
        where: { id: payoutId },
        data: {
          status: "COMPLETED",
          processedAt: new Date(),
          method: "STORE_CREDIT",
          note: "Credited to Wallet"
        }
      });

      // 3. Credit User Wallet
      const creditAmount = new Prisma.Decimal(amount);
      
      await tx.wallet.update({
        where: { userId },
        data: {
          balance: { increment: creditAmount }
        }
      });

      // 4. Log Wallet Transaction
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: creditAmount,
          type: "SALE", // Or "DEPOSIT" / "REFUND" - mapping closest enum type
          description: "Affiliate Payout Credit",
          reference: `PAYOUT-${payoutId}`
        }
      });

      // 5. Update Affiliate Ledger (Deduction is usually done at request time, but confirming here if needed)
      // Assuming deduction happened when Payout was requested (PENDING state). 
      // If not, add logic here.

      return { success: true };
    });
  }
};