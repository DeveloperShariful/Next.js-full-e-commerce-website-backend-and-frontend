// app/actions/storefront/affiliates/_services/settings-service.ts

"use server";

import { db } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getAuthAffiliate } from "../auth-helper";
import crypto from "crypto";

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

// Since AffiliateDocumentType Enum is deleted, we define it via Zod for the JSON
const kycSchema = z.object({
  type: z.enum(["PASSPORT", "DRIVING_LICENSE", "NATIONAL_ID", "TAX_FORM"]),
  url: z.string().url("Invalid file URL"),
  number: z.string().min(3, "Document number required"),
});

const pixelJsonSchema = z.object({
  id: z.string(),
  type: z.string(),
  pixelId: z.string(),
  enabled: z.boolean(),
  createdAt: z.string()
});

const kycJsonSchema = z.object({
  type: z.string(),
  url: z.string(),
  documentNumber: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  rejectionReason: z.string().optional(),
  verifiedAt: z.string().optional()
});

type SettingsInput = z.infer<typeof settingsSchema>;
type KYCInput = z.infer<typeof kycSchema>;

// ==========================================
// 2. READ SERVICES
// ==========================================

export async function getSettings(userId: string) {
  const affiliate = await db.affiliateAccount.findUnique({
    where: { userId },
    select: {
      id: true,
      paypalEmail: true,
      bankDetails: true,
      pixels: true,          // ✅ Fetching from JSON
      kycDocuments: true,    // ✅ Fetching from JSON
      isKyced: true,
      kycStatus: true
    }
  });

  if (!affiliate) return null;

  // Safe parsing for JSON Arrays
  const parsedPixels = z.array(pixelJsonSchema).safeParse(affiliate.pixels);
  const parsedDocs = z.array(kycJsonSchema).safeParse(affiliate.kycDocuments);

  const pixels = parsedPixels.success ? parsedPixels.data : [];
  const documents = parsedDocs.success ? parsedDocs.data : [];

  return {
    id: affiliate.id,
    paypalEmail: affiliate.paypalEmail,
    bankDetails: affiliate.bankDetails as any, 
    pixels: pixels.map(p => ({
      id: p.id,
      provider: p.type, 
      pixelId: p.pixelId,
      enabled: p.enabled 
    })),
    
    kyc: {
        isVerified: affiliate.isKyced || affiliate.kycStatus === "VERIFIED",
        documents: documents.map((d, index) => ({
            id: `doc-${index}`, // JSON array doesn't have native ID, generating one for UI
            type: d.type,
            status: d.status,
            url: d.url,           
            number: d.documentNumber, 
            feedback: d.rejectionReason, 
            createdAt: d.verifiedAt || new Date().toISOString() // Fallback date
        }))
    }
  };
}

// ==========================================
// 3. MUTATIONS (JSON Array Operations)
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
        // Prisma saves JSON directly, stringify is not strictly needed for Json fields but keeping as per your design
        bankDetails: bankDetails as any, 
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
    
    // 1. Fetch current pixels JSON
    const account = await db.affiliateAccount.findUnique({
      where: { id: affiliate.id },
      select: { pixels: true }
    });

    const parsed = z.array(pixelJsonSchema).safeParse(account?.pixels);
    let currentPixels = parsed.success ? parsed.data : [];

    // 2. Append new pixel
    currentPixels.push({
      id: crypto.randomUUID(),
      type: provider,
      pixelId: pixelId,
      enabled: true,
      createdAt: new Date().toISOString()
    });

    // 3. Update DB
    await db.affiliateAccount.update({
      where: { id: affiliate.id },
      data: { pixels: currentPixels as any }
    });
    
    revalidatePath("/affiliates/settings");
    return { success: true, message: "Pixel added." };
  } catch (error) {
    return { success: false, message: "Failed to add pixel." };
  }
}

// ✅ Upload KYC Document (Fixed for JSON Array)
export async function uploadKYCAction(data: KYCInput) {
    try {
        const affiliate = await getAuthAffiliate();
        
        const result = kycSchema.safeParse(data);
        if(!result.success) return { success: false, message: "Invalid data" };

        // 1. Fetch current documents
        const account = await db.affiliateAccount.findUnique({
          where: { id: affiliate.id },
          select: { kycDocuments: true }
        });

        const parsed = z.array(kycJsonSchema).safeParse(account?.kycDocuments);
        let currentDocs = parsed.success ? parsed.data : [];

        // 2. Check duplicate pending
        const existingPending = currentDocs.find(
            d => d.type === result.data.type && d.status === "PENDING"
        );

        if(existingPending) {
            return { success: false, message: "A document of this type is already under review." };
        }

        // 3. Append new document to array
        currentDocs.push({
            type: result.data.type,
            url: result.data.url,
            documentNumber: result.data.number,
            status: "PENDING"
        });

        // 4. Update DB
        await db.affiliateAccount.update({
            where: { id: affiliate.id },
            data: {
                kycDocuments: currentDocs as any,
                kycStatus: "PENDING_REVIEW" // Update global status
            }
        });

        revalidatePath("/affiliates/settings");
        return { success: true, message: "Document uploaded for review." };

    } catch(error) {
        console.error("KYC Upload Error:", error);
        return { success: false, message: "Failed to upload document." };
    }
}