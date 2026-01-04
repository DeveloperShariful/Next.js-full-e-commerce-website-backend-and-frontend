// File: app/actions/admin/settings/marketing-settings/update-marketing-config.ts
"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { MarketingSettingsSchema, MarketingSettingsValues } from "@/app/(admin)/admin/settings/marketing-settings/_schema/marketing-validation";

// --- Verification Helper Functions ---

async function verifyGTM(containerId: string): Promise<boolean> {
  if (!containerId) return false;
  try {
    const response = await fetch(`https://www.googletagmanager.com/gtm.js?id=${containerId}`, {
      method: "HEAD",
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

async function verifyFacebookPixel(pixelId: string): Promise<boolean> {
  if (!pixelId) return false;
  try {
    const response = await fetch(`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`, {
        method: "HEAD",
        headers: { "User-Agent": "Mozilla/5.0" }
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// ✅ FIX: Updated Klaviyo Authentication Headers
async function verifyKlaviyo(privateKey: string): Promise<boolean> {
  if (!privateKey) return false;
  try {
    // Klaviyo requires explicit 'Authorization' header and 'revision'
    const response = await fetch("https://a.klaviyo.com/api/lists/", {
      method: "GET",
      headers: { 
        "Authorization": `Klaviyo-API-Key ${privateKey}`,
        "revision": "2024-02-15", // Stable API revision
        "accept": "application/json"
      }
    });
    return response.status === 200;
  } catch (error) {
    console.error("Klaviyo Verify Error:", error);
    return false;
  }
}

// --- Main Update Action ---

export async function updateMarketingConfig(data: MarketingSettingsValues) {
  try {
    const validatedData = MarketingSettingsSchema.parse(data);
    const errors: Record<string, string> = {};

    // --- Step A: Real-time Verification ---
    
    // 1. Verify GTM
    let gtmValid = false;
    if (validatedData.gtmEnabled && validatedData.gtmContainerId) {
        gtmValid = await verifyGTM(validatedData.gtmContainerId);
        if (!gtmValid) {
            errors.gtmContainerId = "Invalid GTM Container ID. Google returned 404.";
        }
    }

    // 2. Verify Facebook
    let fbValid = false;
    if (validatedData.fbEnabled && validatedData.fbPixelId) {
        fbValid = await verifyFacebookPixel(validatedData.fbPixelId);
        if (!fbValid) {
            errors.fbPixelId = "Pixel ID Verification failed.";
        }
    }

    // 3. Verify Klaviyo
    let klaviyoValid = false;
    if (validatedData.klaviyoEnabled && validatedData.klaviyoPrivateKey) {
        klaviyoValid = await verifyKlaviyo(validatedData.klaviyoPrivateKey);
        if (!klaviyoValid) {
             errors.klaviyoPrivateKey = "Invalid API Key. Access denied.";
        }
    }

    // --- Step B: Prepare Data ---
    
    const newVerificationStatus = {
        gtm: gtmValid,
        facebook: fbValid,
        klaviyo: klaviyoValid,
        searchConsole: !!validatedData.gscVerificationCode,
        merchantCenter: !!validatedData.gmcMerchantId
    };

    const dataToSave = {
      ...validatedData,
      verificationStatus: newVerificationStatus,
      fbDataProcessingOptions: validatedData.fbDataProcessingOptions 
        ? JSON.parse(validatedData.fbDataProcessingOptions) 
        : undefined,
    };

    // --- Step C: Save to Database ---
    await db.marketingIntegration.upsert({
      where: { id: "marketing_config" },
      update: dataToSave,
      create: {
        id: "marketing_config",
        ...dataToSave,
      },
    });

    revalidatePath("/admin/settings/marketing-settings");
    
    // Return appropriate response
    if (Object.keys(errors).length > 0) {
        return { 
            success: false, 
            message: "Settings saved, but verification failed.",
            fieldErrors: errors,
            newStatus: newVerificationStatus 
        };
    }
    
    return { 
        success: true, 
        message: "Settings verified and saved successfully!",
        newStatus: newVerificationStatus 
    };

  } catch (error) {
    console.error("Failed to update marketing config:", error);
    return { success: false, message: "Internal server error" };
  }
}