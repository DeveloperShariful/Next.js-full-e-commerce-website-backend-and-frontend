// app/actions/auth.ts
"use server";

import { signIn } from "@/auth";
import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function registerUser(formData: FormData) {
  const name = ((formData.get("name") as string) ?? "").trim();
  const email = ((formData.get("email") as string) ?? "").toLowerCase().trim();
  const password = (formData.get("password") as string) ?? "";

  if (!email || !password) return { error: "Email and password are required" };
  if (password.length < 8) return { error: "Password must be at least 8 characters" };

  try {
    const existingUser = await db.user.findUnique({ where: { email }, select: { id: true, password: true } });

    // Real account exists (has password) — reject
    if (existingUser?.password) return { error: "Email already in use" };

    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser) {
      // Ghost account (created by review/subscribe, no password) — upgrade to real account
      await db.user.update({
        where: { id: existingUser.id },
        data: { name: name || undefined, password: hashedPassword, role: 'CUSTOMER', isActive: true },
      });
      const walletExists = await db.wallet.findUnique({ where: { userId: existingUser.id } });
      if (!walletExists) {
        await db.wallet.create({ data: { userId: existingUser.id, balance: 0, points: 0 } });
      }
    } else {
      const newUser = await db.user.create({
        data: { name: name || null, email, password: hashedPassword },
      });
      await db.wallet.create({
        data: { userId: newUser.id, balance: 0, points: 0 },
      });
    }
  } catch {
    return { error: "Could not create account. Please try again." };
  }

  redirect("/sign-in");
}

export async function loginUser(formData: FormData) {
  const email = ((formData.get("email") as string) ?? "").toLowerCase().trim();
  const password = (formData.get("password") as string) ?? "";

  try {
    await signIn("credentials", { email, password, redirectTo: "/admin" });
  } catch (error: unknown) {
    // Next.js redirect() throws a NEXT_REDIRECT error — must re-throw it
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      typeof (error as Record<string, unknown>).digest === "string" &&
      (error as Record<string, string>).digest.includes("NEXT_REDIRECT")
    ) {
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
