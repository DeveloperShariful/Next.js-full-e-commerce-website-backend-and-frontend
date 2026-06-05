// app/actions/storefront/affiliates/_services/auth-actions.ts

"use server";

import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

export async function registerAffiliateAction(data: { username: string; email: string; password: string }) {
  const { username, email, password } = data;

  if (!username || !email || !password) {
    return { success: false, message: "All fields are required." };
  }

  try {
    const emailNormalized = email.toLowerCase().trim();
    
    // 1. Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: emailNormalized }
    });

    if (existingUser) {
      return { success: false, message: "A user with this email already exists." };
    }

    // 2. Hash password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create User & Affiliate Account in a single transaction (Atomic)
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: username.trim(),
          email: emailNormalized,
          role: "AFFILIATE", // Force role as Affiliate
          password: hashedPassword,
          isActive: true,
        }
      });

      // Generate unique affiliate slug
      const baseSlug = username.toLowerCase().replace(/[^a-z0-9]/g, '');
      const uniqueSlug = `${baseSlug}-${nanoid(4)}`;

      const affiliate = await tx.affiliateAccount.create({
        data: {
          userId: user.id,
          slug: uniqueSlug,
          status: "PENDING", // Wait for Admin approval
        }
      });

      return { userId: user.id, affiliateId: affiliate.id };
    });

    return { 
      success: true, 
      message: "Registration successful! Your application is pending admin review." 
    };

  } catch (error: any) {
    console.error("Affiliate Registration Error:", error);
    return { 
      success: false, 
      message: error.message || "An unexpected error occurred during registration." 
    };
  }
}