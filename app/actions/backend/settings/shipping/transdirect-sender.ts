// File: app/actions/settings/shipping/transdirect-sender.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- SAVE SENDER DETAILS ---
export async function saveTransdirectSender(formData: FormData) {
  try {
    const senderName = formData.get("senderName") as string;
    const senderCompany = formData.get("senderCompany") as string;
    const senderPhone = formData.get("senderPhone") as string;
    const senderAddress = formData.get("senderAddress") as string;
    const senderSuburb = formData.get("senderSuburb") as string;
    const senderPostcode = formData.get("senderPostcode") as string;
    const senderState = formData.get("senderState") as string;
    const senderType = (formData.get("senderType") as string) || "business";
    const senderCountry = "AU"; // Transdirect mainly AU

    await db.transdirectConfig.upsert({
      where: { id: "transdirect_config" },
      update: {
        senderName,
        senderCompany,
        senderPhone,
        senderAddress,
        senderSuburb,
        senderPostcode,
        senderState,
        senderType,
        senderCountry
      },
      create: {
        id: "transdirect_config",
        senderName,
        senderCompany,
        senderPhone,
        senderAddress,
        senderSuburb,
        senderPostcode,
        senderState,
        senderType,
        senderCountry: "AU"
      }
    });

    revalidatePath("/admin/settings/shipping");
    return { success: true, message: "Sender details saved" };
  } catch (error) {
    console.error("SAVE_SENDER_ERROR", error);
    return { success: false, error: "Failed to save sender details" };
  }
}