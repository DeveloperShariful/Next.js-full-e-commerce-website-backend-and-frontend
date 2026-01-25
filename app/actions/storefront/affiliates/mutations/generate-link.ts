//app/actions/storefront/affiliates/mutations/generate-link.ts

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { marketingService } from "../_services/marketing-service";
import { db } from "@/lib/prisma";

// Schema
const linkSchema = z.object({
  userId: z.string(),
  destinationUrl: z.string().url("Please enter a valid URL (e.g. https://gobike.au/product/1)"),
  customSlug: z.string()
    .min(3, "Slug must be at least 3 chars")
    .regex(/^[a-zA-Z0-9-_]+$/, "Alphanumeric only")
    .optional()
    .or(z.literal("")),
  campaignId: z.string().optional(),
});

type LinkInput = z.infer<typeof linkSchema>;

/**
 * SERVER ACTION: Generate Short Link
 */
export async function generateLinkAction(data: LinkInput) {
  try {
    const result = linkSchema.safeParse(data);
    if (!result.success) {
      return { success: false, message: result.error.issues[0].message };
    }

    // Get Affiliate ID from User ID
    const affiliate = await db.affiliateAccount.findUnique({
        where: { userId: data.userId },
        select: { id: true }
    });

    if (!affiliate) return { success: false, message: "Affiliate account not found." };

    await marketingService.createLink(
      affiliate.id,
      result.data.destinationUrl,
      result.data.customSlug || undefined,
      result.data.campaignId || undefined
    );

    revalidatePath("/affiliates/marketing/links");
    return { success: true, message: "Link generated successfully!" };

  } catch (error: any) {
    return { success: false, message: error.message || "Failed to generate link." };
  }
}