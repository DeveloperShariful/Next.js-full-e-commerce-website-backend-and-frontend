// File: app/actions/backend/affiliate/_services/pixel-domain-service.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auditService } from "@/lib/audit-service";
import { ActionResponse, TrackingPixelItem } from "../types";
import { protectAction } from "../permission-service"; 
import crypto from "crypto";
import dns from "dns/promises"; 
import { z } from "zod";

// ==============================================================================
// SECTION 1: PIXEL MANAGEMENT (DYNAMIC JSON ENGINE)
// ==============================================================================

const pixelSchema = z.object({
  id: z.string(),
  type: z.string().min(1),
  pixelId: z.string().min(1),
  enabled: z.boolean().default(true),
  createdAt: z.string()
});

type PixelInput = z.infer<typeof pixelSchema>;

export async function getAllPixels(): Promise<TrackingPixelItem[]> {
  await protectAction("MANAGE_CONFIGURATION");
  
  // Fetch all accounts that have pixels
  const accounts = await db.affiliateAccount.findMany({
    where: { pixels: { not: undefined } },
    select: { 
      id: true, 
      slug: true, 
      user: { select: { name: true, email: true } }, 
      pixels: true 
    }
  });

  let allPixels: TrackingPixelItem[] = [];

  accounts.forEach(acc => {
    const parsed = z.array(pixelSchema).safeParse(acc.pixels);
    if (parsed.success) {
      parsed.data.forEach(pixel => {
        allPixels.push({
          id: pixel.id,
          affiliateName: acc.user.name || acc.slug || "Unknown",
          type: pixel.type,
          pixelId: pixel.pixelId,
          status: pixel.enabled,
          createdAt: new Date(pixel.createdAt)
        });
      });
    }
  });

  return allPixels.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function createPixelAction(data: { affiliateId: string; type: string; pixelId: string }): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_CONFIGURATION");
    
    if (!data.affiliateId || !data.type || !data.pixelId) {
       return { success: false, message: "Missing required fields." };
    }

    const affiliate = await db.affiliateAccount.findFirst({
        where: { id: data.affiliateId, deletedAt: null, status: "ACTIVE" }
    });
    
    if (!affiliate) return { success: false, message: "Affiliate not found or inactive." };

    const parsed = z.array(pixelSchema).safeParse(affiliate.pixels);
    let currentPixels = parsed.success ? parsed.data : [];

    const newPixel: PixelInput = {
      id: crypto.randomUUID(),
      type: data.type,
      pixelId: data.pixelId,
      enabled: true,
      createdAt: new Date().toISOString()
    };

    currentPixels.push(newPixel);

    await db.affiliateAccount.update({
      where: { id: affiliate.id },
      data: { pixels: currentPixels as any }
    });

    await auditService.log({
      userId: actor.id,
      action: "CREATE_PIXEL",
      entity: "AffiliateAccount",
      entityId: affiliate.id,
      newData: newPixel
    });

    revalidatePath("/admin/affiliate/pixels");
    return { success: true, message: "Tracking pixel added." };
  } catch (error: any) {
    return { success: false, message: "Failed to create pixel." };
  }
}

export async function togglePixelStatusAction(id: string, isEnabled: boolean): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_CONFIGURATION");
    
    // Find the affiliate containing this pixel ID
    const accounts = await db.affiliateAccount.findMany({
      where: { pixels: { not: undefined } },
      select: { id: true, pixels: true }
    });

    let targetAccount = null;
    let updatedPixels: PixelInput[] = [];

    for (const acc of accounts) {
      const parsed = z.array(pixelSchema).safeParse(acc.pixels);
      if (parsed.success) {
        const index = parsed.data.findIndex(p => p.id === id);
        if (index > -1) {
          targetAccount = acc;
          updatedPixels = [...parsed.data];
          updatedPixels[index].enabled = isEnabled;
          break;
        }
      }
    }

    if (!targetAccount) return { success: false, message: "Pixel not found." };

    await db.affiliateAccount.update({
      where: { id: targetAccount.id },
      data: { pixels: updatedPixels as any }
    });

    await auditService.log({
      userId: actor.id,
      action: "TOGGLE_PIXEL_STATUS",
      entity: "AffiliateAccount",
      entityId: targetAccount.id,
      meta: { pixelId: id, isEnabled }
    });

    revalidatePath("/admin/affiliate/pixels");
    return { success: true, message: `Pixel ${isEnabled ? "enabled" : "disabled"}.` };
  } catch (error: any) {
    return { success: false, message: "Failed to update status." };
  }
}

