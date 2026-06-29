// app/api/cron/cleanup-logs/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers instanceof Headers ? req.headers.get("authorization") : null;
    const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const { searchParams } = new URL(req.url);
    const querySecret = searchParams.get("secret");

    if (bearerSecret !== process.env.CRON_SECRET && querySecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    const result = await db.activityLog.deleteMany({
      where: { createdAt: { lt: fifteenDaysAgo } },
    });

    console.log(`[cleanup-logs] Deleted ${result.count} logs older than 15 days`);

    return NextResponse.json({
      success: true,
      deleted: result.count,
      cutoff: fifteenDaysAgo.toISOString(),
    });
  } catch (error) {
    console.error("CLEANUP_LOGS_CRON_ERROR", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
