//File: app/actions/admin/settings/affiliates/mutations/manage-groups.ts

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";
import { ActionResponse } from "../types";

const groupSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Group name must be at least 2 characters."),
  description: z.string().optional(),
  commissionRate: z.union([z.string(), z.number()]).optional(),
  isDefault: z.boolean().default(false),
});

type GroupInput = z.infer<typeof groupSchema>;

export async function upsertGroupAction(data: GroupInput): Promise<ActionResponse> {
  try {
    const result = groupSchema.safeParse(data);
    if (!result.success) {
      return {
        success: false,
        message: "Validation Error",
        errors: result.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const payload = result.data;
    const rateValue = payload.commissionRate ? Number(payload.commissionRate) : null;

    // Logic: If setting as default, unset others
    if (payload.isDefault) {
      await db.affiliateGroup.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    if (payload.id) {
      await db.affiliateGroup.update({
        where: { id: payload.id },
        data: {
          name: payload.name,
          description: payload.description,
          commissionRate: rateValue,
          isDefault: payload.isDefault,
        },
      });
    } else {
      await db.affiliateGroup.create({
        data: {
          name: payload.name,
          slug: payload.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          description: payload.description,
          commissionRate: rateValue,
          isDefault: payload.isDefault,
        },
      });
    }

    revalidatePath("/admin/settings/affiliate/groups");
    return { success: true, message: payload.id ? "Group updated." : "Group created." };

  } catch (error: any) {
    // Handle Unique Constraint (Slug/Name)
    if (error.code === 'P2002') {
      return { success: false, message: "A group with this name already exists." };
    }
    return { success: false, message: error.message || "Failed to save group." };
  }
}

export async function deleteGroupAction(id: string): Promise<ActionResponse> {
  try {
    if (!id) return { success: false, message: "ID required." };

    // Check if used
    const count = await db.affiliateAccount.count({ where: { groupId: id } });
    if (count > 0) {
        // Option: Move to default group logic here if needed
        return { success: false, message: `Cannot delete: ${count} affiliates are in this group.` };
    }

    await db.affiliateGroup.delete({ where: { id } });
    
    revalidatePath("/admin/settings/affiliate/groups");
    return { success: true, message: "Group deleted successfully." };
  } catch (error: any) {
    return { success: false, message: "Failed to delete group." };
  }
}