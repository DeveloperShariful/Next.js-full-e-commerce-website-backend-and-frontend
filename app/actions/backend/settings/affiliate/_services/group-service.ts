// File: app/actions/admin/settings/affiliate/_services/group-service.ts

"use server";

import { db } from "@/lib/prisma";
import { ActionResponse } from "../types";
import { revalidatePath } from "next/cache";
import { auditService } from "@/lib/audit-service";
import { DecimalMath } from "@/lib/decimal-math";
import { z } from "zod";
import { protectAction } from "../permission-service";
import { Prisma } from "@prisma/client";
import { getChanges } from "../get-changes";

const groupSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Group name must be at least 2 characters."),
  description: z.string().optional(),
  commissionRate: z.union([z.string(), z.number()]).optional(),
  commissionType: z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
  isDefault: z.boolean().default(false),
});

type GroupInput = z.infer<typeof groupSchema>;

// =========================================
// READ OPERATIONS
// =========================================

export async function getAllGroups() {
  await protectAction("MANAGE_PARTNERS");
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
// WRITE OPERATIONS (UPSERT)
// =========================================

export async function upsertGroupAction(data: GroupInput): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_PARTNERS");

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

    await db.$transaction(async (tx) => {
      
      if (payload.isDefault) {
        await tx.affiliateGroup.updateMany({
          where: { isDefault: true, id: { not: payload.id } },
          data: { isDefault: false },
        });
      }

      let groupId = payload.id;

      // =========================================================
      // UPDATE SCENARIO
      // =========================================================
      if (payload.id) {
        const existing = await tx.affiliateGroup.findUnique({
          where: { id: payload.id }
        });

        if (!existing) throw new Error("Group not found");

        const targetData = {
            name: payload.name,
            description: payload.description || null,
            commissionRate: rateValue,
            commissionType: payload.commissionType,
            isDefault: payload.isDefault
        };

        const { hasChanges, changes, oldValues } = getChanges(existing, targetData);

        if (hasChanges) {
          await tx.affiliateGroup.update({
            where: { id: payload.id },
            data: changes as Prisma.AffiliateGroupUpdateInput,
          });

          await auditService.log({
            userId: actor.id,
            action: "UPDATE_GROUP",
            entity: "AffiliateGroup",
            entityId: payload.id,
            oldData: oldValues, 
            newData: changes    
          });
        }

      } 
      // =========================================================
      // CREATE SCENARIO
      // =========================================================
      else {
        let baseSlug = payload.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        let slug = baseSlug;
        let counter = 1;
        
        while (await tx.affiliateGroup.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        const created = await tx.affiliateGroup.create({
          data: {
            name: payload.name,
            slug: slug,
            description: payload.description,
            commissionRate: rateValue,
            commissionType: payload.commissionType,
            isDefault: payload.isDefault,
          },
        });
        groupId = created.id;

        await auditService.log({
          userId: actor.id,
          action: "CREATE_GROUP",
          entity: "AffiliateGroup",
          entityId: groupId,
          newData: payload
        });
      }
    });

    revalidatePath("/admin/settings/affiliate/groups");
    return { success: true, message: payload.id ? "Group updated." : "Group created." };

  } catch (error: any) {
    if (error.code === 'P2002') return { success: false, message: "A group with this name already exists." };
    return { success: false, message: error.message || "Failed to save group." };
  }
}

// =========================================
// DELETE OPERATION
// =========================================

export async function deleteGroupAction(id: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_PARTNERS");
    const [affiliateCount, rateCount] = await Promise.all([
        db.affiliateAccount.count({ where: { groupId: id } }), 
        db.affiliateProductRate.count({ where: { groupId: id } }) 
    ]);

    if (affiliateCount > 0) {
        return { success: false, message: `Cannot delete: ${affiliateCount} affiliates are currently in this group.` };
    }
    if (rateCount > 0) {
        return { success: false, message: `Cannot delete: ${rateCount} commission overrides rely on this group.` };
    }

    const deleted = await db.affiliateGroup.delete({ where: { id } });

    await auditService.log({
      userId: actor.id,
      action: "DELETE_GROUP",
      entity: "AffiliateGroup",
      entityId: id,
      oldData: { name: deleted.name }
    });
    
    revalidatePath("/admin/settings/affiliate/groups");
    return { success: true, message: "Group deleted successfully." };
  } catch (error: any) {
    return { success: false, message: "Failed to delete group." };
  }
}