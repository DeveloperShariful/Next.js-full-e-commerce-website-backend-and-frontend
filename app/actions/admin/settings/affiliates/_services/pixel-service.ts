// File: app/actions/admin/settings/affiliate/_services/pixel-service.ts

"use server";

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auditService } from "@/lib/services/audit-service";
import { ActionResponse } from "../types";
import { syncUser } from "@/lib/auth-sync";

// =========================================
// READ OPERATIONS
// =========================================
export async function getAllPixels() {
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
// SERVER ACTIONS (Mutations)
// =========================================

export async function createPixelAction(data: Prisma.AffiliatePixelCreateInput): Promise<ActionResponse> {
  try {
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) return { success: false, message: "Unauthorized" };

    const pixel = await db.affiliatePixel.create({ data });
    
    await auditService.log({
      userId: auth.id,
      action: "CREATE",
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
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) return { success: false, message: "Unauthorized" };

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
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) return { success: false, message: "Unauthorized" };

    await db.affiliatePixel.delete({
      where: { id }
    });

    revalidatePath("/admin/settings/affiliate/pixels");
    return { success: true, message: "Pixel deleted." };
  } catch (error: any) {
    return { success: false, message: "Failed to delete pixel." };
  }
}