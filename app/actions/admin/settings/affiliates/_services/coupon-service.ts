// File: app/actions/admin/settings/affiliate/_services/coupon-service.ts

"use server";

import { db } from "@/lib/prisma";
import { ActionResponse } from "../types";
import { protectAction } from "./permission-service";
import { auditService } from "@/lib/services/audit-service";
import { DecimalMath } from "@/lib/utils/decimal-math";
import { revalidatePath } from "next/cache";

// =========================================
// READ OPERATIONS (✅ মিসিং ছিল, এখন যোগ করা হয়েছে)
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

