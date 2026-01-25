//app/actions/admin/settings/affiliate/mutations/manage-campaigns.ts

"use server";

import { revalidatePath } from "next/cache";
import { campaignService } from "../_services/campaign-service";
import { ActionResponse } from "../types";

/**
 * SERVER ACTION: Delete Campaign
 * Used by Admin to remove spammy or inappropriate campaigns.
 */
export async function deleteCampaignAction(id: string): Promise<ActionResponse> {
  try {
    if (!id) return { success: false, message: "Campaign ID is required." };

    await campaignService.deleteCampaign(id);
    
    revalidatePath("/admin/settings/affiliate/campaigns");
    return { success: true, message: "Campaign deleted successfully." };
  } catch (error: any) {
    console.error("Delete Campaign Error:", error);
    return { success: false, message: "Failed to delete campaign." };
  }
}