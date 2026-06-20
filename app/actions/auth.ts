// app/actions/auth.ts
"use server";

import { signIn } from "@/auth";
import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string).toLowerCase(); 
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Email and password are required" };

  try {
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) return { error: "Email already in use" };

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await db.user.create({
      data: { name, email, password: hashedPassword },
    });

    await db.wallet.create({
      data: { userId: newUser.id, balance: 0, points: 0 },
    });

  } catch (error) {
    // যদি ডাটাবেজ লেভেলে কোনো এরর হয়
    return { error: "Could not create account. Please try again." };
  }

  // রেজিস্ট্রেশন শেষে লগইন পেজে রিডাইরেক্ট
  redirect("/sign-in");
}

export async function loginUser(formData: FormData) {
  const email = (formData.get("email") as string).toLowerCase();
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/admin", 
    });
  } catch (error: any) {
    // --- এরর ফিক্স লজিক ---
    // Next.js-এ redirect() আসলে একটি 'NEXT_REDIRECT' এরর থ্রো করে। 
    // ইমপোর্ট ছাড়াই সেটি চেক করার উপায় নিচে দেওয়া হলো:
    if (error?.digest?.includes("NEXT_REDIRECT")) {
      throw error;
    }

    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password." };
        default:
          return { error: "Something went wrong." };
      }
    }
    
    return { error: "An unexpected error occurred." };
  }
}