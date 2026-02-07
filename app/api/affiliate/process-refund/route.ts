// File: app/api/affiliate/process-refund/route.ts

import { NextResponse } from "next/server";
import { processRefund } from "@/app/actions/admin/settings/affiliate/affiliate-engine";
import { auditService } from "@/lib/audit-service";
import { hmacService } from "@/lib/hmac-service";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
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
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    if (validKey && apiKey === validKey) {
      isAuthorized = true;
    } else if (signature && hmacService.verify(bodyText, signature)) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      await auditService.systemLog("WARN", "API_SECURITY", "Unauthorized refund attempt", { ip: req.headers.get("x-forwarded-for") });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validate Payload
    const { orderId, itemIds } = body;
    
    if (!orderId || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: "Invalid payload. 'orderId' and 'itemIds' array required." }, { status: 400 });
    }
    const result = await processRefund(orderId, itemIds);

    if (result.success) {
      await auditService.systemLog("INFO", "AFFILIATE_REFUND", `Processed refund for Order ${orderId}`, { 
        deduction: result.deduction,
        items: itemIds 
      });
      return NextResponse.json(result);
    } else {
      await auditService.systemLog("WARN", "AFFILIATE_REFUND", `Refund skipped for Order ${orderId}`, { reason: result.message });
      return NextResponse.json(result); // Return 200 even if skipped to acknowledge receipt
    }

  } catch (error: any) {
    console.error("Refund API Error:", error);
    await auditService.systemLog("CRITICAL", "API_ERROR", "Refund API Crash", { error: error.message });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}