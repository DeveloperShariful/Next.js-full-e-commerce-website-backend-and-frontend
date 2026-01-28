// File: app/actions/admin/settings/affiliates/_services/payout-service.ts

"use server";

import { db } from "@/lib/prisma";
import { PayoutQueueItem } from "../types";
import { PayoutStatus, Prisma } from "@prisma/client";
import { sendNotification } from "@/app/api/email/send-notification";
// ✅ Correctly importing named export from wallet service (defined below in this batch)
import { processStoreCreditPayout } from "@/app/actions/admin/settings/affiliates/_services/wallet-service";
import { revalidatePath } from "next/cache";
import { auditService } from "@/lib/services/audit-service";
import { DecimalMath } from "@/lib/utils/decimal-math";

// =========================================
// READ OPERATIONS
// =========================================
export async function getPayouts(page: number = 1, limit: number = 20, status?: PayoutStatus) {
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
    amount: DecimalMath.toNumber(p.amount),
    method: p.method,
    status: p.status,
    requestedAt: p.createdAt,
    bankDetails: p.affiliate.bankDetails,
    paypalEmail: p.affiliate.paypalEmail
  }));

  return { items, total, totalPages: Math.ceil(total / limit) };
}

// =========================================
// SERVER ACTIONS (Mutations)
// =========================================

export async function markAsPaid(payoutId: string, transactionId?: string, note?: string) {
  const payout = await db.affiliatePayout.findUnique({ 
      where: { id: payoutId },
      include: { affiliate: { include: { user: true } } } 
  });
  
  if (!payout) throw new Error("Payout not found");
  if (payout.status === "COMPLETED") throw new Error("Payout is already completed.");

  if (payout.method === "STORE_CREDIT") {
      // ✅ Using the named export directly
      await processStoreCreditPayout(
          payout.id, 
          payout.affiliate.userId, 
          DecimalMath.toNumber(payout.amount)
      );
  } else {
      await db.affiliatePayout.update({
          where: { id: payoutId },
          data: {
              status: "COMPLETED",
              transactionId,
              note,
              processedAt: new Date()
          }
      });
  }

  revalidatePath("/admin/settings/affiliate/payouts", "page");

  await auditService.log({
      action: "PROCESS",
      entity: "AffiliatePayout",
      entityId: payoutId,
      newData: { status: "COMPLETED", transactionId },
      meta: { amount: payout.amount.toString() }
  });

  await sendNotification({
      trigger: "PAYOUT_PROCESSED",
      recipient: payout.affiliate.user.email,
      data: {
          affiliate_name: payout.affiliate.user.name,
          payout_amount: payout.amount.toString(),
          transaction_id: transactionId || (payout.method === "STORE_CREDIT" ? "WALLET_CREDIT" : "N/A")
      },
      userId: payout.affiliate.userId
  });
  
  return { success: true };
}

export async function rejectPayout(payoutId: string, reason: string) {
  const payout = await db.affiliatePayout.findUnique({ 
    where: { id: payoutId },
    include: { affiliate: { include: { user: true } } } 
  });
  
  if (!payout) throw new Error("Payout not found");
  if (payout.status !== "PENDING") throw new Error("Can only reject pending payouts");

  await db.$transaction(async (tx) => {
    await tx.affiliatePayout.update({ where: { id: payoutId }, data: { status: "CANCELLED", note: reason } });
    
    // Refund balance
    await tx.affiliateAccount.update({ 
        where: { id: payout.affiliateId }, 
        data: { balance: { increment: payout.amount } } 
    });
    
    await tx.affiliateLedger.create({
      data: {
        affiliateId: payout.affiliateId,
        type: "REFUND_DEDUCTION", 
        amount: payout.amount,
        balanceBefore: payout.affiliate.balance,
        balanceAfter: DecimalMath.add(payout.affiliate.balance, payout.amount),
        description: `Payout Rejected: ${reason}`,
        referenceId: payout.id
      }
    });
  });

  revalidatePath("/admin/settings/affiliate/payouts", "page");

  await auditService.log({
      action: "REJECT",
      entity: "AffiliatePayout",
      entityId: payoutId,
      meta: { reason, refundAmount: payout.amount.toString() }
  });

  await sendNotification({
      trigger: "PAYOUT_REJECTED",
      recipient: payout.affiliate.user.email,
      data: { affiliate_name: payout.affiliate.user.name, payout_amount: payout.amount.toString(), rejection_reason: reason },
      userId: payout.affiliate.userId
  });

  return { success: true };
}