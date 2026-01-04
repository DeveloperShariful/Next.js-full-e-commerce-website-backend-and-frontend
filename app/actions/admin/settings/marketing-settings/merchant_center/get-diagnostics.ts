// File: app/actions/admin/settings/marketing-settings/merchant_center/get-diagnostics.ts
"use server";

import { getGoogleContentClient } from "./google-auth";
import { content_v2_1 } from "googleapis";

export async function getMerchantDiagnostics() {
  try {
    const { content, merchantId } = await getGoogleContentClient();

    // 1. Get Account Level Issues
    const accountStatus = await content.accountstatuses.get({
      merchantId,
      accountId: merchantId,
    });

    const accountIssues = accountStatus.data.accountLevelIssues || [];

    // 2. Get Product Level Issues
    const productStatuses = await content.productstatuses.list({
      merchantId,
      maxResults: 50,
    });

    const productIssues: any[] = [];

    // ✅ FIX: Added Types
    productStatuses.data.resources?.forEach((prod: content_v2_1.Schema$ProductStatus) => {
      const shoppingStatus = prod.destinationStatuses?.find(
        (d: content_v2_1.Schema$ProductStatusDestinationStatus) => d.destination === "Shopping"
      );
      
      if (shoppingStatus?.status === "disapproved") {
        prod.itemLevelIssues?.forEach((issue: content_v2_1.Schema$ProductStatusItemLevelIssue) => {
          productIssues.push({
            productId: prod.productId,
            title: prod.title,
            code: issue.code,
            description: issue.description,
            detail: issue.detail,
          });
        });
      }
    });

    return {
      success: true,
      accountIssues,
      productIssues
    };

  } catch (error: any) {
    console.error("GMC Diagnostics Error:", error);
    return { success: false, message: error.message };
  }
}