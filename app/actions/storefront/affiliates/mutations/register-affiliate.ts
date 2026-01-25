//app/actions/storefront/affiliates/mutations/register-affiliate.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
// ✅ এই লাইনটি যোগ করুন (Enum টি ইম্পোর্ট করুন)
import { CommissionType } from "@prisma/client"; 

export async function registerAffiliateAction(userId: string) {
  try {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, message: "User not found." };
    }

    const existing = await db.affiliateAccount.findUnique({ where: { userId } });
    if (existing) {
      return { success: false, message: "You are already an affiliate." };
    }

    const baseSlug = user.name?.toLowerCase().replace(/\s+/g, "") || "partner";
    const slug = `${baseSlug}-${nanoid(4)}`;

    await db.affiliateAccount.create({
      data: {
        userId,
        slug,
        status: "ACTIVE",
        balance: 0,
        totalEarnings: 0,
        commissionRate: 10,
        commissionType: CommissionType.PERCENTAGE, 
      }
    });

    revalidatePath("/affiliates");
    return { success: true, message: "Registration successful!" };
    
  } catch (error: any) {
    console.error("Register Error:", error);
    return { success: false, message: "Failed to register. Please try again." };
  }
}