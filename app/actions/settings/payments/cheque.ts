// File: app/actions/settings/payments/cheque.ts
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateChequeSettings(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    
    // ✅ FIX: "as string" যোগ করা হয়েছে
    const settings = {
        instructions: formData.get("setting_instructions") as string || "",
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
    return { success: true, message: "Check settings saved" };
  } catch (error) {
    return { success: false, error: "Failed to save check settings" };
  }
}