// File: app/actions/admin/settings/affiliate/_services/announcement-service.ts

// ✅ 1. Top-level directive required for Server Actions
"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auditService } from "@/lib/services/audit-service";
import { ActionResponse } from "../types";
import { syncUser } from "@/lib/auth-sync";
import { z } from "zod";

const announcementSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(5),
  type: z.enum(["INFO", "WARNING", "SUCCESS"]),
  isActive: z.boolean().default(true),
  groupIds: z.array(z.string()).optional(),
  tierIds: z.array(z.string()).optional(),
  startsAt: z.date().optional(),
  expiresAt: z.date().optional().nullable(),
});

// =========================================
// READ OPERATIONS
// =========================================

// ✅ 2. Converted to Named Export
export async function getAllAnnouncements(page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;

  const [total, data] = await Promise.all([
    db.affiliateAnnouncement.count(),
    db.affiliateAnnouncement.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        targetGroups: { select: { id: true, name: true } },
        targetTiers: { select: { id: true, name: true } }
      }
    })
  ]);

  return { 
    announcements: data, 
    total, 
    totalPages: Math.ceil(total / limit) 
  };
}

// =========================================
// SERVER ACTIONS (Mutations)
// =========================================

// ✅ 3. Removed inline "use server" (already at top)
export async function createAnnouncementAction(data: z.infer<typeof announcementSchema>): Promise<ActionResponse> {
  try {
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) return { success: false, message: "Unauthorized" };

    const result = announcementSchema.safeParse(data);
    if (!result.success) return { success: false, message: "Validation failed." };

    const payload = result.data;

    const announcement = await db.affiliateAnnouncement.create({
      data: {
        title: payload.title,
        content: payload.content,
        type: payload.type,
        isActive: payload.isActive,
        startsAt: payload.startsAt || new Date(),
        expiresAt: payload.expiresAt,
        targetGroups: payload.groupIds ? {
          connect: payload.groupIds.map(id => ({ id }))
        } : undefined,
        targetTiers: payload.tierIds ? {
          connect: payload.tierIds.map(id => ({ id }))
        } : undefined,
      }
    });

    await auditService.log({
      userId: auth.id,
      action: "CREATE",
      entity: "AffiliateAnnouncement",
      entityId: announcement.id,
      newData: payload
    });

    revalidatePath("/admin/settings/affiliate/announcements");
    return { success: true, message: "Announcement published." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function deleteAnnouncementAction(id: string): Promise<ActionResponse> {
  try {
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) return { success: false, message: "Unauthorized" };

    await db.affiliateAnnouncement.delete({ where: { id } });

    await auditService.log({
      userId: auth.id,
      action: "DELETE",
      entity: "AffiliateAnnouncement",
      entityId: id
    });

    revalidatePath("/admin/settings/affiliate/announcements");
    return { success: true, message: "Deleted successfully." };
  } catch (error: any) {
    return { success: false, message: "Failed to delete." };
  }
}

export async function toggleStatusAction(id: string, isActive: boolean): Promise<ActionResponse> {
  try {
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) return { success: false, message: "Unauthorized" };

    await db.affiliateAnnouncement.update({
      where: { id },
      data: { isActive }
    });

    revalidatePath("/admin/settings/affiliate/announcements");
    return { success: true, message: "Status updated." };
  } catch (error: any) {
    return { success: false, message: "Update failed." };
  }
}