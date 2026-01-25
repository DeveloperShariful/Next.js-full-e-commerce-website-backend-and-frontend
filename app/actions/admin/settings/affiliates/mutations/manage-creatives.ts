// File: app/actions/admin/settings/affiliate/mutations/manage-creatives.ts

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { creativeService } from "../_services/creative-service";
import { ActionResponse } from "../types";
import { MediaType } from "@prisma/client";

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

/**
 * SERVER ACTION: Upsert Creative
 */
export async function upsertCreative(data: CreativeInput): Promise<ActionResponse> {
  try {
    const result = creativeSchema.safeParse(data);
    if (!result.success) {
      return {
        success: false,
        message: "Validation Failed",
        errors: result.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const payload = result.data;
    
    // Construct Prisma Payload
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
      await creativeService.updateCreative(payload.id, dbPayload);
    } else {
      await creativeService.createCreative(dbPayload);
    }

    revalidatePath("/admin/settings/affiliate/creatives");
    return { success: true, message: "Creative asset saved successfully." };

  } catch (error: any) {
    console.error("Creative Mutation Error:", error);
    return { success: false, message: "Operation failed." };
  }
}

/**
 * SERVER ACTION: Delete Creative
 */
export async function deleteCreativeAction(id: string): Promise<ActionResponse> {
  try {
    await creativeService.deleteCreative(id);
    revalidatePath("/admin/settings/affiliate/creatives");
    return { success: true, message: "Asset deleted successfully." };
  } catch (error) {
    return { success: false, message: "Failed to delete asset." };
  }
}