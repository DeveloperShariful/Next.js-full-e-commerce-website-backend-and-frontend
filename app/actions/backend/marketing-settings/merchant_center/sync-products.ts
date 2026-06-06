// File: app/actions/admin/settings/marketing-settings/merchant_center/sync-products.ts
"use server";

import { db } from "@/lib/prisma";
import { getGoogleContentClient } from "./google-auth";
import { content_v2_1 } from "googleapis";

export async function syncProductsToGoogle() {
  try {
    // ❌ config এখান থেকে সরানো হয়েছে কারণ এটি রিটার্ন হচ্ছে না
    const { content, merchantId } = await getGoogleContentClient();

    // ✅ FIX: এখানে কনফিগারেশন ম্যানুয়ালি সেট করুন অথবা ডাটাবেস থেকে আনুন
    // যদি আপনার ডাটাবেসে সেটিংস থাকে, তবে এখানে কল করুন: const settings = await db.marketingSetting.findFirst();
    const config = {
        gmcLanguage: "en",      // অথবা settings?.gmcLanguage
        gmcTargetCountry: "AU"  // অথবা settings?.gmcTargetCountry
    };

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
        const productUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://gobike.au'}/products/${product.slug}`; 
        
        const imageUrl = product.images && product.images.length > 0 
            ? product.images[0].url 
            : "https://gobike.au/placeholder.jpg";

        const productName = product.name; 
        const productDesc = product.description || productName;

        const entry: content_v2_1.Schema$ProductsCustomBatchRequestEntry = {
            batchId: index,
            merchantId,
            method: "insert",
            product: {
                offerId: product.id,
                title: productName,
                description: productDesc,
                link: productUrl,
                imageLink: imageUrl,
                contentLanguage: config.gmcLanguage,     // ✅ এখন এটি কাজ করবে
                targetCountry: config.gmcTargetCountry,  // ✅ এখন এটি কাজ করবে
                feedLabel: config.gmcTargetCountry,
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