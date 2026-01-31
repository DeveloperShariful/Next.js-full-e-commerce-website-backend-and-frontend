// File: app/actions/admin/settings/affiliate/_services/tag-service.ts

"use server";

import { db } from "@/lib/prisma";
import { ActionResponse } from "../types";
import { revalidatePath } from "next/cache";
import { protectAction } from "../permission-service"; 
import { auditService } from "@/lib/services/audit-service";

// =========================================
// READ OPERATIONS
// =========================================
export async function getAllTags() {
  await protectAction("MANAGE_PARTNERS");
  
  return await db.affiliateTag.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  });
}

// =========================================
// WRITE OPERATIONS
// =========================================
export async function createTagAction(name: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_PARTNERS");

    if (!name || name.length < 2) return { success: false, message: "Tag name too short." };

    const tag = await db.affiliateTag.create({
      data: { name: name.trim() }
    });

    await auditService.log({
        userId: actor.id,
        action: "CREATE_TAG",
        entity: "AffiliateTag",
        entityId: tag.id,
        newData: { name }
    });

    revalidatePath("/admin/settings/affiliate"); // Path updated just in case
    return { success: true, message: "Tag created." };
  } catch (error: any) {
    return { success: false, message: "Tag already exists or failed." };
  }
}

// ✅ এই ফাংশনটি মিসিং ছিল, এটি যুক্ত করুন:
export async function deleteTagAction(id: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_PARTNERS");

    await db.affiliateTag.delete({
      where: { id }
    });

    await auditService.log({
        userId: actor.id,
        action: "DELETE_TAG",
        entity: "AffiliateTag",
        entityId: id
    });

    revalidatePath("/admin/settings/affiliate");
    return { success: true, message: "Tag deleted." };
  } catch (error: any) {
    return { success: false, message: "Failed to delete tag." };
  }
}