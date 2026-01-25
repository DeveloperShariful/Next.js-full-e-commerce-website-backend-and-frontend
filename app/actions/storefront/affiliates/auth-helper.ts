////app/actions/storefront/affiliates/auth-helper.ts

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function getAuthUser() {
  // ১. Clerk থেকে লগইন করা ইউজারের Clerk ID নেওয়া
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return null;
  }

  // ২. সেই Clerk ID দিয়ে আপনার ডাটাবেস থেকে আসল User (UUID) খুঁজে বের করা
  const user = await db.user.findUnique({
    where: { clerkId: clerkId }, // নিশ্চিত হোন আপনার স্কিমাতে clerkId আছে
    select: { id: true }
  });

  if (!user) {
    // যদি Clerk এ থাকে কিন্তু ডাটাবেসে না থাকে
    return null;
  }

  // ৩. ডাটাবেসের UUID রিটার্ন করা
  return user.id;
}

// এই ফাংশনটি পেজে ব্যবহার করবেন, এটি ইউজার না পেলে অটোমেটিক লগইন পেজে পাঠাবে
export async function requireUser() {
  const userId = await getAuthUser();
  
  if (!userId) {
    redirect("/sign-in"); // অথবা আপনার লগইন রাউট
  }
  
  return userId;
}