// File: app/actions/backend/affiliate/_services/marketing-assets-service.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auditService } from "@/lib/audit-service";
import { ActionResponse } from "../types";
import { z } from "zod";
import { protectAction } from "../permission-service";
import { MediaType, AnnouncementType } from "@prisma/client";
import { getAllTiers } from "./tier-service";
import { getAllTags } from "./coupon-tag-service"; // Using Tags instead of Groups
import crypto from "crypto";

// =========================================
// ZOD SCHEMAS FOR STRICT JSON VALIDATION
// =========================================
const announcementSchema = z.object({
  id: z.string().optional(), 
  title: z.string().min(3),
  content: z.string().min(5),
  type: z.nativeEnum(AnnouncementType),
  isActive: z.boolean().default(true),
  startsAt: z.union([z.string(), z.date()]),
  expiresAt: z.union([z.string(), z.date()]).optional().nullable(),
  groupIds: z.array(z.string()).optional(), // UI mapped to Tags internally
  tierIds: z.array(z.string()).optional(),
  affiliateIds: z.array(z.string()).optional(), 
});

const creativeSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Title is required."),
  type: z.nativeEnum(MediaType).default("IMAGE"),
  url: z.string().url("Must be a valid image/resource URL."),
  targetUrl: z.string().url("Must be a valid destination URL.").optional().or(z.literal("")),
  width: z.coerce.number().optional().nullable(),
  height: z.coerce.number().optional().nullable(),
  isActive: z.boolean().default(true),
  description: z.string().optional().nullable(),
});

type CreativeInput = z.infer<typeof creativeSchema>;
type AnnouncementInput = z.infer<typeof announcementSchema>;

// =========================================
// READ OPERATIONS (FROM JSON IN StoreSettings)
// =========================================

export async function getAllAnnouncements(page: number = 1, limit: number = 20) {
  await protectAction("MANAGE_CONFIGURATION");
  
  const settings = await db.storeSettings.findUnique({
    where: { id: "settings" },
    select: { affiliateAnnouncements: true }
  });

  const parsed = z.array(announcementSchema).safeParse(settings?.affiliateAnnouncements);
  let allAnnouncements = parsed.success ? parsed.data : [];
  
  // Sort by created/start date desc
  allAnnouncements.sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());

  const skip = (page - 1) * limit;
  const total = allAnnouncements.length;
  const paginated = allAnnouncements.slice(skip, skip + limit);

  // Format data to match exactly what UI expects (mocking the relation structure)
  const formattedData = paginated.map(ann => ({
    ...ann,
    createdAt: new Date(ann.startsAt), // Mocking createdAt
    targetGroups: (ann.groupIds || []).map(id => ({ id, name: id })), // UI expects {id, name}
    targetTiers: (ann.tierIds || []).map(id => ({ id, name: id }))
  }));

  return { 
    announcements: formattedData, 
    total, 
    totalPages: Math.ceil(total / limit) 
  };
}

export async function getAllCreatives() {
  try {
    await protectAction("MANAGE_CONFIGURATION"); 

    const settings = await db.storeSettings.findUnique({
      where: { id: "settings" },
      select: { affiliateCreatives: true }
    });

    const parsed = z.array(creativeSchema).safeParse(settings?.affiliateCreatives);
    let allCreatives = parsed.success ? parsed.data : [];

    // Format data to match exactly what UI expects
    return allCreatives.map(c => ({
      ...c,
      createdAt: new Date(), 
      _count: { usages: 0 } // Mock usage count since table is removed
    }));
  } catch (error) {
    throw new Error("Failed to load creatives.");
  }
}

export async function getTargetingOptions() {
    // ✅ FIXED: Return Tags as "groups" so the UI Dropdown doesn't break!
    const [groups, tiers] = await Promise.all([
        getAllTags(), // Fetches tags {id, name}
        getAllTiers() // Assuming getAllTiers returns {id, name}
    ]);
    return { groups, tiers };
}

// =========================================
// WRITE OPERATIONS (JSON MUTATIONS)
// =========================================

export async function createAnnouncementAction(data: AnnouncementInput): Promise<ActionResponse> {
  return upsertAnnouncementAction(data); // Re-routed to the upsert function to avoid code duplication
}

