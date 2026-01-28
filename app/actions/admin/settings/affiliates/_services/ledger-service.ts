// File: app/actions/admin/settings/affiliate/_services/ledger-service.ts

"use server";

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { DecimalMath } from "@/lib/utils/decimal-math";
import { auditService } from "@/lib/services/audit-service";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "../types";
import { syncUser } from "@/lib/auth-sync";

// =========================================
// READ OPERATIONS
// =========================================
export async function getLedgerHistory(page: number = 1, limit: number = 20, type?: string) {
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
}

export async function getAffiliateLedger(affiliateId: string) {
  return await db.affiliateLedger.findMany({
      where: { affiliateId },
      orderBy: { createdAt: "desc" }
  });
}

// =========================================
// SERVER ACTIONS (Mutations)
// =========================================

export async function createAdjustmentAction(affiliateId: string, amount: number, note: string, type: "BONUS" | "ADJUSTMENT"): Promise<ActionResponse> {
  try {
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) return { success: false, message: "Unauthorized" };

    if (!amount || amount <= 0) return { success: false, message: "Amount must be greater than 0" };
    if (!note) return { success: false, message: "Reason/Note is required" };

    const adjustAmount = DecimalMath.toDecimal(amount);

    await db.$transaction(async (tx) => {
        // 1. Lock & Fetch Affiliate
        const affiliate = await tx.affiliateAccount.findUnique({ where: { id: affiliateId } });
        if (!affiliate) throw new Error("Affiliate not found");

        const currentBalance = affiliate.balance;
        
        const newBalance = DecimalMath.add(currentBalance, adjustAmount);

        // Prevent negative balance
        if (DecimalMath.lt(newBalance, 0)) {
            throw new Error("Insufficient balance for this deduction.");
        }

        // 2. Update Balance
        await tx.affiliateAccount.update({
            where: { id: affiliateId },
            data: { balance: newBalance }
        });

        // 3. Create Ledger Record
        await tx.affiliateLedger.create({
            data: {
                affiliateId,
                type: type,
                amount: adjustAmount,
                balanceBefore: currentBalance,
                balanceAfter: newBalance,
                description: note,
                referenceId: `MANUAL-${auth.id}-${Date.now()}`
            }
        });

        await auditService.log({
            userId: auth.id,
            action: "MANUAL_ADJUSTMENT",
            entity: "AffiliateAccount",
            entityId: affiliateId,
            meta: { 
                type, 
                amount: adjustAmount.toString(), 
                reason: note,
                newBalance: newBalance.toString()
            }
        });
    });

    revalidatePath("/admin/settings/affiliate/wallet");
    return { success: true, message: "Adjustment applied successfully." };

  } catch (error: any) {
    return { success: false, message: error.message };
  }
}