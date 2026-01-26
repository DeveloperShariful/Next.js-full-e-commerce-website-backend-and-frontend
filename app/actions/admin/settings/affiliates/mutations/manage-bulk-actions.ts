//File: app/actions/admin/settings/affiliates/mutations/manage-bulk-actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { accountService } from "../_services/account-service";
import { ActionResponse } from "../types";
import { AffiliateStatus } from "@prisma/client";
import { syncUser } from "@/lib/auth-sync";

/**
 * Handle Bulk Status Update (Approve/Reject)
 */
export async function bulkStatusAction(ids: string[], status: AffiliateStatus): Promise<ActionResponse> {
  try {
    const user = await syncUser();
    if (!user || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(user.role)) return { success: false, message: "Unauthorized" };

    if (!ids.length) return { success: false, message: "No items selected" };

    await accountService.bulkUpdateStatus(ids, status);
    
    revalidatePath("/admin/settings/affiliate/users");
    return { success: true, message: `${ids.length} affiliates updated to ${status}.` };
  } catch (error: any) {
    return { success: false, message: "Bulk update failed." };
  }
}

/**
 * Handle Bulk Group Assignment
 */
export async function bulkGroupAction(ids: string[], groupId: string): Promise<ActionResponse> {
  try {
    const user = await syncUser();
    if (!user || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(user.role)) return { success: false, message: "Unauthorized" };

    await accountService.bulkAssignGroup(ids, groupId);

    revalidatePath("/admin/settings/affiliate/users");
    return { success: true, message: "Group assigned successfully." };
  } catch (error: any) {
    return { success: false, message: "Bulk group assignment failed." };
  }
}

/**
 * Handle Bulk Tag Assignment
 */
export async function bulkTagAction(ids: string[], tagId: string): Promise<ActionResponse> {
  try {
    const user = await syncUser();
    if (!user || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(user.role)) return { success: false, message: "Unauthorized" };

    await accountService.bulkAssignTag(ids, tagId);

    revalidatePath("/admin/settings/affiliate/users");
    return { success: true, message: "Tag added to selected users." };
  } catch (error: any) {
    return { success: false, message: "Bulk tagging failed." };
  }
}

/**
 * Handle Bulk Delete
 * (Note: Prisma usually prevents delete if relations exist, might need soft delete logic)
 */
export async function bulkDeleteAction(ids: string[]): Promise<ActionResponse> {
  try {
    const user = await syncUser();
    if (!user || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(user.role)) return { success: false, message: "Unauthorized" };

    // Here we map to "REJECTED" or specific delete logic
    // For safety in this demo, we set status to REJECTED instead of hard delete
    await accountService.bulkUpdateStatus(ids, "REJECTED");

    revalidatePath("/admin/settings/affiliate/users");
    return { success: true, message: "Selected users marked as Rejected." };
  } catch (error: any) {
    return { success: false, message: "Bulk delete failed." };
  }
}