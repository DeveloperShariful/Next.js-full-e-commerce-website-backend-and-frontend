// app/actions/settings.ts

"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getSettings() {
  try {
    const settings = await db.storeSettings.findUnique({
      where: { id: "settings" }
    });
    return { success: true, data: settings };
  } catch (error) {
    return { success: false, error: "Failed to fetch settings" };
  }
}

export async function updateSettings(formData: FormData) {
  try {
    // 1. General Settings
    const storeName = formData.get("storeName") as string;
    const storeEmail = formData.get("storeEmail") as string;
    const storePhone = formData.get("storePhone") as string;
    const currency = formData.get("currency") as string;
    const currencySymbol = formData.get("currencySymbol") as string;
    const maintenance = formData.get("maintenance") === "true";
    
    // 2. Social Links (JSON)
    const socialLinks = {
      facebook: (formData.get("social_facebook") as string) || "",
      instagram: (formData.get("social_instagram") as string) || "",
      twitter: (formData.get("social_twitter") as string) || "",
      youtube: (formData.get("social_youtube") as string) || "",
    };

    // 3. Payment Config (JSON)
    const paymentConfig = {
      cod: {
        enabled: formData.get("payment_cod_enabled") === "true",
      },
      bkash: {
        enabled: formData.get("payment_bkash_enabled") === "true",
        number: (formData.get("payment_bkash_number") as string) || "",
        type: (formData.get("payment_bkash_type") as string) || "Personal",
      },
      stripe: {
        enabled: formData.get("payment_stripe_enabled") === "true",
        publicKey: (formData.get("payment_stripe_public") as string) || "",
        secretKey: (formData.get("payment_stripe_secret") as string) || "",
      },
      paypal: {
        enabled: formData.get("payment_paypal_enabled") === "true",
        clientId: (formData.get("payment_paypal_client") as string) || "",
        secret: (formData.get("payment_paypal_secret") as string) || "",
      },
      sslcommerz: {
        enabled: formData.get("payment_ssl_enabled") === "true",
        storeId: (formData.get("payment_ssl_id") as string) || "",
        storePassword: (formData.get("payment_ssl_pass") as string) || "",
      }
    };

    // 4. SMTP Config (JSON)
    const smtpConfig = {
      host: (formData.get("smtp_host") as string) || "",
      port: (formData.get("smtp_port") as string) || "",
      user: (formData.get("smtp_user") as string) || "",
      pass: (formData.get("smtp_pass") as string) || "",
    };

    // Database Operation
    await db.storeSettings.upsert({
      where: { id: "settings" },
      update: {
        storeName,
        storeEmail,
        storePhone,
        currency,
        currencySymbol,
        maintenance: maintenance, // ✅ FIXED: isMaintenance -> maintenance
        socialLinks: socialLinks as any,
        paymentConfig: paymentConfig as any,
        smtpConfig: smtpConfig as any,
      },
      create: {
        id: "settings",
        storeName,
        storeEmail,
        storePhone,
        currency,
        currencySymbol,
        maintenance: maintenance, // ✅ FIXED: isMaintenance -> maintenance
        socialLinks: socialLinks as any,
        paymentConfig: paymentConfig as any,
        smtpConfig: smtpConfig as any,
      }
    });

    revalidatePath("/admin/settings");
    return { success: true, message: "Settings updated successfully!" };

  } catch (error: any) {
    console.error("SETTINGS_UPDATE_ERROR", error);
    return { success: false, error: "Failed to update settings." };
  }
}