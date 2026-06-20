// File: app/actions/backend/affiliate/_services/coupon-tag-service.ts

"use server";

import { db } from "@/lib/prisma";
import { ActionResponse } from "../types";
import { protectAction } from "../permission-service";
import { auditService } from "@/lib/audit-service";
import { DecimalMath } from "@/lib/decimal-math";
import { revalidatePath } from "next/cache";

// =========================================
// READ OPERATIONS 
// =========================================

export async function getAllAffiliateCoupons() {
  await protectAction("MANAGE_PARTNERS");

  const coupons = await db.discount.findMany({
    include: {
      affiliate: {
        select: {
          id: true,
          slug: true,
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
  
  // ✅ FIXED: AffiliateTag table is deleted. We now dynamically fetch unique tags from AffiliateAccount table.
  const accounts = await db.affiliateAccount.findMany({
    select: { tags: true },
    where: { tags: { isEmpty: false } }
  });

  // Extract unique tags
  const allTags = new Set<string>();
  accounts.forEach(acc => {
    acc.tags.forEach(tag => allTags.add(tag));
  });

  // Return in a compatible format for frontend (id and name are same now)
  return Array.from(allTags).sort().map(tagName => ({
    id: tagName,
    name: tagName
  }));
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

    revalidatePath("/admin/affiliate");
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

    revalidatePath("/admin/affiliate");
    return { success: true, message: "Coupon unlinked." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function createTagAction(name: string): Promise<ActionResponse> {
  // ✅ FIXED: Tag creation logic changed. We don't need a separate table to "create" a tag anymore.
  // Tags will be automatically created when they are assigned to an affiliate in `bulkTagAction` or Affiliate Profile Update.
  return { success: true, message: "Tags are dynamically created when assigned to users." };
}

export async function deleteTagAction(tag: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_PARTNERS");

    // ✅ FIXED: Remove this string tag from all users who have it
    const usersWithTag = await db.affiliateAccount.findMany({
      where: { tags: { has: tag } },
      select: { id: true, tags: true }
    });

    await db.$transaction(
      usersWithTag.map(user => 
        db.affiliateAccount.update({
          where: { id: user.id },
          data: { tags: { set: user.tags.filter(t => t !== tag) } }
        })
      )
    );

    await auditService.log({
        userId: actor.id,
        action: "DELETE_TAG",
        entity: "AffiliateTag",
        entityId: "GLOBAL",
        newData: { deletedTag: tag }
    });

    revalidatePath("/admin/affiliate");
    return { success: true, message: "Tag removed from all users." };
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

    revalidatePath("/admin/affiliate");
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