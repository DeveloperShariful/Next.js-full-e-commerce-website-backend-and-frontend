//app/actions/storefront/affiliates/_services/settings-service.ts

"use server";

import { db } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getAuthAffiliate } from "../auth-helper";
import { AffiliateDocumentType, AffiliateDocumentStatus } from "@prisma/client";

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

const kycSchema = z.object({
  type: z.nativeEnum(AffiliateDocumentType),
  url: z.string().url("Invalid file URL"),
  number: z.string().min(3, "Document number required"),
});

type SettingsInput = z.infer<typeof settingsSchema>;
type KYCInput = z.infer<typeof kycSchema>;

// ==========================================
// 2. READ SERVICES
// ==========================================

export async function getSettings(userId: string) {
  const affiliate = await db.affiliateAccount.findUnique({
    where: { userId },
    include: { 
        pixels: true,
        documents: {
            orderBy: { createdAt: "desc" }
        }
    }
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
    })),
    
    kyc: {
        isVerified: affiliate.isKyced, // Ensure this field exists in schema
        documents: affiliate.documents.map(d => ({
            id: d.id,
            type: d.type,
            status: d.status,
            // 👇 Mapping DB fields to Frontend Props
            url: d.fileUrl,           
            number: d.documentNumber, 
            feedback: d.rejectionReason, 
            createdAt: d.createdAt
        }))
    }
  };
}

// ==========================================
// 3. MUTATIONS
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

// ✅ Upload KYC Document (Fixed for Existing Schema)
export async function uploadKYCAction(data: KYCInput) {
    try {
        const affiliate = await getAuthAffiliate();
        
        const result = kycSchema.safeParse(data);
        if(!result.success) return { success: false, message: "Invalid data" };

        // Check duplicate pending
        const existing = await db.affiliateDocument.findFirst({
            where: { 
                affiliateId: affiliate.id, 
                type: result.data.type, 
                status: AffiliateDocumentStatus.PENDING 
            }
        });

        if(existing) {
            return { success: false, message: "A document of this type is already under review." };
        }

        await db.affiliateDocument.create({
            data: {
                affiliateId: affiliate.id,
                type: result.data.type,
                status: AffiliateDocumentStatus.PENDING,
                // 👇 Saving to your existing DB fields
                fileUrl: result.data.url,       
                documentNumber: result.data.number 
            }
        });

        revalidatePath("/affiliates/settings");
        return { success: true, message: "Document uploaded for review." };

    } catch(error) {
        console.error("KYC Upload Error:", error);
        return { success: false, message: "Failed to upload document." };
    }
}