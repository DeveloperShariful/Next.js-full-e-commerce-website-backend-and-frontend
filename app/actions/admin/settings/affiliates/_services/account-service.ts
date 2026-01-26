// File: app/actions/admin/settings/affiliates/_services/account-service.ts

import { db } from "@/lib/prisma";
import { AffiliateUserTableItem } from "../types";
import { AffiliateStatus, Prisma } from "@prisma/client";

export const accountService = {
  async getAffiliates(
    page: number = 1, 
    limit: number = 20, 
    status?: AffiliateStatus,
    search?: string,
    groupId?: string,
    tagId?: string
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.AffiliateAccountWhereInput = {
      ...(status && { status }),
      ...(groupId && { groupId }),
      ...(tagId && { tags: { some: { id: tagId } } }),
      ...(search && {
        OR: [
          { user: { name: { contains: search, mode: "insensitive" } } },
          { user: { email: { contains: search, mode: "insensitive" } } },
          { slug: { contains: search, mode: "insensitive" } },
        ]
      })
    };

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
          group: {
            select: { id: true, name: true }
          },
          tags: {
            select: { id: true, name: true }
          },
          coupons: {
            select: { code: true, value: true, type: true }
          },
          referrals: {
            where: { status: { in: ["APPROVED", "PAID"] } },
            select: {
              totalOrderAmount: true,
              commissionAmount: true
            }
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

    const affiliates: AffiliateUserTableItem[] = data.map(account => {
      const salesTotal = account.referrals.reduce((sum, r) => sum + r.totalOrderAmount.toNumber(), 0);
      const commTotal = account.referrals.reduce((sum, r) => sum + r.commissionAmount.toNumber(), 0);
      const netRevenue = salesTotal - commTotal;

      return {
        id: account.id,
        userId: account.userId,
        name: account.user.name || "Unknown",
        email: account.user.email,
        avatar: account.user.image,
        slug: account.slug,
        status: account.status,
        tierName: account.tier?.name || "Default",
        groupName: account.group?.name || "No Group",
        tags: account.tags.map(t => t.name),
        coupons: account.coupons.map(c => c.code),
        balance: account.balance.toNumber(),
        totalEarnings: account.totalEarnings.toNumber(),
        storeCredit: account.storeCredit.toNumber(),
        referralCount: account._count.referrals,
        visitCount: account._count.clicks,
        salesTotal: salesTotal,
        commissionTotal: commTotal,
        netRevenue: netRevenue,
        registrationNotes: account.registrationNotes,
        createdAt: account.createdAt,
        kycStatus: account.kycStatus,
        riskScore: account.riskScore || 0,
      };
    });

    return { affiliates, total, totalPages: Math.ceil(total / limit) };
  },

  async approveAffiliate(affiliateId: string, tierId?: string) {
    return await db.affiliateAccount.update({
      where: { id: affiliateId },
      data: { 
        status: "ACTIVE",
        tierId: tierId || undefined,
      }
    });
  },

  async rejectAffiliate(affiliateId: string, reason: string) {
    return await db.affiliateAccount.update({
      where: { id: affiliateId },
      data: { 
        status: "REJECTED",
        adminNotes: reason
      }
    });
  },

  async bulkUpdateStatus(ids: string[], status: AffiliateStatus) {
    if (ids.length === 0) return { count: 0 };
    return await db.affiliateAccount.updateMany({
      where: { id: { in: ids } },
      data: { status }
    });
  },

  async bulkAssignGroup(ids: string[], groupId: string | null) {
    if (ids.length === 0) return { count: 0 };
    return await db.affiliateAccount.updateMany({
      where: { id: { in: ids } },
      data: { groupId }
    });
  },

  async bulkAssignTag(ids: string[], tagId: string) {
    if (ids.length === 0) return;
    
    const operations = ids.map(id => 
      db.affiliateAccount.update({
        where: { id },
        data: {
          tags: {
            connect: { id: tagId }
          }
        }
      })
    );
    
    await db.$transaction(operations);
  },

  async getAffiliateDetails(id: string) {
    const account = await db.affiliateAccount.findUnique({
      where: { id },
      include: {
        user: {
            include: {
                addresses: {
                    where: { isDefault: true },
                    take: 1
                }
            }
        },
        tier: true,
        group: true,
        tags: true,
        coupons: true,
        parent: { include: { user: true } }, 
        downlines: { include: { user: true } }, 
        documents: true, 
        payouts: {
          take: 10,
          orderBy: { createdAt: "desc" }
        },
        productRates: {
            include: { product: true }
        }
      }
    });

    if(!account) throw new Error("Affiliate not found");
    return account;
  }
};