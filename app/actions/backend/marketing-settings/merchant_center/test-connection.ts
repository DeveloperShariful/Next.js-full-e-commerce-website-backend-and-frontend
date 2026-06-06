// File: app/actions/admin/settings/marketing-settings/merchant_center/test-connection.ts
"use server";

import { getGoogleContentClient } from "./google-auth";

export async function testMerchantConnection(jsonKey: string, merchantId: string) {
  if (!jsonKey || !merchantId) {
    return { success: false, message: "Missing Merchant ID or JSON Key." };
  }

  try {
    // Pass credentials directly to helper
    const { content, merchantId: validId } = await getGoogleContentClient(jsonKey, merchantId);

    // Try to fetch authinfo (Lightweight API call to check access)
    await content.accounts.authinfo({
        auth: (content.context._options as any).auth
    });

    // If auth works, try to list 1 product to verify Content API access
    await content.productstatuses.list({
      merchantId: validId,
      maxResults: 1,
    });

    return { success: true, message: "Connection successful! Credentials are valid." };

  } catch (error: any) {
    console.error("Test Connection Error:", error);
    
    let msg = error.message;
    if (msg.includes("401")) msg = "Unauthorized. Check if Service Account email is added as Admin in GMC.";
    if (msg.includes("404")) msg = "Merchant ID not found or Service Account has no access.";
    if (msg.includes("invalid_grant")) msg = "Invalid Key. The JSON key might be expired or wrong.";

    return { success: false, message: msg };
  }
}