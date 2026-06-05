// File: app/actions/backend/affiliate/_services/group-service.ts

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

const tierSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters."),
  description: z.string().optional(),
  commissionRate: z.union([z.string(), z.number()]).optional(),
  commissionType: z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
  isDefault: z.boolean().default(false),
});

type TierInput = z.infer<typeof tierSchema>;

// =========================================
// READ OPERATIONS
// =========================================

export async function getAllGroups() {
  await protectAction("MANAGE_PARTNERS");
  // ✅ FIXED: Mapping Group functionality to Tier functionality seamlessly
  return await db.affiliateTier.findMany({
    include: {
      _count: { 
        select: { 
          affiliates: true,
        } 
      }
    },
    orderBy: { name: "asc" }
  });
}

// =========================================
// WRITE OPERATIONS (UPSERT)
// =========================================

export async function upsertGroupAction(data: TierInput): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_PARTNERS");

    const result = tierSchema.safeParse(data);
    if (!result.success) {
      return {
        success: false,
        message: "Validation Error",
        errors: result.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const payload = result.data;
    const rateValue = payload.commissionRate ? DecimalMath.toDecimal(payload.commissionRate as any) : new Prisma.Decimal(0);

    await db.$transaction(async (tx) => {
      
      if (payload.isDefault) {
        await tx.affiliateTier.updateMany({
          where: { isDefault: true, id: { not: payload.id } },
          data: { isDefault: false },
        });
      }

      let tierId = payload.id;

      // =========================================================
      // UPDATE SCENARIO
      // =========================================================
      if (payload.id) {
        const existing = await tx.affiliateTier.findUnique({
          where: { id: payload.id }
        });

        if (!existing) throw new Error("Tier/Group not found");

        const targetData = {
            name: payload.name,
            description: payload.description || null,
            commissionRate: rateValue,
            commissionType: payload.commissionType,
            isDefault: payload.isDefault
        };

        const { hasChanges, changes, oldValues } = getChanges(existing, targetData);

        if (hasChanges) {
          await tx.affiliateTier.update({
            where: { id: payload.id },
            data: changes as Prisma.AffiliateTierUpdateInput,
          });

          await auditService.log({
            userId: actor.id,
            action: "UPDATE_GROUP_TIER",
            entity: "AffiliateTier",
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
        const created = await tx.affiliateTier.create({
          data: {
            name: payload.name,
            description: payload.description,
            commissionRate: rateValue,
            commissionType: payload.commissionType,
            isDefault: payload.isDefault,
          },
        });
        tierId = created.id;

        await auditService.log({
          userId: actor.id,
          action: "CREATE_GROUP_TIER",
          entity: "AffiliateTier",
          entityId: tierId,
          newData: payload
        });
      }
    });

    revalidatePath("/admin/affiliate/groups");
    return { success: true, message: payload.id ? "Updated." : "Created." };

  } catch (error: any) {
    if (error.code === 'P2002') return { success: false, message: "A name like this already exists." };
    return { success: false, message: error.message || "Failed to save." };
  }
}

// =========================================
// DELETE OPERATION
// =========================================

export async function deleteGroupAction(id: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_PARTNERS");
    const affiliateCount = await db.affiliateAccount.count({ where: { tierId: id } });

    if (affiliateCount > 0) {
        return { success: false, message: `Cannot delete: ${affiliateCount} affiliates are currently in this tier/group.` };
    }

    const deleted = await db.affiliateTier.delete({ where: { id } });

    await auditService.log({
      userId: actor.id,
      action: "DELETE_GROUP_TIER",
      entity: "AffiliateTier",
      entityId: id,
      oldData: { name: deleted.name }
    });
    
    revalidatePath("/admin/affiliate/groups");
    return { success: true, message: "Deleted successfully." };
  } catch (error: any) {
    return { success: false, message: "Failed to delete." };
  }
}