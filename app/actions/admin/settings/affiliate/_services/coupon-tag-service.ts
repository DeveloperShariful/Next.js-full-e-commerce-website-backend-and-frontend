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

  // শুধুমাত্র সেই কুপনগুলো আনবে যেগুলো কোনো অ্যাফিলিয়েট এর সাথে যুক্ত
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
  affiliateId: string, 
  code: string, 
  value: number, 
  type: "PERCENTAGE" | "FIXED_AMOUNT" 
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
        description: affiliateId ? `Affiliate Exclusive` : `General Coupon`,
        usageLimit: null, 
        startDate: new Date(),
      }
    });

    await auditService.log({
        userId: actor.id,
        action: "CREATE_COUPON",
        entity: "AffiliateAccount",
        entityId: affiliateId,
        meta: { code, value, type }
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
        data: { affiliateId: null } // Just unlink, don't delete history
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

    revalidatePath("/admin/settings/affiliate"); // Path updated just in case
    return { success: true, message: "Tag created." };
  } catch (error: any) {
    return { success: false, message: "Tag already exists or failed." };
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
