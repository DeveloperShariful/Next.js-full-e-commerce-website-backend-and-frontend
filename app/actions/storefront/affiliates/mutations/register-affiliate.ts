//app/actions/storefront/affiliates/mutations/register-affiliate.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { CommissionType } from "@prisma/client";
import { cookies } from "next/headers"; // কুকি পড়ার জন্য

export async function registerAffiliateAction(userId: string) {
  try {
    // ১. ইউজার ভ্যালিডেশন
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, message: "User not found." };

    const existing = await db.affiliateAccount.findUnique({ where: { userId } });
    if (existing) return { success: false, message: "You are already an affiliate." };

    // ২. স্লাগ জেনারেশন
    const baseSlug = user.name?.toLowerCase().replace(/[^a-z0-9]/g, "") || "partner";
    const slug = `${baseSlug}-${nanoid(4)}`;

    // ৩. MLM লজিক: Parent/Sponsor খোঁজা
    const cookieStore = await cookies();
    const parentSlug = cookieStore.get("affiliate_token")?.value;
    
    let parentId: string | null = null;

    if (parentSlug) {
      // কুকিতে পাওয়া স্লাগ দিয়ে প্যারেন্ট খোঁজা
      const parent = await db.affiliateAccount.findUnique({
        where: { slug: parentSlug, status: "ACTIVE" }
      });
      
      // নিজেকে নিজে রেফার করা যাবে না (Self-Referral Check)
      if (parent && parent.userId !== userId) {
        parentId = parent.id;
      }
    }

    // ৪. অ্যাকাউন্ট তৈরি (Parent ID সহ)
    await db.affiliateAccount.create({
      data: {
        userId,
        slug,
        status: "ACTIVE", // অথবা "PENDING" রাখতে পারেন যদি ম্যানুয়াল এপ্রুভাল চান
        parentId: parentId, // এই লাইনটি MLM নেটওয়ার্ক তৈরি করবে
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