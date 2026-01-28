// File: app/actions/admin/settings/affiliate/_services/domain-service.ts

"use server";

import { db } from "@/lib/prisma";
import { ActionResponse } from "../types";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { auditService } from "@/lib/services/audit-service";
import dns from "dns/promises"; 
import { syncUser } from "@/lib/auth-sync";
import { z } from "zod";

const domainSchema = z.object({
  affiliateId: z.string().min(1, "Affiliate ID is required"),
  domain: z.string()
    .min(4, "Domain is too short")
    .regex(/^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/, "Invalid domain format (e.g. shop.example.com)"),
});

// =========================================
// READ OPERATIONS
// =========================================
export async function getAllDomains() {
  try {
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

// =========================================
// SERVER ACTIONS (Mutations)
// =========================================

export async function addDomainAction(data: z.infer<typeof domainSchema>): Promise<ActionResponse> {
  try {
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) return { success: false, message: "Unauthorized" };

    const result = domainSchema.safeParse(data);
    if (!result.success) return { success: false, message: result.error.issues[0].message };

    const { affiliateId, domain } = result.data;
    const cleanDomain = domain.toLowerCase();

    const existing = await db.affiliateDomain.findUnique({
      where: { domain: cleanDomain }
    });
    if (existing) return { success: false, message: "Domain is already registered." };

    const token = `gobike-verify-${crypto.randomBytes(8).toString("hex")}`;

    const record = await db.affiliateDomain.create({
      data: {
        affiliateId,
        domain: cleanDomain,
        verificationToken: token,
        isVerified: false
      }
    });

    await auditService.log({
      userId: auth.id,
      action: "CREATE",
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

export async function verifyDomainAction(id: string): Promise<ActionResponse> {
  try {
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) return { success: false, message: "Unauthorized" };

    const record = await db.affiliateDomain.findUnique({ where: { id } });
    if (!record) return { success: false, message: "Domain not found." };

    if (record.isVerified) return { success: true, message: "Already verified." };

    // Real DNS Verification Logic
    let isMatch = false;
    try {
      const txtRecords = await dns.resolveTxt(record.domain);
      // Check if any TXT record contains our token
      isMatch = txtRecords.flat().some(txt => txt.includes(record.verificationToken!));
    } catch (e) {
      // DNS lookup failed
      return { success: false, message: "DNS lookup failed. Ensure TXT record is propagated." };
    }
    
    // For Localhost/Dev bypass (Optional: Remove in Production)
    if (process.env.NODE_ENV === "development") isMatch = true;

    if (isMatch) {
      await db.affiliateDomain.update({
        where: { id },
        data: { isVerified: true, isActive: true }
      });
      
      await auditService.log({
        userId: auth.id,
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

export async function deleteDomainAction(id: string): Promise<ActionResponse> {
  try {
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) return { success: false, message: "Unauthorized" };

    await db.affiliateDomain.delete({ where: { id } });

    revalidatePath("/admin/settings/affiliate/domains");
    return { success: true, message: "Domain removed." };
  } catch (error: any) {
    return { success: false, message: "Failed to delete domain." };
  }
}