// File: app/actions/admin/settings/affiliate/_services/commition-rule-service.ts

"use server";

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auditService } from "@/lib/services/audit-service";
import { ActionResponse } from "../types";
import { syncUser } from "@/lib/auth-sync";
import { z } from "zod";

const ruleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Rule name is required."),
  isActive: z.boolean().default(true),
  priority: z.coerce.number().default(0),

  // Extended Condition Logic
  conditions: z.object({
    minOrderAmount: z.coerce.number().optional(),
    maxOrderAmount: z.coerce.number().optional(),
    categoryIds: z.array(z.string()).optional(),
    customerType: z.enum(["ALL", "NEW", "RETURNING"]).optional(),
    productTags: z.array(z.string()).optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one condition is required.",
  }),

  action: z.object({
    type: z.enum(["PERCENTAGE", "FIXED"]),
    value: z.coerce.number().min(0),
    tierBonus: z.coerce.number().optional(),
  }),

  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  affiliateSpecificIds: z.array(z.string()).default([]),
});

type RuleInput = z.infer<typeof ruleSchema>;

// =========================================
// READ OPERATIONS
// =========================================
export async function getRules() {
  try {
    return await db.affiliateCommissionRule.findMany({
      orderBy: [
        { isActive: "desc" }, 
        { priority: "desc" }, 
      ],
    });
  } catch (error) {
    throw new Error("Failed to fetch commission rules.");
  }
}

// =========================================
// SERVER ACTIONS (Mutations)
// =========================================

export async function upsertRuleAction(data: RuleInput): Promise<ActionResponse> {
  try {
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) return { success: false, message: "Unauthorized" };

    const result = ruleSchema.safeParse(data);
    if (!result.success) {
      return {
        success: false,
        message: "Validation Error",
        errors: result.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const payload = result.data;

    // Auto-assign priority if missing
    if (!payload.priority) {
      const maxPrio = await db.affiliateCommissionRule.findFirst({
        orderBy: { priority: "desc" },
        select: { priority: true },
      });
      payload.priority = (maxPrio?.priority || 0) + 1;
    }

    const prismaData: any = {
      name: payload.name,
      isActive: payload.isActive,
      priority: payload.priority,
      conditions: payload.conditions,
      action: payload.action,
      startDate: payload.startDate ? new Date(payload.startDate) : null,
      endDate: payload.endDate ? new Date(payload.endDate) : null,
      affiliateSpecificIds: payload.affiliateSpecificIds,
    };

    if (payload.id) {
      await db.affiliateCommissionRule.update({
        where: { id: payload.id },
        data: prismaData,
      });
    } else {
      await db.affiliateCommissionRule.create({
        data: prismaData,
      });
    }

    revalidatePath("/admin/settings/affiliate/rules");
    return { success: true, message: "Commission rule saved successfully." };

  } catch (error: any) {
    return { success: false, message: error.message || "Failed to save rule." };
  }
}

export async function reorderRulesAction(items: { id: string; priority: number }[]): Promise<ActionResponse> {
  try {
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) return { success: false, message: "Unauthorized" };

    await db.$transaction(
      items.map((item) =>
        db.affiliateCommissionRule.update({
          where: { id: item.id },
          data: { priority: item.priority },
        })
      )
    );
    
    revalidatePath("/admin/settings/affiliate/rules");
    return { success: true, message: "Priorities updated." };
  } catch (error) {
    return { success: false, message: "Failed to reorder rules." };
  }
}

export async function deleteRuleAction(id: string): Promise<ActionResponse> {
  try {
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) return { success: false, message: "Unauthorized" };

    await db.affiliateCommissionRule.delete({ where: { id } });

    revalidatePath("/admin/settings/affiliate/rules");
    return { success: true, message: "Rule deleted." };
  } catch (error) {
    return { success: false, message: "Failed to delete rule." };
  }
}