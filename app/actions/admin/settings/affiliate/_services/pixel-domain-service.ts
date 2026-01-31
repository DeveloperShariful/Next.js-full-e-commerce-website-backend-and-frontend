// File: app/actions/admin/settings/affiliate/_services/pixel-domain-service.ts

"use server";

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auditService } from "@/lib/services/audit-service";
import { ActionResponse } from "../types";
import { protectAction } from "../permission-service"; // ✅ Security
import crypto from "crypto";
import dns from "dns/promises"; 
import { z } from "zod";

// ==============================================================================
// SECTION 1: PIXEL MANAGEMENT (Merged from pixel-service.ts)
// ==============================================================================

// --- READ PIXELS ---
export async function getAllPixels() {
  await protectAction("MANAGE_CONFIGURATION");

  return await db.affiliatePixel.findMany({
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
}

// --- CREATE PIXEL ---
export async function createPixelAction(data: Prisma.AffiliatePixelCreateInput): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_CONFIGURATION");

    const pixel = await db.affiliatePixel.create({ data });
    
    await auditService.log({
      userId: actor.id,
      action: "CREATE_PIXEL",
      entity: "AffiliatePixel",
      entityId: pixel.id,
      newData: data
    });

    revalidatePath("/admin/settings/affiliate/pixels");
    return { success: true, message: "Tracking pixel added." };
  } catch (error: any) {
    return { success: false, message: "Failed to create pixel." };
  }
}

// --- TOGGLE PIXEL STATUS ---
export async function togglePixelStatusAction(id: string, isEnabled: boolean): Promise<ActionResponse> {
  try {
    await protectAction("MANAGE_CONFIGURATION");

    await db.affiliatePixel.update({
      where: { id },
      data: { isEnabled }
    });

    revalidatePath("/admin/settings/affiliate/pixels");
    return { success: true, message: `Pixel ${isEnabled ? "enabled" : "disabled"}.` };
  } catch (error: any) {
    return { success: false, message: "Failed to update status." };
  }
}

// --- DELETE PIXEL ---
export async function deletePixelAction(id: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_CONFIGURATION");

    await db.affiliatePixel.delete({
      where: { id }
    });

    await auditService.log({
      userId: actor.id,
      action: "DELETE_PIXEL",
      entity: "AffiliatePixel",
      entityId: id
    });

    revalidatePath("/admin/settings/affiliate/pixels");
    return { success: true, message: "Pixel deleted." };
  } catch (error: any) {
    return { success: false, message: "Failed to delete pixel." };
  }
}

// ==============================================================================
// SECTION 2: DOMAIN MANAGEMENT (Merged from domain-service.ts)
// ==============================================================================

const domainSchema = z.object({
  affiliateId: z.string().min(1, "Affiliate ID is required"),
  domain: z.string()
    .min(4, "Domain is too short")
    .regex(/^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/, "Invalid domain format (e.g. shop.example.com)"),
});

// --- READ DOMAINS ---
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

// --- ADD DOMAIN ---
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

    revalidatePath("/admin/settings/affiliate/domains");
    return { success: true, message: "Domain added. Verification required." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// --- VERIFY DOMAIN ---
export async function verifyDomainAction(id: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_CONFIGURATION");

    const record = await db.affiliateDomain.findUnique({ where: { id } });
    if (!record) return { success: false, message: "Domain not found." };

    if (record.isVerified) return { success: true, message: "Already verified." };

    // ✅ DNS Verification Logic (Preserved)
    let isMatch = false;
    try {
      const txtRecords = await dns.resolveTxt(record.domain);
      isMatch = txtRecords.flat().some(txt => txt.includes(record.verificationToken!));
    } catch (e) {
      return { success: false, message: "DNS lookup failed. Ensure TXT record is propagated." };
    }
    
    // Dev Bypass
    if (process.env.NODE_ENV === "development") isMatch = true;

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

      revalidatePath("/admin/settings/affiliate/domains");
      return { success: true, message: "Domain verified successfully." };
    } else {
      return { success: false, message: "DNS TXT record not found matching the token." };
    }
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// --- DELETE DOMAIN ---
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

    revalidatePath("/admin/settings/affiliate/domains");
    return { success: true, message: "Domain removed." };
  } catch (error: any) {
    return { success: false, message: "Failed to delete domain." };
  }
}