// File: app/actions/backend/affiliate/_services/ledger-service.ts

"use server";

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { DecimalMath } from "@/lib/decimal-math";
import { auditService } from "@/lib/audit-service";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "../types";
import { protectAction } from "../permission-service";

// =========================================
// READ OPERATIONS (Re-mapped to WalletTransaction)
// =========================================
export async function getLedgerHistory(page: number = 1, limit: number = 20, type?: string) {
  await protectAction("MANAGE_FINANCE");
  const skip = (page - 1) * limit;
  
  // ✅ FIXED: Mapping to WalletTransaction types for affiliates
  const affiliateTypes = ["AFFILIATE_COMMISSION", "MLM_BONUS", "PAYOUT_DEDUCTION", "ADJUSTMENT"];
  const typeFilter = type ? [type] : affiliateTypes;

  const where: Prisma.WalletTransactionWhereInput = {
    type: { in: typeFilter as any }
  };

  const [total, data] = await Promise.all([
    db.walletTransaction.count({ where }),
    db.walletTransaction.findMany({
      where,
      take: limit,
      skip,
      orderBy: { createdAt: "desc" },
      include: {
        wallet: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                affiliateAccount: { select: { slug: true, id: true } }
              }
            }
          }
        }
      }
    })
  ]);

  // ✅ FIXED: Format data to match exactly what the UI expected from AffiliateLedger
  const transactions = data.map(tx => {
    // We safely extract balanceBefore and balanceAfter from the reference string
    const refParts = tx.reference?.split('|') || [];
    const originalReference = refParts[0] || tx.reference;
    const balanceBefore = refParts[1] ? Number(refParts[1]) : 0;
    const balanceAfter = refParts[2] ? Number(refParts[2]) : 0;

    return {
      id: tx.id,
      affiliateId: tx.wallet.user.affiliateAccount?.id,
      type: tx.type,
      amount: DecimalMath.toNumber(tx.amount),
      balanceBefore,
      balanceAfter,
      description: tx.description,
      referenceId: originalReference,
      createdAt: tx.createdAt,
      affiliate: tx.wallet.user.affiliateAccount ? {
        slug: tx.wallet.user.affiliateAccount.slug,
        user: { name: tx.wallet.user.name, email: tx.wallet.user.email }
      } : null
    };
  });

  return { 
    transactions, 
    total, 
    totalPages: Math.ceil(total / limit) 
  };
}

export async function getAffiliateLedger(affiliateId: string) {
  await protectAction("MANAGE_FINANCE");
  
  const affiliate = await db.affiliateAccount.findUnique({
    where: { id: affiliateId },
    select: { userId: true }
  });

  if (!affiliate) return [];

  const data = await db.walletTransaction.findMany({
      where: { 
        wallet: { userId: affiliate.userId },
        type: { in: ["AFFILIATE_COMMISSION", "MLM_BONUS", "PAYOUT_DEDUCTION", "ADJUSTMENT"] }
      },
      orderBy: { createdAt: "desc" }
  });

  return data.map(tx => {
    const refParts = tx.reference?.split('|') || [];
    return {
      id: tx.id,
      affiliateId: affiliateId,
      type: tx.type,
      amount: DecimalMath.toNumber(tx.amount),
      balanceBefore: refParts[1] ? Number(refParts[1]) : 0,
      balanceAfter: refParts[2] ? Number(refParts[2]) : 0,
      description: tx.description,
      referenceId: refParts[0] || tx.reference,
      createdAt: tx.createdAt,
    };
  });
}

// =========================================
// WRITE OPERATIONS (Transactional)
// =========================================

export async function createAdjustmentAction(
  affiliateId: string, 
  amount: number, 
  note: string, 
  type: "BONUS" | "ADJUSTMENT"
): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_FINANCE");
    if (!amount || amount <= 0) return { success: false, message: "Amount must be greater than 0" };
    if (!note) return { success: false, message: "Reason/Note is required" };
    const adjustAmount = DecimalMath.toDecimal(amount);

    await db.$transaction(async (tx) => {
        const affiliate = await tx.affiliateAccount.findFirst({ 
            where: { id: affiliateId, deletedAt: null },
            select: { id: true, balance: true, userId: true } 
        });       
        if (!affiliate) throw new Error("Affiliate not found or deleted");
        
        let updatedAffiliate;

        if (type === "BONUS") {
            updatedAffiliate = await tx.affiliateAccount.update({
                where: { id: affiliateId },
                data: { 
                    balance: { increment: adjustAmount },
                    totalEarnings: { increment: adjustAmount } 
                },
                select: { balance: true }
            });
        } else {
            updatedAffiliate = await tx.affiliateAccount.update({
                where: { id: affiliateId },
                data: { 
                    balance: { decrement: adjustAmount }
                },
                select: { balance: true }
            });
        }

        const balanceAfter = updatedAffiliate.balance;
        const balanceBefore = type === "BONUS" ? DecimalMath.sub(balanceAfter, adjustAmount) : DecimalMath.add(balanceAfter, adjustAmount);
        
        // Ensure user has a wallet
        const userWallet = await tx.wallet.upsert({
          where: { userId: affiliate.userId },
          create: { userId: affiliate.userId, balance: 0 },
          update: {}
        });

        // ✅ FIXED: Store balanceBefore and balanceAfter in the reference string to preserve exact feature!
        const referenceString = `MANUAL-${actor.id}-${Date.now()}|${balanceBefore.toString()}|${balanceAfter.toString()}`;

        await tx.walletTransaction.create({
            data: {
                walletId: userWallet.id,
                type: type === "BONUS" ? "MLM_BONUS" : "ADJUSTMENT", 
                amount: adjustAmount,
                description: note,
                reference: referenceString 
            }
        });

        await auditService.log({
            userId: actor.id,
            action: "MANUAL_ADJUSTMENT",
            entity: "AffiliateAccount",
            entityId: affiliateId,
            meta: { type, amount: adjustAmount.toString(), reason: note }
        });
    });

    revalidatePath("/admin/affiliate/ledger");
    return { success: true, message: "Adjustment applied successfully." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}