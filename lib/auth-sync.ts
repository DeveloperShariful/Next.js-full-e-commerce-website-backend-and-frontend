//lib/auth-sync.ts

// lib/auth-sync.ts

import { auth } from "@/auth"; // NextAuth এর auth ফাংশন
import { db } from "@/lib/prisma";

export async function syncUser() {
  try {
    const session = await auth();

    // সেশনে ইউজার না থাকলে null রিটার্ন করবে
    if (!session?.user?.email) return null;

    // NextAuth সরাসরি আমাদের ডাটাবেজ ব্যবহার করে, তাই নতুন করে Sync করার কিছু নেই।
    // আমরা শুধু বর্তমান ইউজারের লেটেস্ট ডাটাবেজ রেকর্ডটি ফেচ করে রিটার্ন করব।
    const existingUser = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (existingUser) {
      return existingUser;
    }

    return null;

  } catch (error) {
    console.error("⚠️ User Fetch Failed:", error);
    return null;
  }
}