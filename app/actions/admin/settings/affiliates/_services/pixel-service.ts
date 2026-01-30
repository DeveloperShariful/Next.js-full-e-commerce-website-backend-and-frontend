// File: app/actions/admin/settings/affiliate/_services/pixel-service.ts

"use server";

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auditService } from "@/lib/services/audit-service";
import { ActionResponse } from "../types";
import { protectAction } from "../permission-service"; // ✅ Security

// =========================================
// READ OPERATIONS
// =========================================
export async function getAllPixels() {
  await protectAction("MANAGE_CONFIGURATION");

  return await db.affiliatePixel.findMany({
    include: {
      affiliate: {
        select: {
          user: { select: { name: true, email: true } },
          slug: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}

// =========================================
// WRITE OPERATIONS
// =========================================

export async function createPixelAction(data: Prisma.AffiliatePixelCreateInput): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_CONFIGURATION");

    const pixel = await db.affiliatePixel.create({ data });
    
    await auditService.log({
      userId: actor.id,
      action: "CREATE_PIXEL",
      entity: "AffiliatePixel",
      entityId: pixel.id,
      newData: data
    });

    revalidatePath("/admin/settings/affiliate/pixels");
    return { success: true, message: "Tracking pixel added." };
  } catch (error: any) {
    return { success: false, message: "Failed to create pixel." };
  }
}

export async function togglePixelStatusAction(id: string, isEnabled: boolean): Promise<ActionResponse> {
  try {
    await protectAction("MANAGE_CONFIGURATION");

    await db.affiliatePixel.update({
      where: { id },
      data: { isEnabled }
    });

    revalidatePath("/admin/settings/affiliate/pixels");
    return { success: true, message: `Pixel ${isEnabled ? "enabled" : "disabled"}.` };
  } catch (error: any) {
    return { success: false, message: "Failed to update status." };
  }
}

export async function deletePixelAction(id: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_CONFIGURATION");

    await db.affiliatePixel.delete({
      where: { id }
    });

    await auditService.log({
      userId: actor.id,
      action: "DELETE_PIXEL",
      entity: "AffiliatePixel",
      entityId: id
    });

    revalidatePath("/admin/settings/affiliate/pixels");
    return { success: true, message: "Pixel deleted." };
  } catch (error: any) {
    return { success: false, message: "Failed to delete pixel." };
  }
}