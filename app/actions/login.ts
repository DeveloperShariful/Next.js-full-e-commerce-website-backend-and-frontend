"use server";

import * as z from "zod";
import { signIn } from "@/auth";
import { LoginSchema } from "@/schemas";
import { AuthError } from "next-auth";
import { db } from "@/lib/db"; // DB ইম্পোর্ট করুন
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

export const login = async (values: z.infer<typeof LoginSchema>) => {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, password } = validatedFields.data;

  // ১. ইউজারের রোল চেক করার জন্য ডাটাবেস কল
  const existingUser = await db.user.findUnique({
    where: { email }
  });

  // যদি ইউজার না থাকে বা পাসওয়ার্ড না থাকে (OAuth ইউজার)
  if (!existingUser || !existingUser.password || !existingUser.email) {
    return { error: "Email does not exist!" };
  }

  // ২. রোল অনুযায়ী রিডাইরেক্ট URL ঠিক করা
  let redirectUrl = DEFAULT_LOGIN_REDIRECT; // ডিফল্ট (যেমন: /profile বা /)
  
  // কাস্টমার ছাড়া অন্য কেউ (Admin, Manager, etc.) হলে এডমিন প্যানেলে যাবে
  if (existingUser.role !== "CUSTOMER") {
    redirectUrl = "/admin";
  } else {
    redirectUrl = "/profile"; // কাস্টমার হলে প্রোফাইলে যাবে
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: redirectUrl, // ডাইনামিক রিডাইরেক্ট
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials!" };
        default:
          return { error: "Something went wrong!" };
      }
    }
    throw error;
  }
};