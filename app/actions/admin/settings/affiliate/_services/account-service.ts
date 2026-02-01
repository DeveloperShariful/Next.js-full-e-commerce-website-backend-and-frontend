// File: app/actions/admin/settings/affiliate/_services/account-service.ts

"use server";

import { db } from "@/lib/prisma";
import { AffiliateStatus, Prisma, AffiliateAccount } from "@prisma/client";
import { DecimalMath } from "@/lib/utils/decimal-math";
import { auditService } from "@/lib/services/audit-service";
import { revalidatePath } from "next/cache";
import { ActionResponse, AffiliateUserTableItem } from "../types";
import { protectAction } from "../permission-service";
import { getChanges } from "../get-changes";

// =========================================
// READ OPERATIONS (Server Side Fetching)
// =========================================

export async function getAffiliates(
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
        user: { select: { id: true, name: true, email: true, image: true } },
        tier: { select: { id: true, name: true, commissionRate: true, commissionType: true } },
        group: { select: { id: true, name: true, commissionRate: true, commissionType: true } },
        tags: { select: { id: true, name: true } },
        coupons: { select: { code: true } },
        referrals: {
          where: { status: { in: ["APPROVED", "PAID"] } },
          select: { totalOrderAmount: true, commissionAmount: true }
        },
        _count: { select: { clicks: true, referrals: true } }
      }
    })
  ]);

  const affiliates: AffiliateUserTableItem[] = data.map(account => {
    const salesTotal = account.referrals.reduce((sum, r) => sum + DecimalMath.toNumber(r.totalOrderAmount), 0);
    const commTotal = account.referrals.reduce((sum, r) => sum + DecimalMath.toNumber(r.commissionAmount), 0);
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
      tierRate: account.tier?.commissionRate ? DecimalMath.toNumber(account.tier.commissionRate) : null,
      tierType: account.tier?.commissionType || "PERCENTAGE",
      groupName: account.group?.name || "No Group",
      groupRate: account.group?.commissionRate ? DecimalMath.toNumber(account.group.commissionRate) : null,
      groupType: account.group?.commissionType || "PERCENTAGE", 
      tags: account.tags.map(t => t.name),
      coupons: account.coupons.map(c => c.code),
      balance: DecimalMath.toNumber(account.balance),
      totalEarnings: DecimalMath.toNumber(account.totalEarnings),
      storeCredit: DecimalMath.toNumber(account.storeCredit),
      referralCount: account._count.referrals,
      visitCount: account._count.clicks,
      salesTotal: salesTotal,
      commissionTotal: commTotal,
      netRevenue: netRevenue,
      registrationNotes: account.registrationNotes,
      createdAt: account.createdAt,
      kycStatus: account.kycStatus,
      riskScore: account.riskScore || 0,
      commissionRate: account.commissionRate ? DecimalMath.toNumber(account.commissionRate) : null,
      commissionType: account.commissionType,
    };
  });

  return { affiliates, total, totalPages: Math.ceil(total / limit) };
}

export async function getAffiliateDetails(id: string) {
  const account = await db.affiliateAccount.findUnique({
    where: { id },
    include: {
      user: {
          include: {
              addresses: { where: { isDefault: true }, take: 1 }
          }
      },
      tier: true,
      group: true,
      tags: true,
      coupons: true,
      parent: { include: { user: true } }, 
      downlines: { include: { user: true } }, 
      documents: true, 
      payouts: { take: 10, orderBy: { createdAt: "desc" } },
      productRates: { include: { product: true } }
    }
  });

  if(!account) throw new Error("Affiliate not found");
  return account;
}

// =========================================
// SERVER ACTIONS (Mutations)
// =========================================

