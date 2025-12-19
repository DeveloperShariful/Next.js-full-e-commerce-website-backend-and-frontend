// File: app/actions/settings/payments/stripe.ts
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateStripeSettings(formData: FormData) {
  try {
    const id = formData.get("id") as string; // PaymentMethodConfig ID
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    // 1. Update Main Config (Title & Description)
    await db.paymentMethodConfig.update({
        where: { id },
        data: { name, description }
    });

    // 2. Update Stripe Config Table
    const publishableKey = formData.get("setting_publishableKey") as string || "";
    const secretKey = formData.get("setting_secretKey") as string || "";
    const webhookSecret = formData.get("setting_webhookSecret") as string || "";
    
    // Checkbox returns "on" or "true" if checked, otherwise null
    const isTestModeRaw = formData.get("setting_isTestMode");
    const isTestMode = isTestModeRaw === "true" || isTestModeRaw === "on";

    await db.stripeConfig.upsert({
        where: { paymentMethodId: id },
        create: {
            paymentMethodId: id,
            publishableKey, 
            secretKey, 
            webhookSecret, 
            isTestMode
        },
        update: {
            publishableKey, 
            secretKey, 
            webhookSecret, 
            isTestMode
        }
    });

    revalidatePath("/admin/settings/payments");
    return { success: true, message: "Stripe settings saved" };
  } catch (error) {
    console.error("STRIPE_UPDATE_ERROR", error);
    return { success: false, error: "Failed to save Stripe settings" };
  }
}