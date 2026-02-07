// File: lib/security.ts

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { headers } from "next/headers";
import { Role } from "@prisma/client";

export const security = {
  async getCurrentUser() {
    const { userId: clerkId } = await auth();
    if (!clerkId) return null;
    return await db.user.findUnique({
      where: { clerkId },
      select: { id: true, role: true, email: true, isActive: true }
    });
  },

  async assertAdmin() {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("UNAUTHORIZED");
    if (!user.isActive) throw new Error("FORBIDDEN_INACTIVE");
    
    const allowedRoles: Role[] = ["SUPER_ADMIN", "ADMIN"];
    if (!allowedRoles.includes(user.role)) throw new Error("FORBIDDEN_ROLE");
    
    return user;
  },

  async checkRateLimit(key: string, limit: number = 20, windowSeconds: number = 60) {
    const headerList = await headers();
    const ip = headerList.get("x-forwarded-for") || "unknown";
    const identifier = `${key}_${ip}`;
    const windowStart = new Date(Date.now() - windowSeconds * 1000);

    const count = await db.systemLog.count({
      where: {
        source: "RATE_LIMIT",
        message: identifier,
        createdAt: { gte: windowStart }
      }
    });

    if (count >= limit) {
      throw new Error("RATE_LIMIT_EXCEEDED");
    }

    await db.systemLog.create({
      data: {
        level: "INFO",
        source: "RATE_LIMIT",
        message: identifier
      }
    });

    return true;
  }
};