export async function approveAffiliateAction(id: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_PARTNERS");

    const current = await db.affiliateAccount.findUnique({ where: { id } });
    if (!current) return { success: false, message: "Affiliate not found" };

    const payload: Partial<AffiliateAccount> = { status: "ACTIVE" };
    const { hasChanges, changes, oldValues } = getChanges(current, payload);

    if (!hasChanges) return { success: true, message: "Affiliate is already active." };

    await db.$transaction(async (tx) => {
        const updated = await tx.affiliateAccount.update({
          where: { id },
          include: { user: true },
          data: changes as Prisma.AffiliateAccountUncheckedUpdateInput
        });

        await tx.notificationQueue.create({
            data: {
                channel: "EMAIL",
                recipient: updated.user.email,
                templateSlug: "AFFILIATE_APPROVED",
                status: "PENDING",
                userId: updated.userId,
                content: "",
                metadata: { affiliate_name: updated.user.name || "Partner" }
            }
        });

        // Log Audit
        await auditService.log({
            userId: actor.id,
            action: "UPDATE",
            entity: "AffiliateAccount",
            entityId: id,
            oldData: oldValues,
            newData: changes,
            meta: { action: "APPROVE_AFFILIATE" }
        });
    });

    revalidatePath("/admin/settings/affiliate/users");
    return { success: true, message: "Affiliate approved successfully." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function rejectAffiliateAction(id: string, reason: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_PARTNERS");

    const current = await db.affiliateAccount.findUnique({ where: { id } });
    if (!current) return { success: false, message: "Affiliate not found" };

    const payload: Partial<AffiliateAccount> = { 
      status: "REJECTED",
      adminNotes: reason
    };

    const { hasChanges, changes, oldValues } = getChanges(current, payload);
    if (!hasChanges) return { success: true, message: "Already rejected with same reason." };

    await db.$transaction(async (tx) => {
        const updated = await tx.affiliateAccount.update({
          where: { id },
          include: { user: true },
          data: changes as Prisma.AffiliateAccountUncheckedUpdateInput
        });

        await tx.notificationQueue.create({
            data: {
                channel: "EMAIL",
                recipient: updated.user.email,
                templateSlug: "AFFILIATE_REJECTED",
                status: "PENDING",
                userId: updated.userId,
                content: "", 
                metadata: { 
                    affiliate_name: updated.user.name || "Partner", 
                    rejection_reason: reason 
                }
            }
        });

        await auditService.log({
          userId: actor.id,
          action: "UPDATE",
          entity: "AffiliateAccount",
          entityId: id,
          oldData: oldValues,
          newData: changes,
          meta: { action: "REJECT_AFFILIATE", reason }
        });
    });

    revalidatePath("/admin/settings/affiliate/users");
    return { success: true, message: "Affiliate rejected." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// --- BULK ACTIONS ---

export async function bulkStatusAction(ids: string[], status: AffiliateStatus): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_PARTNERS");

    const existing = await db.affiliateAccount.findMany({
      where: { id: { in: ids } },
      select: { id: true, status: true, userId: true, user: { select: { email: true, name: true } } }
    });

    const toUpdate = existing.filter(acc => acc.status !== status);
    
    if (toUpdate.length === 0) return { success: true, message: "No updates needed." };

    await db.$transaction(async (tx) => {
        await tx.affiliateAccount.updateMany({
          where: { id: { in: toUpdate.map(x => x.id) } },
          data: { status }
        });

        if (status === "ACTIVE" || status === "REJECTED") {
            const templateSlug = status === "ACTIVE" ? "AFFILIATE_APPROVED" : "AFFILIATE_REJECTED";
            
            for (const acc of toUpdate) {
                 await tx.notificationQueue.create({
                    data: {
                        channel: "EMAIL",
                        recipient: acc.user.email,
                        templateSlug: templateSlug,
                        status: "PENDING",
                        userId: acc.userId,
                        content: "",
                        metadata: { affiliate_name: acc.user.name || "Partner" }
                    }
                });
            }
        }

        // 3. Audit
        await auditService.log({
          userId: actor.id,
          action: "BULK_UPDATE",
          entity: "AffiliateAccount",
          entityId: "BULK",
          newData: { status, count: toUpdate.length, affectedIds: toUpdate.map(x=>x.id) },
          meta: { action: "BULK_STATUS_CHANGE" }
        });
    });

    revalidatePath("/admin/settings/affiliate/users");
    return { success: true, message: `${toUpdate.length} affiliates updated.` };
  } catch (error: any) {
    return { success: false, message: "Bulk update failed." };
  }
}

export async function bulkGroupAction(ids: string[], groupId: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_PARTNERS");

    await db.affiliateAccount.updateMany({
      where: { id: { in: ids } },
      data: { groupId }
    });

    await auditService.log({
      userId: actor.id,
      action: "BULK_UPDATE",
      entity: "AffiliateAccount",
      entityId: "BULK",
      newData: { groupId, count: ids.length, ids },
      meta: { action: "BULK_GROUP_ASSIGN" }
    });

    revalidatePath("/admin/settings/affiliate/users");
    return { success: true, message: "Group assigned." };
  } catch (error: any) {
    return { success: false, message: "Bulk group assignment failed." };
  }
}

export async function bulkTagAction(ids: string[], tagId: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_PARTNERS");

    await db.$transaction(
      ids.map(id => db.affiliateAccount.update({
          where: { id },
          data: { tags: { connect: { id: tagId } } }
      }))
    );

    await auditService.log({
      userId: actor.id,
      action: "BULK_UPDATE",
      entity: "AffiliateAccount",
      entityId: "BULK",
      newData: { tagId, count: ids.length, ids },
      meta: { action: "BULK_TAG_ADD" }
    });

    revalidatePath("/admin/settings/affiliate/users");
    return { success: true, message: "Tag added to affiliates." };
  } catch (error: any) {
    return { success: false, message: "Bulk tagging failed." };
  }
}

export async function bulkDeleteAction(ids: string[]): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_PARTNERS");

    await db.affiliateAccount.updateMany({
      where: { id: { in: ids } },
      data: { status: "REJECTED" }
    });

    await auditService.log({
      userId: actor.id,
      action: "BULK_DELETE",
      entity: "AffiliateAccount",
      entityId: "BULK",
      meta: { ids, method: "SOFT_DELETE" }
    });

    revalidatePath("/admin/settings/affiliate/users");
    return { success: true, message: "Selected users marked as Rejected (Data Preserved)." };
  } catch (error: any) {
    return { success: false, message: "Bulk delete failed." };
  }
}

export async function updateCommissionAction(
  id: string, 
  rate: number | null, 
  type: "PERCENTAGE" | "FIXED"
): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_PARTNERS");

    const current = await db.affiliateAccount.findUnique({ where: { id } });
    if (!current) return { success: false, message: "Affiliate not found" };

    const payload: Partial<AffiliateAccount> = {
      commissionRate: rate ? DecimalMath.toDecimal(rate) : null,
      commissionType: type
    };

    const { hasChanges, changes, oldValues } = getChanges(current, payload);

    if (!hasChanges) return { success: true, message: "No commission changes detected." };

    await db.affiliateAccount.update({
      where: { id },
      data: changes as Prisma.AffiliateAccountUncheckedUpdateInput
    });

    await auditService.log({
        userId: actor.id,
        action: "UPDATE_COMMISSION",
        entity: "AffiliateAccount",
        entityId: id,
        oldData: oldValues,
        newData: changes,
        meta: { updatedBy: "ADMIN_MANUAL_OVERRIDE" }
    });

    revalidatePath("/admin/settings/affiliate");
    return { success: true, message: "Commission updated successfully." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}