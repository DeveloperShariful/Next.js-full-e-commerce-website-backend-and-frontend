//app/actions/admin/settings/affiliate/mutations/manage-fraud-rules.ts

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { fraudRuleService } from "../_services/fraud-rule-service";
import { ActionResponse } from "../types";

// Schema for Fraud Rule
const ruleSchema = z.object({
  type: z.enum(["IP_CLICK_LIMIT", "CONVERSION_RATE_LIMIT", "ORDER_VALUE_LIMIT", "BLACKLIST_COUNTRY"]),
  value: z.string().min(1, "Threshold value is required"),
  action: z.enum(["BLOCK", "FLAG", "SUSPEND"]).default("FLAG"),
  reason: z.string().optional(),
});

type RuleInput = z.infer<typeof ruleSchema>;

/**
 * SERVER ACTION: Create Fraud Rule
 */
export async function createFraudRuleAction(data: RuleInput): Promise<ActionResponse> {
  try {
    const result = ruleSchema.safeParse(data);
    if (!result.success) {
      return { success: false, message: result.error.issues[0].message };
    }

    await fraudRuleService.createRule({
      type: result.data.type,
      value: result.data.value,
      action: result.data.action,
      reason: result.data.reason || "Automated Rule Match"
    });

    revalidatePath("/admin/settings/affiliate/fraud");
    return { success: true, message: "Security rule activated." };
  } catch (error: any) {
    return { success: false, message: "Failed to create rule." };
  }
}

/**
 * SERVER ACTION: Delete Rule
 */
export async function deleteFraudRuleAction(id: string): Promise<ActionResponse> {
  try {
    await fraudRuleService.deleteRule(id);
    revalidatePath("/admin/settings/affiliate/fraud");
    return { success: true, message: "Rule removed." };
  } catch (error: any) {
    return { success: false, message: "Failed to delete rule." };
  }
}