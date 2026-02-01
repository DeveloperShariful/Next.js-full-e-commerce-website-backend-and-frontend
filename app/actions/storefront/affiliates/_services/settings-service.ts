//app/actions/storefront/affiliates/_services/settings-service.ts

"use server";

import { db } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getAuthAffiliate } from "../auth-helper"; 

// ==========================================
// 1. VALIDATION SCHEMAS
// ==========================================

const settingsSchema = z.object({
  paypalEmail: z.string().email("Invalid email format").optional().or(z.literal("")),
  bankDetails: z.object({
    bankName: z.string().optional(),
    accountName: z.string().optional(),
    accountNumber: z.string().optional(),
  }).optional(),
});

type SettingsInput = z.infer<typeof settingsSchema>;

// ==========================================
// 2. READ SERVICES
// ==========================================
export async function getSettings(userId: string) {
  const affiliate = await db.affiliateAccount.findUnique({
    where: { userId },
    include: { pixels: true }
  });

  if (!affiliate) return null;

  return {
    id: affiliate.id,
    paypalEmail: affiliate.paypalEmail,
    bankDetails: affiliate.bankDetails as any, 
    pixels: affiliate.pixels.map(p => ({
      id: p.id,
      provider: p.type, 
      pixelId: p.pixelId,
      enabled: p.isEnabled 
    }))
  };
}

// ==========================================
// 3. MUTATIONS (Fixed Types & Optimized)
// ==========================================

export async function updateSettingsAction(data: SettingsInput) {
  try {
    const affiliate = await getAuthAffiliate(); 
    
    const result = settingsSchema.safeParse(data);
    if (!result.success) {
      return { success: false, message: result.error.issues[0].message };
    }

    const { paypalEmail, bankDetails } = result.data;

    await db.affiliateAccount.update({
      where: { id: affiliate.id }, 
      data: {
        paypalEmail: paypalEmail || null,
        bankDetails: bankDetails ? JSON.stringify(bankDetails) : undefined,
      }
    });

    revalidatePath("/affiliates/settings");
    return { success: true, message: "Settings updated successfully." };

  } catch (error) {
    console.error("Update Error:", error);
    return { success: false, message: "Failed to update settings." };
  }
}

export async function addPixelAction(provider: "FACEBOOK" | "GOOGLE" | "TIKTOK", pixelId: string) {
  try {
    const affiliate = await getAuthAffiliate();
    await db.affiliatePixel.create({
      data: {
        affiliateId: affiliate.id, 
        type: provider,
        pixelId,
        isEnabled: true
      }
    });
    
    revalidatePath("/affiliates/settings");
    return { success: true, message: "Pixel added." };
  } catch (error) {
    return { success: false, message: "Failed to add pixel." };
  }
}