//Path: app/actions/admin/settings/affiliate/_services/tag-service.ts

"use server";

import { db } from "@/lib/prisma";
import { ActionResponse } from "../types";
import { revalidatePath } from "next/cache";
import { syncUser } from "@/lib/auth-sync";

// =========================================
// READ OPERATIONS
// =========================================
export async function getAllTags() {
  return await db.affiliateTag.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  });
}

// =========================================
// SERVER ACTIONS
// =========================================
export async function createTagAction(name: string): Promise<ActionResponse> {
  try {
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) return { success: false, message: "Unauthorized" };

    if (!name || name.length < 2) return { success: false, message: "Tag name too short." };

    await db.affiliateTag.create({
      data: { name: name.trim() }
    });

    revalidatePath("/admin/settings/affiliate/users");
    return { success: true, message: "Tag created." };
  } catch (error: any) {
    return { success: false, message: "Tag already exists or failed." };
  }
}