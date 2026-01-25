//app/actions/admin/settings/affiliate/mutations/manage-domains.ts

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { domainService } from "../_services/domain-service";
import { ActionResponse } from "../types";

// Schema for adding a domain manually (Admin side)
const domainSchema = z.object({
  affiliateId: z.string().min(1, "Affiliate ID is required"),
  domain: z.string()
    .min(4, "Domain is too short")
    .regex(/^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/, "Invalid domain format (e.g. shop.example.com)"),
});

/**
 * SERVER ACTION: Add Domain
 */
export async function addDomainAction(data: z.infer<typeof domainSchema>): Promise<ActionResponse> {
  try {
    const result = domainSchema.safeParse(data);
    if (!result.success) {
      return { success: false, message: result.error.issues[0].message };
    }

    await domainService.addDomain(result.data.affiliateId, result.data.domain);
    
    revalidatePath("/admin/settings/affiliate/domains");
    return { success: true, message: "Domain added. Verification required." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * SERVER ACTION: Verify Domain
 */
export async function verifyDomainAction(id: string): Promise<ActionResponse> {
  try {
    const res = await domainService.verifyDomain(id);
    revalidatePath("/admin/settings/affiliate/domains");
    return { success: true, message: res.message };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * SERVER ACTION: Delete Domain
 */
export async function deleteDomainAction(id: string): Promise<ActionResponse> {
  try {
    await domainService.deleteDomain(id);
    revalidatePath("/admin/settings/affiliate/domains");
    return { success: true, message: "Domain removed." };
  } catch (error: any) {
    return { success: false, message: "Failed to delete domain." };
  }
}