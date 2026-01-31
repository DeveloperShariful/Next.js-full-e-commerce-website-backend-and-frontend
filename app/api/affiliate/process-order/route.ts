//app/api/affiliate/process-order/route.ts

import { NextResponse } from "next/server";
import { processOrder } from "@/app/actions/admin/settings/affiliate/affiliate-engine";
import { auditService } from "@/lib/services/audit-service";
import { hmacService } from "@/lib/security/hmac-service";
import { db } from "@/lib/prisma"; 

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const start = Date.now();
  
  try {
    const apiKey = req.headers.get("x-api-key");
    const signature = req.headers.get("x-hmac-signature");
    const validKey = process.env.INTERNAL_API_KEY;

    let isAuthorized = false;

    const bodyText = await req.text();
    let body;
    
    try {
      body = JSON.parse(bodyText);
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    if (validKey && apiKey === validKey) {
      isAuthorized = true;
    } 
    else if (signature && hmacService.verify(bodyText, signature)) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      await auditService.systemLog("WARN", "API_SECURITY", "Unauthorized access attempt to process-order", { 
        ip: req.headers.get("x-forwarded-for"),
        hasSignature: !!signature
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = body;
    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }
    const idempotencyKey = hmacService.generateIdempotencyKey("ORDER_PROCESS", orderId);
    const existingReferral = await db.referral.findFirst({
      where: { orderId: orderId },
      select: { id: true }
    });

    if (existingReferral) {
       await auditService.systemLog("INFO", "IDEMPOTENCY", `Order ${orderId} already processed. Skipping.`, { idempotencyKey });
       return NextResponse.json({ success: true, message: "Already processed (Idempotent)" });
    }
    const result = await processOrder(orderId);

    const duration = Date.now() - start;
    
    if (result?.success) {
      await auditService.systemLog("INFO", "AFFILIATE_ENGINE", `Order ${orderId} processed successfully`, { duration, commission: result.commission });
    } else if (result?.error) {
      const level = ["ORDER_NOT_FOUND", "ALREADY_PROCESSED", "ZERO_COMMISSION_IGNORED"].includes(result.error) ? "INFO" : "WARN";
      await auditService.systemLog(level, "AFFILIATE_ENGINE", `Skipped Order ${orderId}`, { reason: result.error });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    await auditService.systemLog("CRITICAL", "API_ERROR", "Process Order API Crash", { error: error.message, stack: error.stack });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}