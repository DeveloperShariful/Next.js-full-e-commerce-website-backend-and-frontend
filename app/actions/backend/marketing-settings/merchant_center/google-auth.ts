// File: app/actions/admin/settings/marketing-settings/merchant_center/google-auth.ts
"use server";

import { google } from "googleapis";
import { db } from "@/lib/prisma";

// Allow passing explicit credentials for testing
export async function getGoogleContentClient(explicitJson?: string, explicitMerchantId?: string) {
  let credentials;
  let merchantId = explicitMerchantId;

  // Case A: Testing with new input (Before Saving)
  if (explicitJson) {
    try {
      credentials = JSON.parse(explicitJson);
    } catch (e) {
      throw new Error("Invalid JSON format provided.");
    }
  } 
  // Case B: Normal usage (Load from DB)
  else {
    const config = await db.marketingIntegration.findUnique({
      where: { id: "marketing_config" },
    });

    if (!config?.gscServiceAccountJson || !config?.gmcMerchantId) {
      throw new Error("Merchant Center or Service Account not configured.");
    }

    try {
      credentials = JSON.parse(config.gscServiceAccountJson);
    } catch (e) {
      throw new Error("Invalid Service Account JSON in database.");
    }
    
    merchantId = config.gmcMerchantId;
  }

  if (!merchantId) {
     throw new Error("Merchant ID is missing.");
  }

  // Create Auth Client
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/content"],
  });

  const content = google.content({ version: "v2.1", auth });
  
  return { content, merchantId };
}