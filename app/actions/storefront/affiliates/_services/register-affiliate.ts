//app/actions/storefront/affiliates/mutations/register-affiliate.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { CommissionType } from "@prisma/client";
import { cookies } from "next/headers";
import { auth, currentUser } from "@clerk/nextjs/server"; 

export async function registerAffiliateAction() {
  try {
    const { userId: clerkId } = await auth();
    const user = await currentUser();
    if (!clerkId || !user) {
      return { success: false, message: "Unauthorized. Please login first." };
    }
    const dbUser = await db.user.findUnique({ 
        where: { email: user.emailAddresses[0].emailAddress } 
    });

    if (!dbUser) {
        return { success: false, message: "User profile not found in database." };
    }
    const userId = dbUser.id; 
    const existing = await db.affiliateAccount.findUnique({ where: { userId } });
    if (existing) {
      return { success: false, message: "You are already an affiliate partner." };
    }
    const settings = await db.storeSettings.findUnique({ where: { id: "settings" } });
    const affiliateConfig = (settings?.affiliateConfig as any) || {};
    const defaultRate = Number(affiliateConfig.defaultCommissionRate) || 10; 
    const baseSlug = dbUser.name?.toLowerCase().replace(/[^a-z0-9]/g, "") || "partner";
    const slug = `${baseSlug}-${nanoid(4)}`;
    const cookieStore = await cookies();
    const parentSlug = cookieStore.get("affiliate_token")?.value;
    
    let parentId: string | null = null;
    let mlmPath: string = `root.${userId}`; 
    let mlmLevel: number = 0; 

    if (parentSlug) {
      const parent = await db.affiliateAccount.findUnique({
        where: { slug: parentSlug, status: "ACTIVE" }
      });

      if (parent && parent.userId !== userId) {
        parentId = parent.id;
        mlmPath = `${parent.mlmPath || 'root'}.${userId}`;
        mlmLevel = (parent.mlmLevel || 0) + 1;
      }
    }
    await db.affiliateAccount.create({
      data: {
        userId,
        slug,
        status: "ACTIVE", 
        parentId: parentId,
        mlmPath: mlmPath,   
        mlmLevel: mlmLevel, 
        balance: 0,
        totalEarnings: 0,
        commissionRate: defaultRate, 
        commissionType: CommissionType.PERCENTAGE,
      }
    });

    revalidatePath("/affiliates");
    return { success: true, message: "Welcome to the Partner Program!" };
    
  } catch (error: any) {
    console.error("Register Error:", error);
    return { success: false, message: "Failed to register. Please try again." };
  }
}