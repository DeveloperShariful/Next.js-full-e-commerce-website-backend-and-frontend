//File: app/actions/admin/settings/affiliates/mutations/manage-product-rates.ts

"use server";

import { revalidatePath } from "next/cache";
import { productRateService } from "../_services/product-rate-service";
import { ActionResponse } from "../types";
import { CommissionType } from "@prisma/client";

export async function upsertRateAction(data: {
  id?: string;
  productId: string;
  rate: number;
  type: CommissionType;
  isDisabled: boolean;
  affiliateId?: string | null;
  groupId?: string | null;
}): Promise<ActionResponse> {
  try {
    if (!data.productId) {
        return { success: false, message: "Product is required." };
    }
    if (!data.isDisabled && (data.rate === undefined || data.rate < 0)) {
        return { success: false, message: "Valid commission rate is required." };
    }

    await productRateService.upsertRate(data);

    revalidatePath("/admin/settings/affiliate/product-rates");
    return { success: true, message: "Commission rule saved." };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to save rule." };
  }
}

export async function deleteRateAction(id: string): Promise<ActionResponse> {
  try {
    await productRateService.deleteRate(id);
    revalidatePath("/admin/settings/affiliate/product-rates");
    return { success: true, message: "Rule removed." };
  } catch (error: any) {
    return { success: false, message: "Failed to delete rule." };
  }
}