export async function deletePixelAction(id: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_CONFIGURATION");
    
    const accounts = await db.affiliateAccount.findMany({
      where: { pixels: { not: undefined } },
      select: { id: true, pixels: true }
    });

    let targetAccount = null;
    let updatedPixels: PixelInput[] = [];

    for (const acc of accounts) {
      const parsed = z.array(pixelSchema).safeParse(acc.pixels);
      if (parsed.success && parsed.data.some(p => p.id === id)) {
        targetAccount = acc;
        updatedPixels = parsed.data.filter(p => p.id !== id);
        break;
      }
    }

    if (!targetAccount) return { success: false, message: "Pixel not found." };

    await db.affiliateAccount.update({
      where: { id: targetAccount.id },
      data: { pixels: updatedPixels as any }
    });

    await auditService.log({
        userId: actor.id,
        action: "DELETE_PIXEL",
        entity: "AffiliateAccount",
        entityId: targetAccount.id,
        meta: { deletedPixelId: id }
    });

    revalidatePath("/admin/affiliate/pixels");
    return { success: true, message: "Pixel deleted." };
  } catch (error: any) {
    return { success: false, message: "Failed to delete pixel." };
  }
}

// ==============================================================================
// SECTION 2: DOMAIN MANAGEMENT (Database Model Kept Intact for Uniqueness)
// ==============================================================================

const domainSchema = z.object({
  affiliateId: z.string().min(1, "Affiliate ID is required"),
  domain: z.string()
    .min(4, "Domain is too short")
    .regex(/^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/, "Invalid domain format (e.g. shop.example.com)"),
});

export async function getAllDomains() {
  try {
    await protectAction("MANAGE_CONFIGURATION");

    return await db.affiliateDomain.findMany({
      include: {
        affiliate: {
          select: {
            user: { select: { name: true, email: true } },
            slug: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  } catch (error) {
    throw new Error("Failed to load domains.");
  }
}

export async function addDomainAction(data: z.infer<typeof domainSchema>): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_CONFIGURATION");
    const result = domainSchema.safeParse(data);
    if (!result.success) return { success: false, message: result.error.issues[0].message };
    const { affiliateId, domain } = result.data;
    const cleanDomain = domain.toLowerCase();
    
    const existing = await db.affiliateDomain.findUnique({
      where: { domain: cleanDomain }
    });
    if (existing) return { success: false, message: "Domain is already registered." };
    
    const affiliate = await db.affiliateAccount.findFirst({
        where: { id: affiliateId, deletedAt: null }
    });
    if (!affiliate) return { success: false, message: "Affiliate does not exist." };
    
    const appName = process.env.NEXT_PUBLIC_APP_NAME || "app";
    const cleanName = appName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const token = `${cleanName}-verify-${crypto.randomBytes(8).toString("hex")}`;
    
    const record = await db.affiliateDomain.create({
      data: {
        affiliateId,
        domain: cleanDomain,
        verificationToken: token,
        isVerified: false
      }
    });

    await auditService.log({
      userId: actor.id,
      action: "ADD_DOMAIN",
      entity: "AffiliateDomain",
      entityId: record.id,
      newData: { domain: cleanDomain, affiliateId }
    });
    revalidatePath("/admin/affiliate/domains");
    return { success: true, message: "Domain added. Verification required." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function verifyDomainAction(id: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_CONFIGURATION");
    const record = await db.affiliateDomain.findUnique({ where: { id } });
    if (!record) return { success: false, message: "Domain not found." };
    if (record.isVerified) return { success: true, message: "Already verified." };
    let isMatch = false;
    
    try {
      const txtRecords = await dns.resolveTxt(record.domain);
      isMatch = txtRecords.flat().some(txt => txt.includes(record.verificationToken!));
    } catch (e) {
      console.error("DNS Lookup failed:", e);
      if (process.env.NODE_ENV === "production") {
        return { success: false, message: "DNS lookup failed. Ensure TXT record is propagated." };
      }
    }

    if (process.env.NODE_ENV === "development") {
        console.log("DEV MODE: Skipping real DNS check for", record.domain);
        isMatch = true; 
    }

    if (isMatch) {
      await db.affiliateDomain.update({
        where: { id },
        data: { isVerified: true, isActive: true }
      });
      
      await auditService.log({
        userId: actor.id,
        action: "VERIFY_DOMAIN",
        entity: "AffiliateDomain",
        entityId: id,
        newData: { isVerified: true }
      });
      revalidatePath("/admin/affiliate/domains");
      return { success: true, message: "Domain verified successfully." };
    } else {
      return { success: false, message: "DNS TXT record not found matching the token." };
    }
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function deleteDomainAction(id: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_CONFIGURATION");

    await db.affiliateDomain.delete({ where: { id } });

    await auditService.log({
        userId: actor.id,
        action: "DELETE_DOMAIN",
        entity: "AffiliateDomain",
        entityId: id
    });
    revalidatePath("/admin/affiliate/domains");
    return { success: true, message: "Domain removed." };
  } catch (error: any) {
    return { success: false, message: "Failed to delete domain." };
  }
}