//File: app/actions/admin/settings/affiliates/mutations/manage-announcements.ts

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { announcementService } from "../_services/announcement-service";
import { ActionResponse } from "../types";
import { syncUser } from "@/lib/auth-sync";

const announcementSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(5),
  type: z.enum(["INFO", "WARNING", "SUCCESS"]),
  isActive: z.boolean().default(true),
  groupIds: z.array(z.string()).optional(),
  tierIds: z.array(z.string()).optional(),
});

export async function createAnnouncementAction(data: z.infer<typeof announcementSchema>): Promise<ActionResponse> {
  try {
    const user = await syncUser();
    if (!user || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(user.role)) {
        return { success: false, message: "Unauthorized." };
    }

    const result = announcementSchema.safeParse(data);
    if (!result.success) {
      return { success: false, message: "Validation failed." };
    }

    await announcementService.createAnnouncement(result.data);

    revalidatePath("/admin/settings/affiliate/announcements");
    return { success: true, message: "Announcement published." };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to create." };
  }
}

export async function deleteAnnouncementAction(id: string): Promise<ActionResponse> {
  try {
    const user = await syncUser();
    if (!user || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(user.role)) {
        return { success: false, message: "Unauthorized." };
    }

    await announcementService.deleteAnnouncement(id);
    
    revalidatePath("/admin/settings/affiliate/announcements");
    return { success: true, message: "Deleted successfully." };
  } catch (error: any) {
    return { success: false, message: "Failed to delete." };
  }
}

export async function toggleAnnouncementStatusAction(id: string, isActive: boolean): Promise<ActionResponse> {
  try {
    const user = await syncUser();
    if (!user || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(user.role)) {
        return { success: false, message: "Unauthorized." };
    }

    await announcementService.toggleStatus(id, isActive);
    
    revalidatePath("/admin/settings/affiliate/announcements");
    return { success: true, message: "Status updated." };
  } catch (error: any) {
    return { success: false, message: "Update failed." };
  }
}