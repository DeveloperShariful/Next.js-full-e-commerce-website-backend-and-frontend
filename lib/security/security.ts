// File: lib/security/security.ts

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { Role } from "@prisma/client";
const rateLimitMap = new Map<string, { count: number; expires: number }>();

export const security = {
  async getCurrentUser() {
    const { userId: clerkId } = await auth();
    if (!clerkId) return null;
    const user = await db.user.findUnique({
      where: { clerkId },
      select: { id: true, role: true, email: true, isActive: true }
    });

    return user;
  },
  async assertAdmin() {
    const user = await this.getCurrentUser();

    if (!user) {
      throw new Error("UNAUTHORIZED: Please login first.");
    }

    if (!user.isActive) {
      throw new Error("FORBIDDEN: Your account is disabled.");
    }

    const allowedRoles: Role[] = ["SUPER_ADMIN", "ADMIN"];
    
    if (!allowedRoles.includes(user.role)) {
      throw new Error(`FORBIDDEN: Access denied. Role required: ADMIN. Current: ${user.role}`);
    }

    return user;
  },
  checkRateLimit(key: string, limit: number = 5, windowSeconds: number = 60) {
    const now = Date.now();
    const record = rateLimitMap.get(key);

    if (!record || now > record.expires) {
      rateLimitMap.set(key, { count: 1, expires: now + (windowSeconds * 1000) });
      return true;
    }

    if (record.count >= limit) {
      throw new Error(`RATE_LIMIT: Too many requests. Try again in ${Math.ceil((record.expires - now) / 1000)}s.`);
    }

    record.count += 1;
    return true;
  }
};