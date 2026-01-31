//app/actions/storefront/affiliates/mutations/request-payout.ts

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";
import { PayoutMethod } from "@prisma/client";
import { AffiliateConfigDTO } from "@/app/actions/admin/settings/affiliate/types";

const payoutSchema = z.object({
  userId: z.string(),
  amount: z.coerce.number().min(1, "Amount must be positive"),
  method: z.nativeEnum(PayoutMethod),
  note: z.string().optional(),
});

type PayoutInput = z.infer<typeof payoutSchema>;

export async function requestPayoutAction(data: PayoutInput) {
  try {
    // 1. Validate Input
    const result = payoutSchema.safeParse(data);
    if (!result.success) {
      return { success: false, message: result.error.issues[0].message };
    }

    const { userId, amount, method, note } = result.data;

    // 2. Fetch Account & Global Settings
    const [affiliate, settings] = await Promise.all([
      db.affiliateAccount.findUnique({ where: { userId } }),
      db.storeSettings.findUnique({ where: { id: "settings" } })
    ]);

    if (!affiliate) return { success: false, message: "Account not found." };

    // ✅ DYNAMIC: কনফিগ থেকে মিনিমাম এমাউন্ট নেওয়া
    const config = (settings?.affiliateConfig as AffiliateConfigDTO) || {};
    const minPayout = Number(config.minimumPayout) || 50; // Fallback if missing
    const currency = settings?.currencySymbol || "$";

    // 3. Validation Rules
    if (amount < minPayout) {
      return { 
        success: false, 
        message: `Minimum withdrawal amount is ${currency}${minPayout}` 
      };
    }

    const currentBalance = affiliate.balance.toNumber();
    if (currentBalance < amount) {
      return { 
        success: false, 
        message: `Insufficient balance. Available: ${currency}${currentBalance}` 
      };
    }

    // Check Payment Details Presence
    if (method === "PAYPAL" && !affiliate.paypalEmail) {
      return { success: false, message: "Please set your PayPal email in Settings first." };
    }
    if (method === "BANK_TRANSFER" && !affiliate.bankDetails) {
      return { success: false, message: "Please set your Bank Details in Settings first." };
    }

    // 4. EXECUTE TRANSACTION (Atomic)
    await db.$transaction(async (tx) => {
      // A. Deduct Balance
      const updatedAffiliate = await tx.affiliateAccount.update({
        where: { id: affiliate.id },
        data: { balance: { decrement: amount } }
      });

      // B. Create Payout Request
      const payout = await tx.affiliatePayout.create({
        data: {
          affiliateId: affiliate.id,
          amount,
          method,
          status: "PENDING",
          note
        }
      });

      // C. Log to Ledger
      await tx.affiliateLedger.create({
        data: {
          affiliateId: affiliate.id,
          type: "PAYOUT",
          amount: amount,
          balanceBefore: currentBalance,
          balanceAfter: updatedAffiliate.balance.toNumber(),
          referenceId: payout.id,
          description: `Withdrawal Request (${method.replace("_", " ")})`
        }
      });
    });

    revalidatePath("/affiliates/finance/payouts");
    return { success: true, message: "Withdrawal request submitted successfully." };

  } catch (error: any) {
    console.error("Payout Request Error:", error);
    return { success: false, message: "Failed to process request." };
  }
}