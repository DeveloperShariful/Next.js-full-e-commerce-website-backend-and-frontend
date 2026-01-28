// File: app/actions/admin/settings/affiliate/_services/fraud-rule-service.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auditService } from "@/lib/services/audit-service";
import { ActionResponse } from "../types";
import { syncUser } from "@/lib/auth-sync";
import { z } from "zod";

const ruleSchema = z.object({
  type: z.enum(["IP_CLICK_LIMIT", "CONVERSION_RATE_LIMIT", "ORDER_VALUE_LIMIT", "BLACKLIST_COUNTRY"]),
  value: z.string().min(1, "Threshold value is required"),
  action: z.enum(["BLOCK", "FLAG", "SUSPEND"]).default("FLAG"),
  reason: z.string().optional(),
});

// =========================================
// READ OPERATIONS
// =========================================
export async function getRules() {
  try {
    return await db.affiliateFraudRule.findMany({
      orderBy: { createdAt: "desc" }
    });
  } catch (error) {
    throw new Error("Failed to load fraud rules.");
  }
}

// =========================================
// SERVER ACTIONS (Mutations)
// =========================================

export async function createFraudRuleAction(data: z.infer<typeof ruleSchema>): Promise<ActionResponse> {
  try {
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) return { success: false, message: "Unauthorized" };

    const result = ruleSchema.safeParse(data);
    if (!result.success) return { success: false, message: result.error.issues[0].message };

    const rule = await db.affiliateFraudRule.create({
      data: {
        type: result.data.type,
        value: result.data.value,
        action: result.data.action,
        reason: result.data.reason || "Automated Rule Match"
      }
    });

    await auditService.log({
      userId: auth.id,
      action: "CREATE",
      entity: "AffiliateFraudRule",
      entityId: rule.id,
      newData: result.data
    });

    revalidatePath("/admin/settings/affiliate/fraud");
    return { success: true, message: "Security rule activated." };
  } catch (error: any) {
    return { success: false, message: "Failed to create rule." };
  }
}

export async function deleteFraudRuleAction(id: string): Promise<ActionResponse> {
  try {
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) return { success: false, message: "Unauthorized" };

    await db.affiliateFraudRule.delete({ where: { id } });

    revalidatePath("/admin/settings/affiliate/fraud");
    return { success: true, message: "Rule removed." };
  } catch (error: any) {
    return { success: false, message: "Failed to delete rule." };
  }
}