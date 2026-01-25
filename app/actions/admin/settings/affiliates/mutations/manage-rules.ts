// File: app/actions/admin/settings/affiliate/mutations/manage-rules.ts

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { ruleEngineService } from "../_services/rule-engine-service";
import { ActionResponse } from "../types";
import { Prisma } from "@prisma/client";

// Zod Schema for Rules
// JSON Logic is complex, so we validate the essential structure
const ruleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Rule name is required."),
  isActive: z.boolean().default(true),
  priority: z.coerce.number().default(0),

  // ✅ FIX: Explicitly define Key (string) and Value (any)
  conditions: z.record(z.string(), z.any()).refine((data) => Object.keys(data).length > 0, {
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

/**
 * SERVER ACTION: Create or Update Commission Rule
 */
export async function upsertRule(data: RuleInput): Promise<ActionResponse> {
  try {
    // 1. Validate
    const result = ruleSchema.safeParse(data);
    if (!result.success) {
      return {
        success: false,
        message: "Validation Error",
        errors: result.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const payload = result.data;

    // Convert Date Strings to Date Objects for Prisma
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

    // 2. Execute Service
    if (payload.id) {
      await ruleEngineService.updateRule(payload.id, prismaData);
    } else {
      await ruleEngineService.createRule(prismaData);
    }

    revalidatePath("/admin/settings/affiliate/rules");
    return { success: true, message: "Commission rule saved successfully." };

  } catch (error: any) {
    return { success: false, message: error.message || "Failed to save rule." };
  }
}

/**
 * SERVER ACTION: Reorder Rules (Drag & Drop Priority)
 */
export async function reorderRulesAction(items: { id: string; priority: number }[]) {
  try {
    await ruleEngineService.reorderRules(items);
    revalidatePath("/admin/settings/affiliate/rules");
    return { success: true, message: "Priorities updated." };
  } catch (error) {
    return { success: false, message: "Failed to reorder rules." };
  }
}

/**
 * SERVER ACTION: Delete Rule
 */
export async function deleteRuleAction(id: string) {
  try {
    await ruleEngineService.deleteRule(id);
    revalidatePath("/admin/settings/affiliate/rules");
    return { success: true, message: "Rule deleted." };
  } catch (error) {
    return { success: false, message: "Failed to delete rule." };
  }
}