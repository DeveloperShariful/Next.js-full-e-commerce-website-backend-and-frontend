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