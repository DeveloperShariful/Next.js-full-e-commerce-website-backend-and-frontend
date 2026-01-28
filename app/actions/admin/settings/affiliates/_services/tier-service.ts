// File: app/actions/admin/settings/affiliate/_services/tier-service.ts

"use server";

import { db } from "@/lib/prisma";
import { Prisma, CommissionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auditService } from "@/lib/services/audit-service";
import { DecimalMath } from "@/lib/utils/decimal-math";
import { ActionResponse } from "../types";
import { syncUser } from "@/lib/auth-sync";
import { z } from "zod";

const tierSchema = z.object({
  id: z.string().optional(), 
  name: z.string().min(2, "Name must be at least 2 characters."),
  commissionRate: z.coerce.number().min(0, "Rate cannot be negative."),
  commissionType: z.nativeEnum(CommissionType).default("PERCENTAGE"),
  minSalesAmount: z.coerce.number().min(0).default(0),
  minSalesCount: z.coerce.number().min(0).default(0),
  color: z.string().optional(),
  icon: z.string().optional(),
});

type TierInput = z.infer<typeof tierSchema>;

// =========================================
// READ OPERATIONS
// =========================================
export async function getAllTiers() {
  try {
    return await db.affiliateTier.findMany({
      orderBy: { minSalesAmount: "asc" },
      include: {
        _count: {
          select: { affiliates: true }, 
        },
      },
    });
  } catch (error) {
    throw new Error("Failed to fetch affiliate tiers.");
  }
}

// =========================================
// SERVER ACTIONS (Mutations)
// =========================================

export async function upsertTierAction(data: TierInput): Promise<ActionResponse> {
  try {
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) return { success: false, message: "Unauthorized" };

    const result = tierSchema.safeParse(data);
    if (!result.success) return { success: false, message: "Validation failed." };

    const payload = result.data;
    const rateDecimal = DecimalMath.toDecimal(payload.commissionRate);
    const minSalesDecimal = DecimalMath.toDecimal(payload.minSalesAmount);

    if (payload.id) {
      await db.affiliateTier.update({
        where: { id: payload.id },
        data: {
          name: payload.name,
          commissionRate: rateDecimal,
          commissionType: payload.commissionType,
          minSalesAmount: minSalesDecimal,
          minSalesCount: payload.minSalesCount,
          color: payload.color,
          icon: payload.icon,
        },
      });
    } else {
      const existing = await db.affiliateTier.findUnique({ where: { name: payload.name } });
      if (existing) return { success: false, message: "Tier name already exists." };

      await db.affiliateTier.create({
        data: {
          name: payload.name,
          commissionRate: rateDecimal,
          commissionType: payload.commissionType,
          minSalesAmount: minSalesDecimal,
          minSalesCount: payload.minSalesCount,
          color: payload.color,
          icon: payload.icon,
        },
      });
    }

    await auditService.log({
      userId: auth.id,
      action: payload.id ? "UPDATE" : "CREATE",
      entity: "AffiliateTier",
      entityId: payload.id || "NEW",
      newData: payload
    });

    revalidatePath("/admin/settings/affiliate/tiers");
    return { success: true, message: payload.id ? "Tier updated." : "Tier created." };

  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function deleteTierAction(id: string): Promise<ActionResponse> {
  try {
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) return { success: false, message: "Unauthorized" };

    const usageCount = await db.affiliateAccount.count({
      where: { tierId: id },
    });

    if (usageCount > 0) {
      return { success: false, message: `Cannot delete tier. Assigned to ${usageCount} affiliates.` };
    }

    await db.affiliateTier.delete({ where: { id } });

    await auditService.log({
      userId: auth.id,
      action: "DELETE",
      entity: "AffiliateTier",
      entityId: id
    });

    revalidatePath("/admin/settings/affiliate/tiers");
    return { success: true, message: "Tier deleted successfully." };
  } catch (error: any) {
    return { success: false, message: "Failed to delete tier." };
  }
}