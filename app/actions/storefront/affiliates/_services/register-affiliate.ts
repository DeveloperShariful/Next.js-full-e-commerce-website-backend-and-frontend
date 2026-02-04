//app/actions/storefront/affiliates/mutations/register-affiliate.ts

"use server";

import { db } from "@/lib/prisma";
import { requireUser } from "../auth-helper";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

// Type definition for the input
interface RegisterInput {
  slug?: string;
  website?: string;
  socialProfile?: string;
  promotionMethod?: string;
}

export async function registerAffiliateAction(data?: RegisterInput) {
  try {
    // 1. Authenticate User
    const userId = await requireUser();

    // 2. Check if already an affiliate
    const existing = await db.affiliateAccount.findUnique({
      where: { userId },
    });

    if (existing) {
      return { success: false, message: "You are already a partner." };
    }

    // 3. Get Store Settings (Check if registration is enabled)
    const settings = await db.storeSettings.findUnique({
      where: { id: "settings" },
      select: { affiliateConfig: true },
    });

    const config = (settings?.affiliateConfig as any) || {};
    if (config.registrationEnabled === false) {
      return { success: false, message: "Registration is currently closed." };
    }

    // 4. Handle SLUG (Custom or Auto-generated)
    let finalSlug = "";

    if (data?.slug && data.slug.trim() !== "") {
      // Validate Custom Slug format
      const slugRegex = /^[a-zA-Z0-9-_]+$/;
      if (!slugRegex.test(data.slug)) {
        return { success: false, message: "Invalid slug format. Use letters, numbers, hyphens only." };
      }

      // Check Uniqueness
      const isTaken = await db.affiliateAccount.findUnique({
        where: { slug: data.slug },
      });

      if (isTaken) {
        return { success: false, message: "This handle is already taken. Please choose another." };
      }

      finalSlug = data.slug;
    } else {
      // Generate random slug if none provided
      finalSlug = nanoid(8);
    }

    // 5. Create Affiliate Account
    await db.affiliateAccount.create({
      data: {
        userId,
        slug: finalSlug,
        status: config.autoApprove ? "ACTIVE" : "PENDING",
        commissionRate: config.defaultCommissionRate || 10, // Default 10%
        commissionType: "PERCENTAGE",
        cookieDuration: config.cookieDuration || 30,
        balance: 0,
        totalEarnings: 0,
        website: data?.website,
        socialProfile: data?.socialProfile,
        promotionMethod: data?.promotionMethod,
      },
    });

    // 6. Revalidate & Return Success
    revalidatePath("/affiliates");
    return { success: true, message: "Account created successfully!" };

  } catch (error: any) {
    console.error("Register Affiliate Error:", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }
}