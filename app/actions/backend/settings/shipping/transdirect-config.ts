// File: app/actions/settings/shipping/transdirect-config.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- GET CONFIG ---
export async function getTransdirectConfig() {
  try {
    let config = await db.transdirectConfig.findUnique({
      where: { id: "transdirect_config" }
    });

    // ✅ FIX: Serialize data to handle Decimal objects
    const serializedConfig = config ? JSON.parse(JSON.stringify(config)) : null;

    if (!serializedConfig) {
      return { success: true, data: null };
    }

    return { success: true, data: serializedConfig };
  } catch (error) {
    console.error("GET_TRANSDIRECT_ERROR", error);
    return { success: false, error: "Failed to fetch Transdirect settings" };
  }
}

// --- SAVE CREDENTIALS ---
export async function saveTransdirectCredentials(formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const apiKey = formData.get("apiKey") as string;
    const isEnabled = formData.get("isEnabled") === "true";

    await db.transdirectConfig.upsert({
      where: { id: "transdirect_config" },
      update: { email, password, apiKey, isEnabled },
      create: { 
        id: "transdirect_config",
        email, 
        password, 
        apiKey, 
        isEnabled 
      }
    });

    revalidatePath("/admin/settings/shipping");
    return { success: true, message: "Credentials saved successfully" };
  } catch (error) {
    console.error("SAVE_CRED_ERROR", error);
    return { success: false, error: "Failed to save credentials" };
  }
}

// --- SAVE PREFERENCES (Controls) ---
export async function saveTransdirectPreferences(formData: FormData) {
  try {
    const defaultTailgatePickup = formData.get("defaultTailgatePickup") === "true";
    const defaultTailgateDelivery = formData.get("defaultTailgateDelivery") === "true";
    const defaultDeclaredValue = formData.get("defaultDeclaredValue") === "true";
    const enableOrderBoxing = formData.get("enableOrderBoxing") === "true";

    await db.transdirectConfig.upsert({
      where: { id: "transdirect_config" },
      update: {
        defaultTailgatePickup,
        defaultTailgateDelivery,
        defaultDeclaredValue,
        enableOrderBoxing
      },
      create: {
        id: "transdirect_config",
        defaultTailgatePickup,
        defaultTailgateDelivery,
        defaultDeclaredValue,
        enableOrderBoxing
      }
    });

    revalidatePath("/admin/settings/shipping");
    return { success: true, message: "Preferences updated" };
  } catch (error) {
    return { success: false, error: "Failed to update preferences" };
  }
}

// --- SAVE PRICING RULES ---
export async function saveTransdirectPricing(formData: FormData) {
  try {
    const raw = (key: string) => (formData.get(key) as string | null)?.trim() || null;
    const toDecimal = (key: string) => {
      const v = raw(key);
      return v && !isNaN(parseFloat(v)) ? parseFloat(v) : null;
    };

    const data = {
      handlingFee:            raw("handlingFee"),
      markupRule1Threshold:   toDecimal("markupRule1Threshold"),
      markupRule1Fee:         raw("markupRule1Fee"),
      markupRule2Threshold:   toDecimal("markupRule2Threshold"),
      markupRule2Fee:         raw("markupRule2Fee"),
      markupRule3Fee:         raw("markupRule3Fee"),
      discountRule1Threshold: toDecimal("discountRule1Threshold"),
      discountRule1Amount:    raw("discountRule1Amount"),
      discountRule2Threshold: toDecimal("discountRule2Threshold"),
      discountRule2Amount:    raw("discountRule2Amount"),
      globalShippingDiscount: raw("globalShippingDiscount"),
      autoTailgateKg:         toDecimal("autoTailgateKg") ?? 25,
      debugMode:              formData.get("debugMode") === "true",
    };

    await db.transdirectConfig.upsert({
      where:  { id: "transdirect_config" },
      update: data,
      create: { id: "transdirect_config", ...data },
    });

    revalidatePath("/admin/settings/shipping");
    return { success: true, message: "Pricing rules saved successfully" };
  } catch (error) {
    console.error("SAVE_PRICING_ERROR", error);
    return { success: false, error: "Failed to save pricing rules" };
  }
}