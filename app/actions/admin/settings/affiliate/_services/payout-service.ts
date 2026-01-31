// File: app/actions/admin/settings/affiliate/_services/payout-service.ts

"use server";

import { db } from "@/lib/prisma";
import { PayoutQueueItem } from "../types";
import { PayoutStatus, Prisma } from "@prisma/client";
import { sendNotification } from "@/app/api/email/send-notification";
import { revalidatePath } from "next/cache";
import { auditService } from "@/lib/services/audit-service";
import { DecimalMath } from "@/lib/utils/decimal-math";
import { protectAction } from "../permission-service"; // ✅ Security

// =========================================
// READ OPERATIONS
// =========================================

export async function getPayouts(page: number = 1, limit: number = 20, status?: PayoutStatus) {
  await protectAction("MANAGE_FINANCE");

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
    paypalEmail: p.affiliate.paypalEmail,
    riskScore: p.affiliate.riskScore
  }));

  return { items, total, totalPages: Math.ceil(total / limit) };
}

// =========================================
// INTERNAL WALLET LOGIC (Merged)
// =========================================

async function processStoreCreditPayout(
  payoutId: string, 
  userId: string, 
  amount: number | string | Prisma.Decimal,
  actorId: string
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
      userId: actorId,
      action: "WALLET_CREDIT",
      entity: "Wallet",
      entityId: wallet.id,
      meta: { type: "PAYOUT", amount: creditAmount.toString(), userId }
    });

    return { success: true };
  });
}

// Exposed for other modules if needed
export async function getWalletBalance(userId: string) {
  // Can be called by admin or user, so basic check logic inside if needed
  const wallet = await db.wallet.findUnique({
      where: { userId },
      select: { balance: true }
  });
  return DecimalMath.toNumber(wallet?.balance || 0);
}

// =========================================
// WRITE OPERATIONS (Payout Actions)
// =========================================

export async function markAsPaid(payoutId: string, transactionId?: string, note?: string) {
  const actor = await protectAction("MANAGE_FINANCE");

  const payout = await db.affiliatePayout.findUnique({ 
      where: { id: payoutId },
      include: { affiliate: { include: { user: true } } } 
  });
  
  if (!payout) throw new Error("Payout not found");
  if (payout.status === "COMPLETED") throw new Error("Payout is already completed.");

  // Fraud Check
  if (payout.affiliate.riskScore > 70) {
      throw new Error(`Blocked: Risk Score ${payout.affiliate.riskScore}/100 too high.`);
  }

  if (payout.method === "STORE_CREDIT") {
      // ✅ Use Internal Wallet Logic
      await processStoreCreditPayout(
          payout.id, 
          payout.affiliate.userId, 
          DecimalMath.toNumber(payout.amount),
          actor.id
      );
  } else {
      // Manual/External Payment
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

  await auditService.log({
      userId: actor.id,
      action: "PAYOUT_COMPLETED",
      entity: "AffiliatePayout",
      entityId: payoutId,
      meta: { amount: payout.amount.toString(), method: payout.method }
  });

  await sendNotification({
      trigger: "PAYOUT_PROCESSED",
      recipient: payout.affiliate.user.email,
      data: {
          affiliate_name: payout.affiliate.user.name,
          payout_amount: payout.amount.toString(),
          transaction_id: transactionId || "WALLET_CREDIT"
      },
      userId: payout.affiliate.userId
  });
  
  revalidatePath("/admin/settings/affiliate/payouts");
  return { success: true };
}

export async function rejectPayout(payoutId: string, reason: string) {
  const actor = await protectAction("MANAGE_FINANCE");

  const payout = await db.affiliatePayout.findUnique({ 
    where: { id: payoutId },
    include: { affiliate: { include: { user: true } } } 
  });
  
  if (!payout) throw new Error("Payout not found");
  if (payout.status !== "PENDING") throw new Error("Can only reject pending payouts");

  await db.$transaction(async (tx) => {
    // 1. Mark Cancelled
    await tx.affiliatePayout.update({ 
        where: { id: payoutId }, 
        data: { status: "CANCELLED", note: reason } 
    });
    
    // 2. Refund Balance to Affiliate Account
    await tx.affiliateAccount.update({ 
        where: { id: payout.affiliateId }, 
        data: { balance: { increment: payout.amount } } 
    });
    
    // 3. Ledger Entry
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

  await auditService.log({
      userId: actor.id,
      action: "PAYOUT_REJECTED",
      entity: "AffiliatePayout",
      entityId: payoutId,
      meta: { reason }
  });

  await sendNotification({
      trigger: "PAYOUT_REJECTED",
      recipient: payout.affiliate.user.email,
      data: { affiliate_name: payout.affiliate.user.name, payout_amount: payout.amount.toString(), rejection_reason: reason },
      userId: payout.affiliate.userId
  });

  revalidatePath("/admin/settings/affiliate/payouts");
  return { success: true };
}

export async function getInvoiceData(payoutId: string) {
  const payout = await db.affiliatePayout.findUnique({
    where: { id: payoutId },
    include: {
      affiliate: {
        include: {
          user: { select: { name: true, email: true, addresses: true } }
        }
      }
    }
  });

  if (!payout) throw new Error("Payout not found");

  const settings = await db.storeSettings.findUnique({ where: { id: "settings" } });

  // Return clean JSON for Client Component to render PDF
  return {
    invoiceNo: `INV-${payout.id.substring(0, 8).toUpperCase()}`,
    date: payout.createdAt.toISOString().split("T")[0],
    storeName: settings?.storeName || "GoBike Store",
    affiliateName: payout.affiliate.user.name,
    affiliateEmail: payout.affiliate.user.email,
    amount: payout.amount.toNumber(),
    method: payout.method,
    status: payout.status,
    items: [
        { description: "Affiliate Commission Payout", amount: payout.amount.toNumber() }
    ]
  };
}