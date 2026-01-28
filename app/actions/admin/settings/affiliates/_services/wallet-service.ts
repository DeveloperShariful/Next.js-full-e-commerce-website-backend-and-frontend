// File: app/actions/admin/settings/affiliate/_services/wallet-service.ts

"use server";

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { DecimalMath } from "@/lib/utils/decimal-math";
import { auditService } from "@/lib/services/audit-service";

// =========================================
// READ OPERATIONS
// =========================================
export async function getWalletBalance(userId: string) {
  const wallet = await db.wallet.findUnique({
      where: { userId },
      select: { balance: true }
  });
  return DecimalMath.toNumber(wallet?.balance || 0);
}

// =========================================
// INTERNAL LOGIC (Used by Payout Service)
// =========================================

export async function processStoreCreditPayout(
  payoutId: string, 
  userId: string, 
  amount: number | string | Prisma.Decimal
) {
  const creditAmount = DecimalMath.toDecimal(amount);

  if (DecimalMath.lte(creditAmount, 0)) {
      throw new Error("Invalid payout amount");
  }

  return await db.$transaction(async (tx) => {
    // 1. Ensure Wallet Exists
    let wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await tx.wallet.create({
        data: { userId, balance: new Prisma.Decimal(0) }
      });
    }

    // 2. Mark Payout Completed
    await tx.affiliatePayout.update({
      where: { id: payoutId },
      data: {
        status: "COMPLETED",
        processedAt: new Date(),
        method: "STORE_CREDIT",
        note: "Credited to Wallet automatically"
      }
    });

    // 3. Increment Wallet Balance
    await tx.wallet.update({
      where: { userId },
      data: {
        balance: { increment: creditAmount }
      }
    });

    // 4. Create Wallet Transaction Log
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: creditAmount,
        type: "SALE", 
        description: "Affiliate Payout Credit",
        reference: `PAYOUT-${payoutId}`
      }
    });

    // 5. Audit Log
    await auditService.log({
      userId: "SYSTEM",
      action: "UPDATE",
      entity: "Wallet",
      entityId: wallet.id,
      meta: { 
          type: "PAYOUT_CREDIT", 
          amount: creditAmount.toString(), 
          userId 
      }
    });

    return { success: true };
  });
}