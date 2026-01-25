//app/actions/admin/settings/affiliate/mutations/manage-pixels.ts

"use server";

import { revalidatePath } from "next/cache";
import { pixelService } from "../_services/pixel-service";
import { ActionResponse } from "../types";

/**
 * SERVER ACTION: Toggle Pixel Status
 */
export async function togglePixelStatusAction(id: string, isEnabled: boolean): Promise<ActionResponse> {
  try {
    await pixelService.togglePixelStatus(id, isEnabled);
    revalidatePath("/admin/settings/affiliate/pixels");
    return { success: true, message: `Pixel ${isEnabled ? "enabled" : "disabled"} successfully.` };
  } catch (error: any) {
    return { success: false, message: "Failed to update pixel status." };
  }
}

/**
 * SERVER ACTION: Delete Pixel
 */
export async function deletePixelAction(id: string): Promise<ActionResponse> {
  try {
    await pixelService.deletePixel(id);
    revalidatePath("/admin/settings/affiliate/pixels");
    return { success: true, message: "Pixel deleted successfully." };
  } catch (error: any) {
    return { success: false, message: "Failed to delete pixel." };
  }
}