// lib/activity-logger.ts

"use server";

import { db } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";

interface LogActivityParams {
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  userId?: string; // optional — if not provided, resolved from session
}

export async function logActivity({
  action,
  entityType,
  entityId,
  details,
  userId,
}: LogActivityParams): Promise<void> {
  try {
    let resolvedUserId = userId;

    if (!resolvedUserId) {
      const session = await auth();
      if (!session?.user) return;

      if (session.user.id) {
        resolvedUserId = session.user.id;
      } else if (session.user.email) {
        const dbUser = await db.user.findUnique({
          where: { email: session.user.email },
          select: { id: true },
        });
        if (!dbUser) return;
        resolvedUserId = dbUser.id;
      } else {
        return;
      }
    }

    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      null;

    await db.activityLog.create({
      data: {
        userId: resolvedUserId,
        action,
        entityType: entityType ?? null,
        entityId: entityId ?? null,
        details: details ? (details as unknown as Prisma.InputJsonValue) : undefined,
        ipAddress: ip,
      },
    });
  } catch (error) {
    // Never throw — logging must never break the parent action
    console.error("LOG_ACTIVITY_ERROR", error);
  }
}
