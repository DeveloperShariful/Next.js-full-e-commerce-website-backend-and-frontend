//app/actions/admin/settings/affiliate/_services/domain-service.ts

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import crypto from "crypto";

/**
 * SERVICE LAYER: CUSTOM DOMAINS
 * Handles white-label domain mapping (e.g. partners.mystore.com).
 */
export const domainService = {

  /**
   * Get All Domains
   */
  async getAllDomains() {
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
      console.error("[DomainService] Fetch Error:", error);
      throw new Error("Failed to load domains.");
    }
  },

  /**
   * Add a New Domain (Generates Verification Token)
   */
  async addDomain(affiliateId: string, domain: string) {
    // 1. Check uniqueness
    const existing = await db.affiliateDomain.findUnique({
      where: { domain }
    });
    if (existing) throw new Error("Domain is already registered.");

    // 2. Generate Token (TXT Record value)
    const token = `gobike-verify-${crypto.randomBytes(8).toString("hex")}`;

    // 3. Create Record
    return await db.affiliateDomain.create({
      data: {
        affiliateId,
        domain: domain.toLowerCase(),
        verificationToken: token,
        isVerified: false
      }
    });
  },

  /**
   * Verify Domain DNS (Simulated for now)
   * In production, this would use `dns.resolveTxt()` to check records.
   */
  async verifyDomain(id: string) {
    const record = await db.affiliateDomain.findUnique({ where: { id } });
    if (!record) throw new Error("Domain not found.");

    if (record.isVerified) return { success: true, message: "Already verified." };

    // --- REAL DNS CHECK LOGIC WOULD GO HERE ---
    // const records = await resolveTxt(record.domain);
    // const isMatch = records.flat().includes(record.verificationToken);
    
    // FOR DEMO: We assume verification passes if triggered by Admin
    const isMatch = true; 

    if (isMatch) {
      await db.affiliateDomain.update({
        where: { id },
        data: { isVerified: true, isActive: true }
      });
      return { success: true, message: "Domain verified successfully." };
    } else {
      throw new Error("DNS TXT record not found. Please add the token to your DNS.");
    }
  },

  /**
   * Delete Domain
   */
  async deleteDomain(id: string) {
    return await db.affiliateDomain.delete({
      where: { id }
    });
  }
};