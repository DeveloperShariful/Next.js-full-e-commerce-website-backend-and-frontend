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
      const staffRoles = ["ADMIN", "SUPER_ADMIN", "MANAGER", "EDITOR", "SUPPORT"];
      if (staffRoles.includes(existingUser.role)) {
        return { success: false, message: "This email belongs to a staff account and cannot be used for affiliate registration." };
      }

      // Check if already has affiliate account
      const existingAffiliate = await db.affiliateAccount.findUnique({
        where: { userId: existingUser.id },
      });
      if (existingAffiliate) {
        return { success: false, message: "You already have an affiliate account. Please use the Login form.", alreadyAffiliate: true };
      }

      // Existing customer — verify their password
      const passwordMatch = existingUser.password
        ? await bcrypt.compare(password, existingUser.password)
        : false;

      if (!passwordMatch) {
        return {
          success: false,
          message: "This email is already registered as a customer account. Enter your existing account password to apply as an affiliate.",
          isExistingCustomer: true,
        };
      }

      // Password correct — create AffiliateAccount only (role stays CUSTOMER)
      const baseSlug = (existingUser.name || username).toLowerCase().replace(/[^a-z0-9]/g, "");
      const uniqueSlug = `${baseSlug}-${nanoid(4)}`;

      await db.affiliateAccount.create({
        data: {
          userId: existingUser.id,
          slug: uniqueSlug,
          status: "PENDING",
        },
      });

      return {
        success: true,
        message: "Affiliate application submitted! Your customer account now has affiliate access. Pending admin approval.",
        wasCustomer: true,
      };
    }

    // 2. Brand new user — hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create User & Affiliate Account atomically (new users keep role as CUSTOMER)
    const baseSlug = username.toLowerCase().replace(/[^a-z0-9]/g, "");
    const uniqueSlug = `${baseSlug}-${nanoid(4)}`;

    await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: username.trim(),
          email: emailNormalized,
          role: "CUSTOMER",
          password: hashedPassword,
          isActive: true,
        },
      });
      await tx.affiliateAccount.create({
        data: {
          userId: user.id,
          slug: uniqueSlug,
          status: "PENDING",
        },
      });
    });

    return {
      success: true,
      message: "Registration successful! Your application is pending admin review.",
    };

  } catch (error: any) {
    console.error("Affiliate Registration Error:", error);
    return { 
      success: false, 
      message: error.message || "An unexpected error occurred during registration." 
    };
  }
}