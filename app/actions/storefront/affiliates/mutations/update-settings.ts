//app/actions/storefront/affiliates/mutations/update-settings.ts

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";

// ... (settingsSchema এবং updateSettingsAction আগের মতোই থাকবে) ...

const settingsSchema = z.object({
  userId: z.string(),
  paypalEmail: z.string().email().optional().or(z.literal("")),
  bankDetails: z.object({
    bankName: z.string().optional(),
    accountName: z.string().optional(),
    accountNumber: z.string().optional(),
  }).optional(),
});

type SettingsInput = z.infer<typeof settingsSchema>;

export async function updateSettingsAction(data: SettingsInput) {
  try {
    const result = settingsSchema.safeParse(data);
    if (!result.success) {
      return { success: false, message: "Invalid data format" };
    }

    const { userId, paypalEmail, bankDetails } = result.data;

    await db.affiliateAccount.update({
      where: { userId },
      data: {
        paypalEmail: paypalEmail || null,
        bankDetails: bankDetails ? JSON.stringify(bankDetails) : undefined,
      }
    });

    revalidatePath("/affiliates/settings");
    return { success: true, message: "Settings updated successfully." };
  } catch (error) {
    return { success: false, message: "Failed to update settings." };
  }
}

// ✅ FIX: Adding Pixel with Correct Field Names
export async function addPixelAction(userId: string, provider: "FACEBOOK" | "GOOGLE" | "TIKTOK", pixelId: string) {
  try {
    const affiliate = await db.affiliateAccount.findUnique({ where: { userId } });
    if (!affiliate) throw new Error("Not found");

    await db.affiliatePixel.create({
      data: {
        affiliateId: affiliate.id,
        // ✅ FIX: 'provider' -> 'type'
        type: provider,
        pixelId,
        // ✅ FIX: 'enabled' -> 'isEnabled'
        isEnabled: true
      }
    });
    
    revalidatePath("/affiliates/settings");
    return { success: true, message: "Pixel added." };
  } catch (error) {
    return { success: false, message: "Failed to add pixel." };
  }
}