// File: app/actions/settings/payments/paypal.ts
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updatePaypalSettings(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    // 1. Update Main Config
    await db.paymentMethodConfig.update({
        where: { id },
        data: { name, description }
    });

    // 2. Update PayPal Config Table
    const email = formData.get("setting_email") as string || "";
    const clientId = formData.get("setting_clientId") as string || "";
    const clientSecret = formData.get("setting_clientSecret") as string || "";
    const environment = formData.get("setting_environment") as string || "sandbox"; // 'sandbox' or 'production'

    await db.paypalConfig.upsert({
        where: { paymentMethodId: id },
        create: {
            paymentMethodId: id,
            email, clientId, clientSecret, environment
        },
        update: {
            email, clientId, clientSecret, environment
        }
    });

    revalidatePath("/admin/settings/payments");
    return { success: true, message: "PayPal settings saved" };
  } catch (error) {
    console.error("PAYPAL_UPDATE_ERROR", error);
    return { success: false, error: "Failed to save PayPal settings" };
  }
}