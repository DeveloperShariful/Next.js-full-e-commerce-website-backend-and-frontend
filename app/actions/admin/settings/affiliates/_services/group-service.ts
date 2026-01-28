// File: app/actions/admin/settings/affiliate/_services/group-service.ts

"use server";

import { db } from "@/lib/prisma";
import { ActionResponse } from "../types";
import { revalidatePath } from "next/cache";
import { auditService } from "@/lib/services/audit-service";
import { DecimalMath } from "@/lib/utils/decimal-math";
import { syncUser } from "@/lib/auth-sync";
import { z } from "zod";

const groupSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Group name must be at least 2 characters."),
  description: z.string().optional(),
  commissionRate: z.union([z.string(), z.number()]).optional(),
  isDefault: z.boolean().default(false),
});

type GroupInput = z.infer<typeof groupSchema>;

// =========================================
// READ OPERATIONS
// =========================================
export async function getAllGroups() {
  return await db.affiliateGroup.findMany({
    include: {
      _count: { 
        select: { 
          affiliates: true,
          productRates: true,
          announcements: true
        } 
      }
    },
    orderBy: { name: "asc" }
  });
}

// =========================================
// SERVER ACTIONS (Mutations)
// =========================================

export async function upsertGroupAction(data: GroupInput): Promise<ActionResponse> {
  try {
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) return { success: false, message: "Unauthorized" };

    const result = groupSchema.safeParse(data);
    if (!result.success) {
      return {
        success: false,
        message: "Validation Error",
        errors: result.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const payload = result.data;
    const rateValue = payload.commissionRate ? DecimalMath.toDecimal(payload.commissionRate as any) : null;

    if (payload.isDefault) {
      await db.affiliateGroup.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    let groupId = payload.id;

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
      const created = await db.affiliateGroup.create({
        data: {
          name: payload.name,
          slug: payload.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          description: payload.description,
          commissionRate: rateValue,
          isDefault: payload.isDefault,
        },
      });
      groupId = created.id;
    }

    await auditService.log({
      userId: auth.id,
      action: payload.id ? "UPDATE" : "CREATE",
      entity: "AffiliateGroup",
      entityId: groupId!,
      newData: payload
    });

    revalidatePath("/admin/settings/affiliate/groups");
    return { success: true, message: payload.id ? "Group updated." : "Group created." };

  } catch (error: any) {
    if (error.code === 'P2002') return { success: false, message: "A group with this name already exists." };
    return { success: false, message: "Failed to save group." };
  }
}

export async function deleteGroupAction(id: string): Promise<ActionResponse> {
  try {
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) return { success: false, message: "Unauthorized" };

    const count = await db.affiliateAccount.count({ where: { groupId: id } });
    if (count > 0) {
        return { success: false, message: `Cannot delete: ${count} affiliates are in this group.` };
    }

    await db.affiliateGroup.delete({ where: { id } });

    await auditService.log({
      userId: auth.id,
      action: "DELETE",
      entity: "AffiliateGroup",
      entityId: id
    });
    
    revalidatePath("/admin/settings/affiliate/groups");
    return { success: true, message: "Group deleted successfully." };
  } catch (error: any) {
    return { success: false, message: "Failed to delete group." };
  }
}