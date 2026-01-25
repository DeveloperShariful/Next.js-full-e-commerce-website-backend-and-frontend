// File: app/actions/admin/settings/affiliates/_services/account-service.ts

import { db } from "@/lib/prisma";
import { AffiliateUserTableItem } from "../types";
import { AffiliateStatus, Prisma } from "@prisma/client";

/**
 * SERVICE LAYER: USER MANAGEMENT
 * Handles logic for listing, approving, and managing affiliate accounts.
 */
export const accountService = {

  /**
   * Fetch paginated list of affiliates with enterprise details
   */
  async getAffiliates(
    page: number = 1, 
    limit: number = 20, 
    status?: AffiliateStatus,
    search?: string
  ) {
    const skip = (page - 1) * limit;

    // Filters
    const where: Prisma.AffiliateAccountWhereInput = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { user: { name: { contains: search, mode: "insensitive" } } },
          { user: { email: { contains: search, mode: "insensitive" } } },
          { slug: { contains: search, mode: "insensitive" } },
        ]
      })
    };

    // Execute Query
    const [total, data] = await Promise.all([
      db.affiliateAccount.count({ where }),
      db.affiliateAccount.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true }
          },
          tier: {
            select: { name: true }
          },
          _count: {
            select: { 
              clicks: true, 
              referrals: true 
            }
          }
        }
      })
    ]);

    // Map to DTO
    const affiliates: AffiliateUserTableItem[] = data.map(account => ({
      id: account.id,
      userId: account.userId,
      name: account.user.name || "Unknown",
      email: account.user.email,
      avatar: account.user.image,
      slug: account.slug,
      status: account.status,
      tierName: account.tier?.name || "Default",
      balance: account.balance.toNumber(),
      totalEarnings: account.totalEarnings.toNumber(),
      referralCount: account._count.referrals,
      visitCount: account._count.clicks,
      createdAt: account.createdAt,
      kycStatus: account.kycStatus,
      riskScore: account.riskScore || 0,
    }));

    return { affiliates, total, totalPages: Math.ceil(total / limit) };
  },

  /**
   * Approve a pending affiliate
   */
  async approveAffiliate(affiliateId: string, tierId?: string) {
    return await db.affiliateAccount.update({
      where: { id: affiliateId },
      data: { 
        status: "ACTIVE",
        tierId: tierId || undefined,
      }
    });
  },

  /**
   * Reject a pending affiliate with a reason
   */
  async rejectAffiliate(affiliateId: string, reason: string) {
    return await db.affiliateAccount.update({
      where: { id: affiliateId },
      data: { 
        status: "REJECTED",
        adminNotes: reason
      }
    });
  },

  /**
   * Get Full Enterprise Profile (For Detail View)
   * Includes Downlines (MLM), Payout History, and Documents
   */
  async getAffiliateDetails(id: string) {
    const account = await db.affiliateAccount.findUnique({
      where: { id },
      include: {
        user: {
            // ✅ FIX: Address fetched via User relation
            include: {
                addresses: {
                    where: { isDefault: true },
                    take: 1
                }
            }
        },
        tier: true,
        parent: { include: { user: true } }, // Upline
        downlines: { include: { user: true } }, // Direct Downlines
        documents: true, // KYC Docs
        payouts: {
          take: 5,
          orderBy: { createdAt: "desc" }
        },
      }
    });

    if(!account) throw new Error("Affiliate not found");
    return account;
  }
};