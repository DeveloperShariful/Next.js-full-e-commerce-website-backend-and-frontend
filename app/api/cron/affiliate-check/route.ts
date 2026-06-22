// File: app/api/cron/affiliate-check/route.ts

import { NextResponse } from "next/server";
import { auditService } from "@/lib/audit-service";
import { processDailyJobs } from "@/app/actions/backend/affiliate/cron-service";

export const dynamic = 'force-dynamic'; 

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const querySecret = searchParams.get('secret');
    // Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
    const authHeader = req.headers instanceof Headers ? req.headers.get("authorization") : null;
    const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (querySecret !== process.env.CRON_SECRET && bearerSecret !== process.env.CRON_SECRET) {
      await auditService.systemLog("WARN", "CRON_API", "Unauthorized cron attempt", { ip: "external" });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log("🔄 Starting Affiliate Cron Job via API...");
    const result = await processDailyJobs();

    if (!result.success) {
      throw new Error(result.error || "Cron job failed internally");
    }

    return NextResponse.json({ 
      success: true, 
      message: "Daily jobs executed successfully",
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Cron Job Failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}