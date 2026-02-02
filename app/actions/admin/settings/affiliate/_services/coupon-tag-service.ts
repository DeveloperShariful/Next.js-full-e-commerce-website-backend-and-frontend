// File: app/actions/admin/settings/affiliate/_services/coupon-tag-service.ts

"use server";

import { db } from "@/lib/prisma";
import { ActionResponse } from "../types";
import { protectAction } from "../permission-service";
import { auditService } from "@/lib/services/audit-service";
import { DecimalMath } from "@/lib/utils/decimal-math";
import { revalidatePath } from "next/cache";

// =========================================
// READ OPERATIONS 
// =========================================

export async function getAllAffiliateCoupons() {
  await protectAction("MANAGE_PARTNERS");

  const coupons = await db.discount.findMany({
    where: {
      affiliateId: { not: null }
    },
    include: {
      affiliate: {
        select: {
          id: true,
          user: { select: { name: true, email: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return coupons.map(c => ({
    ...c,
    value: DecimalMath.toNumber(c.value),
    minSpend: c.minSpend ? DecimalMath.toNumber(c.minSpend) : null,
    affiliateCommissionRate: c.affiliateCommissionRate ? DecimalMath.toNumber(c.affiliateCommissionRate) : null, 
  }));
}

export async function getAllTags() {
  await protectAction("MANAGE_PARTNERS");
  
  return await db.affiliateTag.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  });
}

// =========================================
// WRITE OPERATIONS
// =========================================

export async function createAndLinkCouponAction(
  affiliateId: string | undefined, 
  code: string, 
  value: number, 
  type: "PERCENTAGE" | "FIXED_AMOUNT",
  affiliateCommissionRate?: number 
): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_PARTNERS");

    if (code.length < 3) return { success: false, message: "Code too short" };

    const exists = await db.discount.findUnique({ where: { code } });
    if (exists) return { success: false, message: "Coupon code exists" };
    
    await db.discount.create({
      data: {
        code: code.toUpperCase(),
        type: type,
        value: DecimalMath.toDecimal(value),
        isActive: true,
        affiliateId: affiliateId && affiliateId.trim() !== "" ? affiliateId : null, 
        affiliateCommissionRate: affiliateCommissionRate ? DecimalMath.toDecimal(affiliateCommissionRate) : null,
        description: affiliateId ? `Affiliate Exclusive` : `General Coupon`,
        usageLimit: null, 
        startDate: new Date(),
      }
    });

    await auditService.log({
        userId: actor.id,
        action: "CREATE_COUPON",
        entity: "AffiliateAccount",
        entityId: affiliateId || "GENERAL",
        meta: { code, value, type, affiliateCommissionRate }
    });

    revalidatePath("/admin/settings/affiliate");
    return { success: true, message: "Coupon assigned successfully." };

  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function unlinkCouponAction(couponId: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_PARTNERS");

    await db.discount.update({
        where: { id: couponId },
        data: { 
            affiliateId: null,
            affiliateCommissionRate: null 
        }
    });

    revalidatePath("/admin/settings/affiliate");
    return { success: true, message: "Coupon unlinked." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function createTagAction(name: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_PARTNERS");

    if (!name || name.length < 2) return { success: false, message: "Tag name too short." };

    const existing = await db.affiliateTag.findUnique({ where: { name: name.trim() }});
    if(existing) return { success: false, message: "Tag already exists." };

    const tag = await db.affiliateTag.create({
      data: { name: name.trim() }
    });

    await auditService.log({
        userId: actor.id,
        action: "CREATE_TAG",
        entity: "AffiliateTag",
        entityId: tag.id,
        newData: { name }
    });

    revalidatePath("/admin/settings/affiliate");
    return { success: true, message: "Tag created." };
  } catch (error: any) {
    return { success: false, message: "Failed to create tag." };
  }
}

export async function deleteTagAction(id: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_PARTNERS");

    await db.affiliateTag.delete({
      where: { id }
    });

    await auditService.log({
        userId: actor.id,
        action: "DELETE_TAG",
        entity: "AffiliateTag",
        entityId: id
    });

    revalidatePath("/admin/settings/affiliate");
    return { success: true, message: "Tag deleted." };
  } catch (error: any) {
    return { success: false, message: "Failed to delete tag." };
  }
}

export async function updateCouponAction(
  id: string,
  code: string,
  value: number,
  type: "PERCENTAGE" | "FIXED_AMOUNT",
  affiliateId?: string,
  affiliateCommissionRate?: number 
): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_PARTNERS");

    if (code.length < 3) return { success: false, message: "Code too short" };

    const exists = await db.discount.findFirst({
      where: { 
        code: code.toUpperCase(), 
        id: { not: id } 
      }
    });
    
    if (exists) return { success: false, message: "Coupon code already exists" };

    await db.discount.update({
      where: { id },
      data: {
        code: code.toUpperCase(),
        type: type,
        value: DecimalMath.toDecimal(value),
        affiliateId: affiliateId && affiliateId.trim() !== "" ? affiliateId : null,
        affiliateCommissionRate: affiliateCommissionRate ? DecimalMath.toDecimal(affiliateCommissionRate) : null,
        description: affiliateId ? `Affiliate Exclusive` : `General Coupon`,
      }
    });

    await auditService.log({
      userId: actor.id,
      action: "UPDATE_COUPON",
      entity: "Discount",
      entityId: id,
      newData: { code, value, type, affiliateId, affiliateCommissionRate }
    });

    revalidatePath("/admin/settings/affiliate");
    return { success: true, message: "Coupon updated successfully." };

  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function searchAffiliatesForDropdown(query: string) {
  await protectAction("MANAGE_PARTNERS");
  
  return await db.affiliateAccount.findMany({
    where: {
      OR: [
        { user: { name: { contains: query, mode: "insensitive" } } },
        { user: { email: { contains: query, mode: "insensitive" } } },
        { slug: { contains: query, mode: "insensitive" } }
      ],
      status: "ACTIVE",
      deletedAt: null 
    },
    take: 5,
    select: {
      id: true,
      slug: true,
      user: { select: { name: true, email: true } }
    }
  });
}