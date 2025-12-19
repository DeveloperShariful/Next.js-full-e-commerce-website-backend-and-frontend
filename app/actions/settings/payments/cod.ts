// File: app/actions/settings/payments/cod.ts
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateCODSettings(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    
    // ✅ FIX: getAll থেকে ডাটা নিয়ে string এ কনভার্ট করা হয়েছে
    const settings = {
        instructions: formData.get("setting_instructions") as string || "",
        enableForShippingMethods: formData.getAll("setting_enable_shipping").map(v => v as string)
    };

    await db.paymentMethodConfig.update({
      where: { id },
      data: {
        name,
        description,
        settings: settings as any
      }
    });

    revalidatePath("/admin/settings/payments");
    return { success: true, message: "COD settings saved" };
  } catch (error) {
    return { success: false, error: "Failed to save COD settings" };
  }
}