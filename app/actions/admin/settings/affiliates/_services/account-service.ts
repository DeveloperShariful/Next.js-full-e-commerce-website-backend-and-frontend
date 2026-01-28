// File: app/actions/admin/settings/affiliate/_services/account-service.ts


// ✅ 1. Top-level "use server" directive is mandatory here
"use server";

import { db } from "@/lib/prisma";
import { AffiliateStatus, Prisma } from "@prisma/client";
import { sendNotification } from "@/app/api/email/send-notification"; 
import { DecimalMath } from "@/lib/utils/decimal-math";
import { auditService } from "@/lib/services/audit-service";
import { revalidatePath } from "next/cache";
import { ActionResponse, AffiliateUserTableItem } from "../types";
import { syncUser } from "@/lib/auth-sync";

// =========================================
// READ OPERATIONS (Server Side Fetching)
// =========================================

// ✅ 2. Converted to named export function
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
        tier: { select: { name: true } },
        group: { select: { id: true, name: true } },
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
      groupName: account.group?.name || "No Group",
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

// ✅ 3. Removed inline "use server" (already defined at top)
export async function approveAffiliateAction(id: string): Promise<ActionResponse> {
  try {
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) return { success: false, message: "Unauthorized" };

    const updated = await db.affiliateAccount.update({
      where: { id },
      include: { user: true },
      data: { status: "ACTIVE" }
    });

    await sendNotification({
        trigger: "AFFILIATE_APPROVED",
        recipient: updated.user.email,
        data: { affiliate_name: updated.user.name || "Partner" },
        userId: updated.userId
    });

    await auditService.log({
        userId: auth.id,
        action: "UPDATE",
        entity: "AffiliateAccount",
        entityId: id,
        newData: { status: "ACTIVE" },
        meta: { action: "APPROVE_AFFILIATE" }
    });

    revalidatePath("/admin/settings/affiliate/users");
    return { success: true, message: "Affiliate approved successfully." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function rejectAffiliateAction(id: string, reason: string): Promise<ActionResponse> {
  try {
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) return { success: false, message: "Unauthorized" };

    const updated = await db.affiliateAccount.update({
      where: { id },
      include: { user: true },
      data: { status: "REJECTED", adminNotes: reason }
    });

    await sendNotification({
        trigger: "AFFILIATE_REJECTED",
        recipient: updated.user.email,
        data: { affiliate_name: updated.user.name || "Partner", rejection_reason: reason },
        userId: updated.userId
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
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) return { success: false, message: "Unauthorized" };

    await db.affiliateAccount.updateMany({
      where: { id: { in: ids } },
      data: { status }
    });

    revalidatePath("/admin/settings/affiliate/users");
    return { success: true, message: `${ids.length} affiliates updated.` };
  } catch (error: any) {
    return { success: false, message: "Bulk update failed." };
  }
}

export async function bulkGroupAction(ids: string[], groupId: string): Promise<ActionResponse> {
  try {
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) return { success: false, message: "Unauthorized" };

    await db.affiliateAccount.updateMany({
      where: { id: { in: ids } },
      data: { groupId }
    });

    revalidatePath("/admin/settings/affiliate/users");
    return { success: true, message: "Group assigned." };
  } catch (error: any) {
    return { success: false, message: "Bulk group assignment failed." };
  }
}

export async function bulkTagAction(ids: string[], tagId: string): Promise<ActionResponse> {
  try {
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) return { success: false, message: "Unauthorized" };

    await db.$transaction(
      ids.map(id => db.affiliateAccount.update({
          where: { id },
          data: { tags: { connect: { id: tagId } } }
      }))
    );

    revalidatePath("/admin/settings/affiliate/users");
    return { success: true, message: "Tag added to affiliates." };
  } catch (error: any) {
    return { success: false, message: "Bulk tagging failed." };
  }
}

export async function bulkDeleteAction(ids: string[]): Promise<ActionResponse> {
  try {
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) return { success: false, message: "Unauthorized" };

    await db.affiliateAccount.updateMany({
      where: { id: { in: ids } },
      data: { status: "REJECTED" }
    });

    await auditService.log({
      userId: auth.id,
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