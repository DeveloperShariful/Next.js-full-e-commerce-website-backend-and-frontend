//lib/auth-sync.ts

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export async function syncUser() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) return null;

    const existingUser = await db.user.findUnique({
      where: { clerkId },
    });

    if (existingUser) return existingUser;

    const clerkUser = await currentUser();
    
    if (!clerkUser) return null;

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "New User";

    const newUser = await db.user.create({
      data: {
        clerkId,
        email,
        name,

      },
    });

    console.log("✅ Global Sync: New User Created:", email);
    return newUser;

  } catch (error) {
    console.error("⚠️ User Sync Failed:", error);
    return null;
  }
}