// File: app/actions/admin/settings/marketing-settings/merchant_center/google-auth.ts
"use server";

import { google } from "googleapis";
import { db } from "@/lib/prisma";

export async function getGoogleContentClient() {
  // 1. Get Config from DB
  const config = await db.marketingIntegration.findUnique({
    where: { id: "marketing_config" },
  });

  if (!config?.gmcContentApiEnabled || !config?.gscServiceAccountJson || !config?.gmcMerchantId) {
    throw new Error("Merchant Center or Service Account not configured.");
  }

  // 2. Parse Service Account JSON
  let credentials;
  try {
    credentials = JSON.parse(config.gscServiceAccountJson);
  } catch (e) {
    throw new Error("Invalid Service Account JSON.");
  }

  // 3. Create Auth Client
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/content"],
  });

  // 4. Return Content API Client
  const content = google.content({ version: "v2.1", auth });
  
  return { content, merchantId: config.gmcMerchantId, config };
}