//File: app/actions/admin/settings/affiliates/mutations/manage-mlm-config.ts

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";
import { ActionResponse } from "../types";
import { syncUser } from "@/lib/auth-sync";

const mlmSchema = z.object({
  isEnabled: z.boolean(),
  maxLevels: z.number().min(1).max(10),
  commissionBasis: z.enum(["SALES_AMOUNT", "PROFIT"]),
  levelRates: z.record(z.string(), z.number()), // { "1": 10, "2": 5 }
});

export async function updateMlmConfigAction(data: z.infer<typeof mlmSchema>): Promise<ActionResponse> {
  try {
    const user = await syncUser();
    if (!user || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(user.role)) {
        return { success: false, message: "Unauthorized." };
    }

    const result = mlmSchema.safeParse(data);
    if (!result.success) {
      return { success: false, message: "Validation failed." };
    }

    await db.affiliateMLMConfig.upsert({
      where: { id: "mlm_config" },
      create: {
        id: "mlm_config",
        isEnabled: result.data.isEnabled,
        maxLevels: result.data.maxLevels,
        commissionBasis: result.data.commissionBasis,
        levelRates: result.data.levelRates,
      },
      update: {
        isEnabled: result.data.isEnabled,
        maxLevels: result.data.maxLevels,
        commissionBasis: result.data.commissionBasis,
        levelRates: result.data.levelRates,
      }
    });

    revalidatePath("/admin/settings/affiliate/mlm-configuration");
    return { success: true, message: "Network settings saved." };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to save." };
  }
}