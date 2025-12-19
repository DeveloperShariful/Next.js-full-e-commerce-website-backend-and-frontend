// File: app/actions/settings/payments/bank.ts
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateBankSettings(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    
    // ✅ FIX: "as string" যোগ করা হয়েছে
    const settings = {
        instructions: formData.get("setting_instructions") as string || "",
        accountDetails: formData.get("setting_accountDetails") as string || ""
    };

    await db.paymentMethodConfig.update({
      where: { id },
      data: {
        name,
        description,
        settings: settings as any // Prisma Json এর জন্য any কাস্ট করা নিরাপদ
      }
    });

    revalidatePath("/admin/settings/payments");
    return { success: true, message: "Bank settings saved" };
  } catch (error) {
    return { success: false, error: "Failed to save bank settings" };
  }
}