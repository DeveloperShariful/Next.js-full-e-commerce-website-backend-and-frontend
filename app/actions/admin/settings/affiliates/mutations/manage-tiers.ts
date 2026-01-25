// File: app/actions/admin/settings/affiliate/mutations/manage-tiers.ts

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { tierService } from "../_services/tier-service";
import { ActionResponse } from "../types";
import { CommissionType } from "@prisma/client";

// Zod Schema for Tier Input (Validation)
const tierSchema = z.object({
  id: z.string().optional(), // Optional for create, required for update
  name: z.string().min(2, "Name must be at least 2 characters."),
  commissionRate: z.coerce.number().min(0, "Rate cannot be negative."),
  commissionType: z.nativeEnum(CommissionType).default("PERCENTAGE"),
  minSalesAmount: z.coerce.number().min(0).default(0),
  minSalesCount: z.coerce.number().min(0).default(0),
  color: z.string().optional(),
  icon: z.string().optional(),
});

type TierInput = z.infer<typeof tierSchema>;

/**
 * SERVER ACTION: Create or Update an Affiliate Tier
 */
export async function upsertTier(data: TierInput): Promise<ActionResponse> {
  try {
    // 1. Validate Input
    const result = tierSchema.safeParse(data);
    if (!result.success) {
      return {
        success: false,
        message: "Validation failed.",
        errors: result.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const payload = result.data;

    // 2. Determine Action (Create vs Update)
    if (payload.id) {
      // Update
      await tierService.updateTier(payload.id, {
        name: payload.name,
        commissionRate: payload.commissionRate,
        commissionType: payload.commissionType,
        minSalesAmount: payload.minSalesAmount,
        minSalesCount: payload.minSalesCount,
        color: payload.color,
        icon: payload.icon,
      });
    } else {
      // Create
      await tierService.createTier({
        name: payload.name,
        commissionRate: payload.commissionRate,
        commissionType: payload.commissionType,
        minSalesAmount: payload.minSalesAmount,
        minSalesCount: payload.minSalesCount,
        color: payload.color,
        icon: payload.icon,
      });
    }

    // 3. Revalidate
    revalidatePath("/admin/settings/affiliate/tiers");
    return { success: true, message: payload.id ? "Tier updated." : "Tier created." };

  } catch (error: any) {
    return { success: false, message: error.message || "Operation failed." };
  }
}

/**
 * SERVER ACTION: Delete a Tier
 */
export async function deleteTierAction(tierId: string): Promise<ActionResponse> {
  try {
    if (!tierId) return { success: false, message: "ID is required." };

    await tierService.deleteTier(tierId);
    
    revalidatePath("/admin/settings/affiliate/tiers");
    return { success: true, message: "Tier deleted successfully." };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to delete tier." };
  }
}