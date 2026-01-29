//app/api/affiliate/process-order/route.ts

import { NextResponse } from "next/server";
// ✅ Correct Import Path and using named import
import { processOrder } from "@/app/actions/admin/settings/affiliates/affiliate-engine";
import { auditService } from "@/lib/services/audit-service";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const start = Date.now();
  
  try {
    const apiKey = req.headers.get("x-api-key");
    const validKey = process.env.INTERNAL_API_KEY;

    if (!validKey || apiKey !== validKey) {
      await auditService.systemLog("WARN", "API_SECURITY", "Unauthorized access attempt to process-order", { ip: req.headers.get("x-forwarded-for") });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    // ✅ Call the named export directly
    const result = await processOrder(orderId);

    const duration = Date.now() - start;
    if (result?.success) {
      await auditService.systemLog("INFO", "AFFILIATE_ENGINE", `Order ${orderId} processed`, { duration, commission: result.commission });
    } else if (result?.error) {
      const level = ["ORDER_NOT_FOUND", "ALREADY_PROCESSED"].includes(result.error) ? "INFO" : "WARN";
      await auditService.systemLog(level, "AFFILIATE_ENGINE", `Skipped Order ${orderId}`, { reason: result.error });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    await auditService.systemLog("CRITICAL", "API_ERROR", "Process Order API Crash", { error: error.message, stack: error.stack });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}