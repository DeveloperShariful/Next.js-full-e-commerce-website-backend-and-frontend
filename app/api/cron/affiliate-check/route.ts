// File: app/api/cron/affiliate-check/route.ts

import { NextResponse } from "next/server";
import { auditService } from "@/lib/services/audit-service";
import { processDailyJobs } from "@/app/actions/admin/settings/affiliate/cron-service";

export const dynamic = 'force-dynamic'; // Prevent caching

export async function GET(req: Request) {
  try {
    // 1. Security Check
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    
    if (secret !== process.env.CRON_SECRET) {
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