export async function upsertAnnouncementAction(data: AnnouncementInput): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_CONFIGURATION");
    const result = announcementSchema.safeParse(data);
    if (!result.success) return { success: false, message: "Validation failed." };
    
    const payload = result.data;
    const startDate = new Date(payload.startsAt);
    const endDate = payload.expiresAt ? new Date(payload.expiresAt) : null;
    if (endDate && startDate > endDate) {
        return { success: false, message: "End date cannot be before start date." };
    }

    const settings = await db.storeSettings.findUnique({ select: { affiliateAnnouncements: true }, where: { id: "settings" } });
    const parsed = z.array(announcementSchema).safeParse(settings?.affiliateAnnouncements);
    let announcements = parsed.success ? parsed.data : [];

    let recordId = payload.id;

    if (payload.id) {
      const index = announcements.findIndex(a => a.id === payload.id);
      if (index > -1) announcements[index] = { ...payload, id: payload.id };
    } else {
      recordId = crypto.randomUUID();
      announcements.push({ ...payload, id: recordId });
    }

    await db.storeSettings.update({
      where: { id: "settings" },
      data: { affiliateAnnouncements: announcements }
    });

    await auditService.log({
      userId: actor.id,
      action: payload.id ? "UPDATE_ANNOUNCEMENT" : "CREATE_ANNOUNCEMENT",
      entity: "StoreSettings",
      entityId: "affiliateAnnouncements",
      newData: payload
    });

    revalidatePath("/admin/affiliate/announcements");
    return { success: true, message: payload.id ? "Announcement updated." : "Announcement published." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function deleteAnnouncementAction(id: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_CONFIGURATION");
    
    const settings = await db.storeSettings.findUnique({ select: { affiliateAnnouncements: true }, where: { id: "settings" } });
    const parsed = z.array(announcementSchema).safeParse(settings?.affiliateAnnouncements);
    let announcements = parsed.success ? parsed.data : [];

    announcements = announcements.filter(a => a.id !== id);

    await db.storeSettings.update({
      where: { id: "settings" },
      data: { affiliateAnnouncements: announcements }
    });

    await auditService.log({
      userId: actor.id,
      action: "DELETE_ANNOUNCEMENT",
      entity: "StoreSettings",
      entityId: id
    });

    revalidatePath("/admin/affiliate/announcements");
    return { success: true, message: "Deleted successfully." };
  } catch (error: any) {
    return { success: false, message: "Failed to delete." };
  }
}

export async function toggleAnnouncementStatusAction(id: string, isActive: boolean): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_CONFIGURATION");
    
    const settings = await db.storeSettings.findUnique({ select: { affiliateAnnouncements: true }, where: { id: "settings" } });
    const parsed = z.array(announcementSchema).safeParse(settings?.affiliateAnnouncements);
    let announcements = parsed.success ? parsed.data : [];

    const index = announcements.findIndex(a => a.id === id);
    if (index > -1) {
      announcements[index].isActive = isActive;
      
      await db.storeSettings.update({
        where: { id: "settings" },
        data: { affiliateAnnouncements: announcements }
      });
    }

    await auditService.log({
        userId: actor.id,
        action: "UPDATE_ANNOUNCEMENT_STATUS",
        entity: "StoreSettings",
        entityId: id,
        newData: { isActive }
    });
    revalidatePath("/admin/affiliate/announcements");
    return { success: true, message: "Status updated." };
  } catch (error: any) {
    return { success: false, message: "Update failed." };
  }
}

export async function upsertCreativeAction(data: CreativeInput): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_CONFIGURATION");
    const result = creativeSchema.safeParse(data);
    if (!result.success) return { success: false, message: "Validation failed." };
    const payload = result.data;
    
    const settings = await db.storeSettings.findUnique({ select: { affiliateCreatives: true }, where: { id: "settings" } });
    const parsed = z.array(creativeSchema).safeParse(settings?.affiliateCreatives);
    let creatives = parsed.success ? parsed.data : [];

    let entityId = payload.id;

    if (payload.id) {
      const index = creatives.findIndex(c => c.id === payload.id);
      if (index > -1) creatives[index] = { ...payload, id: payload.id };
    } else {
      entityId = crypto.randomUUID();
      creatives.push({ ...payload, id: entityId });
    }

    await db.storeSettings.update({
      where: { id: "settings" },
      data: { affiliateCreatives: creatives }
    });

    await auditService.log({
      userId: actor.id,
      action: payload.id ? "UPDATE_CREATIVE" : "CREATE_CREATIVE",
      entity: "StoreSettings",
      entityId: entityId || "NEW",
      newData: payload
    });

    revalidatePath("/admin/affiliate/creatives");
    return { success: true, message: "Creative asset saved successfully." };

  } catch (error: any) {
    return { success: false, message: "Operation failed." };
  }
}

export async function deleteCreativeAction(id: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_CONFIGURATION");

    const settings = await db.storeSettings.findUnique({ select: { affiliateCreatives: true }, where: { id: "settings" } });
    const parsed = z.array(creativeSchema).safeParse(settings?.affiliateCreatives);
    let creatives = parsed.success ? parsed.data : [];

    creatives = creatives.filter(c => c.id !== id);

    await db.storeSettings.update({
      where: { id: "settings" },
      data: { affiliateCreatives: creatives }
    });

    await auditService.log({
      userId: actor.id,
      action: "DELETE_CREATIVE",
      entity: "StoreSettings",
      entityId: id
    });

    revalidatePath("/admin/affiliate/creatives");
    return { success: true, message: "Asset deleted successfully." };
  } catch (error) {
    return { success: false, message: "Failed to delete asset." };
  }
}

export async function trackCreativeUsageAction(creativeId: string, affiliateId: string) {
  // Usage tracking logic is disabled intentionally for extreme performance tuning as requested.
  // We track conversions directly from utm_campaign/slugs.
  return { success: true };
}