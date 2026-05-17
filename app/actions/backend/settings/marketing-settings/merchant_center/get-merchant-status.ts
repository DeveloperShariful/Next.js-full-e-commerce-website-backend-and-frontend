// File: app/actions/admin/settings/marketing-settings/merchant_center/get-merchant-status.ts
"use server";

import { getGoogleContentClient } from "./google-auth";
import { content_v2_1 } from "googleapis"; // Import types

export async function getMerchantStatus() {
  try {
    const { content, merchantId } = await getGoogleContentClient();

    const response = await content.productstatuses.list({
      merchantId,
      maxResults: 250,
    });

    const resources = response.data.resources || [];

    let active = 0;
    let pending = 0;
    let disapproved = 0;

    // ✅ FIX: Added Type Definition for 'item'
    resources.forEach((item: content_v2_1.Schema$ProductStatus) => {
      // ✅ FIX: Added Type Definition for 'd'
      const shoppingStatus = item.destinationStatuses?.find(
        (d: content_v2_1.Schema$ProductStatusDestinationStatus) => d.destination === "Shopping"
      );
      
      if (shoppingStatus) {
        if (shoppingStatus.status === "approved") active++;
        else if (shoppingStatus.status === "pending") pending++;
        else if (shoppingStatus.status === "disapproved") disapproved++;
      }
    });

    return {
      success: true,
      data: {
        active,
        pending,
        disapproved,
        total: resources.length
      }
    };

  } catch (error: any) {
    console.error("GMC Status Error:", error);
    return { 
      success: false, 
      message: error.message || "Failed to fetch status from Google." 
    };
  }
}