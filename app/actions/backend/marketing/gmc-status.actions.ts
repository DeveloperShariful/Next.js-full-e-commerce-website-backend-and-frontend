//app/actions/backend/marketing/gmc-status.actions.ts

"use server";

import { db } from "@/lib/prisma";

export async function getLocalProductChannelStatus(productId: string) {
  try {
    const status = await db.productChannelStatus.findUnique({
      where: { productId_channel: { productId, channel: "GOOGLE" } }
    });
    
    // Prisma Decimal/Date ডাটা সিরিয়ালাইজ করা
    if (status) {
      return {
        success: true,
        status: {
          ...status,
          googleIssues: status.googleIssues ? JSON.parse(JSON.stringify(status.googleIssues)) : null,
          lastSyncedAt: status.lastSyncedAt ? status.lastSyncedAt.toISOString() : null,
          createdAt: status.createdAt.toISOString(),
          updatedAt: status.updatedAt.toISOString(),
        }
      };
    }
    return { success: true, status: null };
  } catch (error) {
    console.error("Error reading local channel status:", error);
    return { success: false, status: null };
  }
}