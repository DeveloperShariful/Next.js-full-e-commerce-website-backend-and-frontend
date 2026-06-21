// app/actions/storefront/affiliates/_services/finance-service.ts

"use server";

import { db } from "@/lib/prisma";
import { AffiliateConfigDTO } from "@/app/actions/backend/affiliate/types";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { PayoutMethod, Prisma } from "@prisma/client";
import { getAuthAffiliate } from "../auth-helper";
import { DecimalMath } from "@/lib/decimal-math";

// ==========================================
// 1. VALIDATION SCHEMAS
// ==========================================
const payoutSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be positive"),
  method: z.nativeEnum(PayoutMethod),
});

type PayoutInput = z.infer<typeof payoutSchema>;

// ==========================================
// 2. READ SERVICES
// ==========================================

export async function getWalletData(affiliateId: string) {
  const account = await db.affiliateAccount.findUnique({
    where: { id: affiliateId },
    select: { balance: true, totalEarnings: true, bankDetails: true, paypalEmail: true }
  });

  if (!account) throw new Error("Affiliate account not found.");

  const settings = await db.storeSettings.findUnique({ where: { id: "settings" } });
  
  // ✅ FIXED: Safe JSON casting without 'any'
  const config = (settings?.affiliateConfig as unknown as AffiliateConfigDTO) || {};

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
}

export async function getPayoutHistory(affiliateId: string) {
  const history = await db.affiliatePayout.findMany({
    where: { affiliateId },
    orderBy: { createdAt: "desc" }
  });

  // Convert Decimals to numbers for client safety
  return history.map(p => ({
    ...p,
    amount: p.amount.toNumber()
  }));
}

export async function getLedger(affiliateId: string, limit: number = 50) {
  // ✅ FIXED: Replaced deleted AffiliateLedger with WalletTransaction mapping
  const affiliate = await db.affiliateAccount.findUnique({
    where: { id: affiliateId },
    select: { userId: true }
  });

  if (!affiliate) return [];

  const ledger = await db.walletTransaction.findMany({
    where: { 
        wallet: { userId: affiliate.userId },
        type: { in: ["AFFILIATE_COMMISSION", "AFFILIATE_PAYOUT", "PAYOUT_DEDUCTION", "ADJUSTMENT"] }
    },
    orderBy: { createdAt: "desc" },
    take: limit
  });

  // Map WalletTransaction data perfectly to the UI expectations
  return ledger.map(l => {
    const refParts = l.reference?.split('|') || [];
    return {
      id: l.id,
      affiliateId: affiliateId,
      type: l.type,
      description: l.description,
      createdAt: l.createdAt,
      referenceId: refParts[0] || l.reference,
      amount: l.amount.toNumber(),
      balanceBefore: refParts[1] ? Number(refParts[1]) : 0,
      balanceAfter: refParts[2] ? Number(refParts[2]) : 0
    };
  });
}

// ==========================================
// 3. MUTATIONS (Server Actions with Logs)
// ==========================================

export async function requestPayoutAction(data: PayoutInput) {
  console.log("🚀 [Payout] Request Started...");

  try {
    // 1. Authenticate User (Secure Session)
    const affiliate = await getAuthAffiliate();
    console.log(`👤 [Payout] User Identified: ${affiliate.user.email} (ID: ${affiliate.id})`);

    // 2. Validate Input
    const result = payoutSchema.safeParse(data);
    if (!result.success) {
      const errorMsg = result.error.issues[0].message;
      console.log(`❌ [Payout] Validation Failed: ${errorMsg}`);
      return { success: false, message: errorMsg };
    }

    const { amount, method } = result.data;
    console.log(`💰 [Payout] Amount: ${amount}, Method: ${method}`);

    // 3. Fetch Settings
    const settings = await db.storeSettings.findUnique({ where: { id: "settings" } });
    const config = (settings?.affiliateConfig as unknown as AffiliateConfigDTO) || {};
    const minPayout = Number(config.minimumPayout) || 50;
    const currency = settings?.currencySymbol || "$";

    // 4. Logic Checks
    if (amount < minPayout) {
      console.log(`❌ [Payout] Failed: Amount (${amount}) less than min (${minPayout})`);
      return { success: false, message: `Minimum withdrawal amount is ${currency}${minPayout}` };
    }

    const currentBalance = Number(affiliate.balance);

    if (currentBalance < amount) {
      console.log(`❌ [Payout] Failed: Insufficient Balance. Has: ${currentBalance}, Needs: ${amount}`);
      return { success: false, message: `Insufficient balance.` };
    }

    if (affiliate.status !== "ACTIVE") {
       console.log(`❌ [Payout] Failed: Status ${affiliate.status}`);
       return { success: false, message: "Account not active." };
    }

    const existingPending = await db.affiliatePayout.findFirst({
        where: { affiliateId: affiliate.id, status: "PENDING" }
    });
    
    if (existingPending) {
        console.log(`❌ [Payout] Failed: Pending request exists`);
        return { success: false, message: "You already have a pending withdrawal request." };
    }

    if (method === "PAYPAL" && !affiliate.paypalEmail) {
      console.log(`❌ [Payout] Failed: Missing PayPal Email`);
      return { success: false, message: "Please set your PayPal email in Settings first." };
    }
    
    if (method === "BANK_TRANSFER") {
        const hasBankInfo = affiliate.bankDetails && 
            (typeof affiliate.bankDetails === 'string' 
                ? affiliate.bankDetails.length > 5 
                : Object.keys(affiliate.bankDetails as object).length > 0);
        
        if (!hasBankInfo) {
            console.log(`❌ [Payout] Failed: Missing Bank Details`);
            return { success: false, message: "Please set your Bank Details in Settings first." };
        }
    }

    // 5. Execute Transaction
    console.log("🔄 [Payout] Processing Transaction...");
    
    await db.$transaction(async (tx) => {
      // ✅ Deduct Balance from Affiliate
      const updatedAffiliate = await tx.affiliateAccount.update({
        where: { id: affiliate.id },
        data: { balance: { decrement: amount } }
      });

      // ✅ Create Payout Request
      const payout = await tx.affiliatePayout.create({
        data: {
          affiliateId: affiliate.id,
          amount,
          method,
          status: "PENDING",
        }
      });

      // ✅ FIXED: Replaced deleted AffiliateLedger with WalletTransaction mapping
      const userWallet = await tx.wallet.upsert({
          where: { userId: affiliate.userId },
          create: { userId: affiliate.userId, balance: 0 },
          update: {}
      });

      const balanceAfter = updatedAffiliate.balance.toNumber();
      // Format: ID|Before|After
      const referenceString = `${payout.id}|${currentBalance.toString()}|${balanceAfter.toString()}`;

      await tx.walletTransaction.create({
        data: {
          walletId: userWallet.id,
          type: "PAYOUT_DEDUCTION",
          amount: amount,
          reference: referenceString,
          description: `Withdrawal Request (${method.replace("_", " ")})`
        }
      });
    });

    console.log("✅ [Payout] Success!");
    revalidatePath("/affiliates/finance/payouts");
    
    return { success: true, message: "Withdrawal request submitted successfully!" };

  } catch (error: any) {
    console.error("🔥 [Payout] Server Error:", error);
    return { success: false, message: "Internal server error. Please try again later." };
  }
}