// File: app/actions/admin/settings/marketing-settings/merchant_center/sync-products.ts
"use server";

import { db } from "@/lib/prisma";
import { getGoogleContentClient } from "./google-auth";
import { content_v2_1 } from "googleapis";

export async function syncProductsToGoogle() {
  try {
    const { content, merchantId, config } = await getGoogleContentClient();

    // 1. Fetch Products from Database
    const products = await db.product.findMany({
      take: 50,
      include: {
        images: true,
      }
    });

    if (products.length === 0) {
      return { success: false, message: "No products found in database to sync." };
    }

    // 2. Prepare Batch Request
    const entries = products.map((product, index) => {
        // ✅ FIX: Use 'product.slug' if available, logic kept same
        const productUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://gobike.au'}/products/${product.slug}`; 
        
        const imageUrl = product.images && product.images.length > 0 
            ? product.images[0].url 
            : "https://gobike.au/placeholder.jpg";

        // ✅ FIX: Changed 'product.title' to 'product.name' based on your Prisma Schema error
        const productName = product.name; 
        const productDesc = product.description || productName;

        const entry: content_v2_1.Schema$ProductsCustomBatchRequestEntry = {
            batchId: index,
            merchantId,
            method: "insert",
            product: {
                offerId: product.id,
                title: productName,     // ✅ Fixed
                description: productDesc, // ✅ Fixed
                link: productUrl,
                imageLink: imageUrl,
                contentLanguage: config.gmcLanguage || "en",
                targetCountry: config.gmcTargetCountry || "AU",
                feedLabel: config.gmcTargetCountry || "AU",
                channel: "online",
                availability: "in stock",
                condition: "new",
                price: {
                    value: product.price.toString(),
                    currency: "AUD"
                },
            }
        };
        return entry;
    });

    // 3. Send to Google
    const response = await content.products.custombatch({
        requestBody: {
            entries: entries
        }
    });

    const resultEntries = response.data.entries || [];
    // ✅ FIX: Typed 'e' to avoid implicit any
    const errors = resultEntries.filter((e: content_v2_1.Schema$ProductsCustomBatchResponseEntry) => e.errors);

    if (errors.length > 0) {
        console.error("Sync Errors:", errors[0].errors);
        return { 
            success: true, 
            message: `Synced ${resultEntries.length - errors.length} products. ${errors.length} failed. Check console.` 
        };
    }

    return { success: true, message: `Successfully synced ${resultEntries.length} products to Google!` };

  } catch (error: any) {
    console.error("Sync Error:", error);
    return { success: false, message: error.message || "Sync failed" };
  }
}