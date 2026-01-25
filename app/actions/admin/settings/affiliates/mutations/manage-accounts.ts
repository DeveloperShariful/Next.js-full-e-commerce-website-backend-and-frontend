// File: app/actions/admin/settings/affiliates/mutations/manage-accounts.ts

"use server";

import { revalidatePath } from "next/cache";
import { accountService } from "../_services/account-service";
import { ActionResponse } from "../types";

/**
 * SERVER ACTIONS: Affiliate Account Management
 * Handles Approvals, Rejections, and Tier changes from the UI.
 */

/**
 * Approve Affiliate
 */
export async function approveAffiliateAction(id: string): Promise<ActionResponse> {
  try {
    if (!id) return { success: false, message: "ID is required" };

    await accountService.approveAffiliate(id);
    
    // Revalidate List & Notifications
    revalidatePath("/admin/settings/affiliates/users");
    revalidatePath("/admin/marketing/affiliates"); // Dashboard
    
    return { success: true, message: "Affiliate approved successfully." };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to approve affiliate." };
  }
}

/**
 * Reject Affiliate
 */
export async function rejectAffiliateAction(id: string, reason: string): Promise<ActionResponse> {
  try {
    if (!id || !reason) return { success: false, message: "ID and reason are required" };

    await accountService.rejectAffiliate(id, reason);
    
    revalidatePath("/admin/settings/affiliates/users");
    
    return { success: true, message: "Affiliate rejected." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Update Affiliate Tier manually
 */
export async function updateAffiliateTierAction(id: string, tierId: string): Promise<ActionResponse> {
  try {
    await accountService.approveAffiliate(id, tierId); // Reusing update logic
    
    revalidatePath(`/admin/settings/affiliates/users/${id}`);
    revalidatePath("/admin/settings/affiliates/users");
    
    return { success: true, message: "Tier updated successfully." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}