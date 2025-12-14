// actions/register.ts

"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { RegisterSchema } from "@/schemas";
import { Role } from "@prisma/client";

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, password, name } = validatedFields.data;

  // ১. চেক করি ইউজার আগে থেকেই আছে কিনা
  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "Email already in use!" };
  }

  // ২. পাসওয়ার্ড এনক্রিপ্ট করা
  const hashedPassword = await bcrypt.hash(password, 10);

  // ৩. ইউজার তৈরি করা (ডিফল্ট রোল: CUSTOMER)
  await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: Role.CUSTOMER, // Default role
    },
  });

  // TODO: Send verification email here (ভবিষ্যতে অ্যাড করব)

  return { success: "Account created! Please login." };
};