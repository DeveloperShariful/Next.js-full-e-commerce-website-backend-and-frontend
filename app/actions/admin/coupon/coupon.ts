// File Location: app/actions/admin/coupon/coupon.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { DiscountType, Prisma } from "@prisma/client";
import { auth } from "@/auth";

// --- 1. GET COUPONS (WITH PAGINATION, SEARCH & TRASH LOGIC) ---
export async function getCoupons(
  page: number = 1,
  limit: number = 20,
  query?: string,
  status?: string,
  discountType?: string
) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    const skip = (page - 1) * limit;
    
    const isTrashMode = status === 'trash';
    const isAffiliateMode = status === 'affiliate';
    const isMineMode = status === 'mine';
    const isPublishedMode = status === 'published';

    // ✅ STRICT TYPE: Prisma.DiscountWhereInput
    const whereCondition: Prisma.DiscountWhereInput = {
      AND: [
        // Trash vs Active logic
        isTrashMode ? { deletedAt: { not: null } } : { deletedAt: null },
        
        // Search condition
        query ? { code: { contains: query, mode: 'insensitive' } } : {},
        
        // Type/Status conditions
        isAffiliateMode ? { affiliateId: { not: null } } : {},
        isPublishedMode && !isTrashMode ? { isActive: true } : {},
        discountType && discountType !== 'all' ? { type: discountType as DiscountType } : {}, 
        
        // Dummy fallback for 'mine' until createdBy is added to schema
        isMineMode && currentUserId ? { affiliateId: { not: null } } : {} 
      ]
    };

    const [coupons, totalCount, stats, trashCount] = await Promise.all([
      db.discount.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.discount.count({ where: whereCondition }),
      db.discount.groupBy({
        by: ['isActive'],
        _count: { id: true },
        where: { deletedAt: null } // Only count active items for published
      }),
      db.discount.count({
        where: { deletedAt: { not: null } }
      })
    ]);

    const affiliateCount = await db.discount.count({ 
        where: { affiliateId: { not: null }, deletedAt: null } 
    });
    
    const mineCount = 0; // Update this when createdBy is added to schema

    // Parse Decimals safely
    const serializedCoupons = JSON.parse(JSON.stringify(coupons, (key, value) => {
        if (value && typeof value === 'object' && value.constructor.name === 'Decimal') {
            return Number(value);
        }
        return value;
    }));

    const counts = {
        all: stats.reduce((acc, curr) => acc + curr._count.id, 0),
        published: stats.find(s => s.isActive === true)?._count.id || 0,
        affiliate: affiliateCount,
        mine: mineCount,
        trash: trashCount
    };

    return { 
        success: true, 
        data: serializedCoupons,
        meta: { total: totalCount, pages: Math.ceil(totalCount / limit), counts }
    };
  } catch (error) {
    console.error("GET_COUPONS_ERROR", error);
    return { success: false, error: "Failed to fetch coupons", data: [], meta: null };
  }
}

// --- 2. CREATE / UPDATE COUPON ---
export async function saveCoupon(formData: FormData) {
  try {
    const id = formData.get("id") as string | null;
    const code = (formData.get("code") as string).toUpperCase().trim();
    const type = formData.get("type") as DiscountType;
    const value = parseFloat(formData.get("value") as string);
    
    const minSpend = formData.get("minSpend") ? parseFloat(formData.get("minSpend") as string) : null;
    const usageLimit = formData.get("usageLimit") ? parseInt(formData.get("usageLimit") as string) : null;
    const endDate = formData.get("endDate") ? new Date(formData.get("endDate") as string) : null;
    const isActive = formData.get("isActive") === "true";
    const description = formData.get("description") as string | null;

    if (!code || isNaN(value)) return { success: false, error: "Code and valid Value required" };

    const data = {
      code,
      type,
      value,
      description: description || null,
      minSpend,
      usageLimit,
      endDate,
      isActive
    };

    if (id) {
      await db.discount.update({ where: { id }, data });
    } else {
      const existing = await db.discount.findUnique({ where: { code } });
      if (existing) return { success: false, error: "Coupon code already exists!" };
      await db.discount.create({ data });
    }

    revalidatePath("/admin/coupons");
    return { success: true, message: id ? "Coupon updated successfully" : "Coupon created successfully" };

  } catch (error) {
    console.error("SAVE_COUPON_ERROR", error);
    return { success: false, error: "Operation failed" };
  }
}

// --- 3. SOFT DELETE COUPONS (MOVE TO TRASH) ---
export async function deleteCoupons(ids: string[]) {
  try {
    if (!ids || ids.length === 0) return { success: false, error: "No coupons selected" };
    
    await db.discount.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: new Date() } // ✅ Soft Delete Applied
    });

    revalidatePath("/admin/coupons");
    return { success: true, message: `${ids.length} coupon(s) moved to trash.` };
  } catch (error) {
    console.error("DELETE_COUPONS_ERROR", error);
    return { success: false, error: "Failed to move coupons to trash" };
  }
}

// --- 4. RESTORE COUPONS ---
export async function restoreCoupons(ids: string[]) {
  try {
    if (!ids || ids.length === 0) return { success: false, error: "No coupons selected" };
    
    await db.discount.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: null } // ✅ Restore Applied
    });

    revalidatePath("/admin/coupons");
    return { success: true, message: `${ids.length} coupon(s) restored successfully.` };
  } catch (error) {
    console.error("RESTORE_COUPONS_ERROR", error);
    return { success: false, error: "Failed to restore coupons" };
  }
}

// --- 5. HARD DELETE COUPONS (PERMANENT) ---
export async function hardDeleteCoupons(ids: string[]) {
  try {
    if (!ids || ids.length === 0) return { success: false, error: "No coupons selected" };
    
    await db.discount.deleteMany({
        where: { id: { in: ids } } // ✅ Permanent Delete Applied
    });

    revalidatePath("/admin/coupons");
    return { success: true, message: `${ids.length} coupon(s) deleted permanently.` };
  } catch (error) {
    console.error("HARD_DELETE_COUPONS_ERROR", error);
    return { success: false, error: "Failed to delete coupons permanently" };
  }
}