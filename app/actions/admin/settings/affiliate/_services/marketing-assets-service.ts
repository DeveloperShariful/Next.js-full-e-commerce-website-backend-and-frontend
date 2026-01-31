// File: app/actions/admin/settings/affiliate/_services/marketing-assets-service.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { auditService } from "@/lib/services/audit-service";
import { ActionResponse } from "../types";
import { z } from "zod";
import { protectAction } from "../permission-service"; 
import { MediaType } from "@prisma/client";

// =========================================
// SECTION 1: ANNOUNCEMENTS
// =========================================

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

// --- READ OPERATIONS ---
export async function getAllAnnouncements(page: number = 1, limit: number = 20) {
  await protectAction("MANAGE_CONFIGURATION");

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

// --- WRITE OPERATIONS ---
export async function createAnnouncementAction(data: z.infer<typeof announcementSchema>): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_CONFIGURATION");

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
      userId: actor.id,
      action: "CREATE_ANNOUNCEMENT",
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
    const actor = await protectAction("MANAGE_CONFIGURATION");

    await db.affiliateAnnouncement.delete({ where: { id } });

    await auditService.log({
      userId: actor.id,
      action: "DELETE_ANNOUNCEMENT",
      entity: "AffiliateAnnouncement",
      entityId: id
    });

    revalidatePath("/admin/settings/affiliate/announcements");
    return { success: true, message: "Deleted successfully." };
  } catch (error: any) {
    return { success: false, message: "Failed to delete." };
  }
}

export async function toggleAnnouncementStatusAction(id: string, isActive: boolean): Promise<ActionResponse> {
  try {
    await protectAction("MANAGE_CONFIGURATION");

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

// =========================================
// SECTION 2: CREATIVES (Banners/Assets)
// =========================================

const creativeSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Title is required."),
  type: z.nativeEnum(MediaType).default("IMAGE"),
  url: z.string().url("Must be a valid image/resource URL."),
  targetUrl: z.string().url("Must be a valid destination URL.").optional().or(z.literal("")),
  width: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
  isActive: z.boolean().default(true),
  description: z.string().optional(),
});

type CreativeInput = z.infer<typeof creativeSchema>;

// --- READ OPERATIONS ---
export async function getAllCreatives() {
  try {
    await protectAction("MANAGE_CONFIGURATION"); 

    return await db.affiliateCreative.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { usages: true }
        }
      }
    });
  } catch (error) {
    throw new Error("Failed to load creatives.");
  }
}

// --- WRITE OPERATIONS ---
export async function upsertCreativeAction(data: CreativeInput): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_CONFIGURATION");

    const result = creativeSchema.safeParse(data);
    if (!result.success) return { success: false, message: "Validation failed." };

    const payload = result.data;
    
    const dbPayload = {
      title: payload.title,
      type: payload.type,
      url: payload.url,
      targetUrl: payload.targetUrl || null,
      width: payload.width || null,
      height: payload.height || null,
      isActive: payload.isActive,
      description: payload.description || null,
    };

    if (payload.id) {
      await db.affiliateCreative.update({
        where: { id: payload.id },
        data: dbPayload,
      });
    } else {
      await db.affiliateCreative.create({
        data: dbPayload,
      });
    }

    await auditService.log({
      userId: actor.id,
      action: payload.id ? "UPDATE_CREATIVE" : "CREATE_CREATIVE",
      entity: "AffiliateCreative",
      entityId: payload.id || "NEW",
      newData: dbPayload
    });

    revalidatePath("/admin/settings/affiliate/creatives");
    return { success: true, message: "Creative asset saved successfully." };

  } catch (error: any) {
    return { success: false, message: "Operation failed." };
  }
}

export async function deleteCreativeAction(id: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_CONFIGURATION");

    await db.affiliateCreative.delete({
      where: { id },
    });

    await auditService.log({
      userId: actor.id,
      action: "DELETE_CREATIVE",
      entity: "AffiliateCreative",
      entityId: id
    });

    revalidatePath("/admin/settings/affiliate/creatives");
    return { success: true, message: "Asset deleted successfully." };
  } catch (error) {
    return { success: false, message: "Failed to delete asset." };
  }
}