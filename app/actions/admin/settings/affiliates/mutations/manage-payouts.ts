// File: app/actions/admin/settings/affiliates/mutations/manage-payouts.ts

"use server";

import { revalidatePath } from "next/cache";
import { payoutService } from "../_services/payout-service";
import { ActionResponse } from "../types";

/**
 * SERVER ACTIONS: Payout Management
 * Handles Financial Transactions confirmations.
 */

/**
 * Approve & Mark Payout as Paid
 */
export async function approvePayoutAction(
  payoutId: string, 
  transactionId: string, 
  note?: string
): Promise<ActionResponse> {
  try {
    if (!payoutId) {
       return { success: false, message: "Payout ID is required." };
    }
    // Transaction ID is optional but recommended for audit
    if (!transactionId) {
      // In some cases (Cash), might not have one, but for system integrity we usually require it.
      // return { success: false, message: "Transaction ID is required." };
    }

    await payoutService.markAsPaid(payoutId, transactionId, note);
    
    // Refresh Payout List & Dashboard Stats
    revalidatePath("/admin/settings/affiliates/payouts");
    revalidatePath("/admin/settings/affiliates"); 
    
    return { success: true, message: "Payout marked as completed." };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to process payout." };
  }
}

/**
 * Reject Payout (Refunds Balance)
 */
export async function rejectPayoutAction(
  payoutId: string, 
  reason: string
): Promise<ActionResponse> {
  try {
    if (!payoutId || !reason) {
      return { success: false, message: "Payout ID and rejection reason are required." };
    }

    await payoutService.rejectPayout(payoutId, reason);
    
    revalidatePath("/admin/settings/affiliates/payouts");
    revalidatePath("/admin/settings/affiliates");

    return { success: true, message: "Payout rejected and balance refunded." };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to reject payout." };
  }
}