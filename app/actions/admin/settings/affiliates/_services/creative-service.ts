// File: app/actions/admin/settings/affiliate/_services/creative-service.ts

"use server";

import { db } from "@/lib/prisma";
import { MediaType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auditService } from "@/lib/services/audit-service";
import { ActionResponse } from "../types";
import { z } from "zod";
import { protectAction } from "./permission-service"; // ✅ Security

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

// =========================================
// READ OPERATIONS
// =========================================

export async function getAllCreatives() {
  try {
    // Creatives are public for affiliates, but admin management requires view permission
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

// =========================================
// WRITE OPERATIONS
// =========================================

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