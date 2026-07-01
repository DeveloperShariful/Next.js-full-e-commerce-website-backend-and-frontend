// File: app/actions/backend/coupon/coupon.ts
"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { DiscountType, Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { z } from "zod";
import { logActivity } from "@/lib/activity-logger";

// ==========================================
// TYPES
// ==========================================

export type CouponData = Omit<
  Prisma.DiscountGetPayload<Record<string, never>>,
  "value" | "minSpend" | "maxSpend" | "affiliateCommissionRate"
> & {
  value: number;
  minSpend: number | null;
  maxSpend: number | null;
  affiliateCommissionRate: number | null;
};

type CouponCounts = {
  all: number;
  published: number;
  affiliate: number;
  mine: number;
  trash: number;
};

// ==========================================
// ZOD SCHEMA
// ==========================================

const couponSchema = z.object({
  code: z
    .string()
    .min(3, "Coupon code must be at least 3 characters")
    .max(50, "Coupon code too long")
    .transform((v) => v.toUpperCase().trim()),
  type: z.nativeEnum(DiscountType),
  value: z.coerce.number().positive("Discount value must be positive"),
  description: z.string().optional().nullable(),
  minSpend: z.coerce.number().nonnegative().optional().nullable(),
  usageLimit: z.coerce.number().int().positive().optional().nullable(),
  endDate: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? new Date(v) : null)),
  isActive: z.coerce.boolean().default(true),
  affiliateId: z.string().uuid().optional().nullable(),
  affiliateCommissionRate: z.coerce.number().min(0).max(100).optional().nullable(),
});

// ==========================================
// HELPERS
// ==========================================

async function getAuthUser(): Promise<{ id: string; role: string } | null> {
  const session = await auth();
  if (!session?.user?.email) return null;
  const dbUser = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });
  if (!dbUser) return null;
  const allowed = ["SUPER_ADMIN", "ADMIN", "MANAGER"] as const;
  if (!(allowed as readonly string[]).includes(dbUser.role)) return null;
  return dbUser;
}

function serializeDecimalFields(
  coupons: Prisma.DiscountGetPayload<Record<string, never>>[]
): CouponData[] {
  return coupons.map((c) => ({
    ...c,
    value: Number(c.value),
    minSpend: c.minSpend !== null ? Number(c.minSpend) : null,
    maxSpend: c.maxSpend !== null ? Number(c.maxSpend) : null,
    affiliateCommissionRate:
      c.affiliateCommissionRate !== null ? Number(c.affiliateCommissionRate) : null,
  }));
}

// ==========================================
// 1. GET COUPONS (pagination + search + filter)
// ==========================================

export async function getCoupons(
  page = 1,
  limit = 20,
  query?: string,
  status?: string,
  discountType?: string
): Promise<{
  success: boolean;
  data: CouponData[];
  meta: {
    total: number;
    pages: number;
    counts: CouponCounts;
  } | null;
  error?: string;
}> {
  const emptyResult = {
    success: false,
    data: [],
    meta: null,
    error: "Failed to fetch coupons",
  };

  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    const skip = (page - 1) * limit;

    const isTrashMode = status === "trash";
    const isAffiliateMode = status === "affiliate";
    const isMineMode = status === "mine";
    const isPublishedMode = status === "published";

    const andConditions: Prisma.DiscountWhereInput[] = [
      isTrashMode ? { deletedAt: { not: null } } : { deletedAt: null },
    ];

    if (query) {
      andConditions.push({ code: { contains: query, mode: "insensitive" } });
    }

    if (isAffiliateMode) {
      andConditions.push({ affiliateId: { not: null } });
    }

    if (isPublishedMode && !isTrashMode) {
      andConditions.push({ isActive: true });
    }

    if (discountType && discountType !== "all") {
      andConditions.push({ type: discountType as DiscountType });
    }

    if (isMineMode && currentUserId) {
      // Uses createdBy field added in schema.prisma — requires prisma generate to be run
      andConditions.push(
        { createdBy: currentUserId } as unknown as Prisma.DiscountWhereInput
      );
    }

    const whereCondition: Prisma.DiscountWhereInput = { AND: andConditions };

    const [coupons, totalCount, activeStats, trashCount, affiliateCount, mineCount] =
      await Promise.all([
        db.discount.findMany({
          where: whereCondition,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        db.discount.count({ where: whereCondition }),
        db.discount.groupBy({
          by: ["isActive"],
          _count: { id: true },
          where: { deletedAt: null },
        }),
        db.discount.count({ where: { deletedAt: { not: null } } }),
        db.discount.count({
          where: { affiliateId: { not: null }, deletedAt: null },
        }),
        currentUserId
          ? db.discount.count({
              where: {
                ...({ createdBy: currentUserId } as unknown as Prisma.DiscountWhereInput),
                deletedAt: null,
              },
            })
          : Promise.resolve(0),
      ]);

    const allCount = activeStats.reduce((acc, s) => acc + s._count.id, 0);
    const publishedCount =
      activeStats.find((s) => s.isActive === true)?._count.id ?? 0;

    const counts: CouponCounts = {
      all: allCount,
      published: publishedCount,
      affiliate: affiliateCount,
      mine: mineCount,
      trash: trashCount,
    };

    return {
      success: true,
      data: serializeDecimalFields(coupons),
      meta: {
        total: totalCount,
        pages: Math.ceil(totalCount / limit) || 1,
        counts,
      },
    };
  } catch (error) {
    console.error("GET_COUPONS_ERROR", error);
    return emptyResult;
  }
}

// ==========================================
// 1b. GET SINGLE COUPON BY ID (for edit page)
// ==========================================

export async function getCouponById(
  id: string
): Promise<{ success: boolean; data: CouponData | null; error?: string }> {
  try {
    const coupon = await db.discount.findUnique({
      where: { id, deletedAt: null },
    });

    if (!coupon) return { success: false, data: null, error: "Coupon not found." };

    const [data] = serializeDecimalFields([coupon]);
    return { success: true, data };
  } catch (error) {
    console.error("GET_COUPON_BY_ID_ERROR", error);
    return { success: false, data: null, error: "Failed to fetch coupon." };
  }
}

// ==========================================
// 2. SAVE COUPON (create or update)
// ==========================================

export async function saveCoupon(
  formData: FormData
): Promise<{ success: boolean; message?: string; error?: string }> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized access." };

  const id = (formData.get("id") as string | null)?.trim() || null;
  const isUpdate = !!id;

  const validation = couponSchema.safeParse({
    code: formData.get("code"),
    type: formData.get("type"),
    value: formData.get("value"),
    description: formData.get("description") || null,
    minSpend: formData.get("minSpend") || null,
    usageLimit: formData.get("usageLimit") || null,
    endDate: formData.get("endDate") || null,
    isActive: formData.get("isActive"),
    affiliateId: formData.get("affiliateId") || null,
    affiliateCommissionRate: formData.get("affiliateCommissionRate") || null,
  });

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const data = validation.data;
  const allowFreeShipping = formData.get("allowFreeShipping") === "true";

  try {
    if (isUpdate && id) {
      const oldCoupon = await db.discount.findUnique({
        where: { id },
        select: { code: true, type: true, value: true, isActive: true },
      });

      if (!oldCoupon) return { success: false, error: "Coupon not found." };

      const updateData = {
        code: data.code,
        type: data.type,
        value: data.value,
        description: data.description ?? null,
        minSpend: data.minSpend ?? null,
        usageLimit: data.usageLimit ?? null,
        endDate: data.endDate,
        isActive: data.isActive,
        affiliateId: data.affiliateId ?? null,
        affiliateCommissionRate: data.affiliateCommissionRate ?? null,
        ruleLogic: { allowFreeShipping } as unknown as Prisma.InputJsonValue,
      };

      await db.discount.update({
        where: { id },
        data: updateData as unknown as Prisma.DiscountUpdateInput,
      });

      await logActivity({
        action: "COUPON_UPDATED",
        entityType: "Discount",
        entityId: id,
        details: {
          code: data.code,
          changes: {
            ...(oldCoupon.code !== data.code
              ? { code: { old: oldCoupon.code, new: data.code } }
              : {}),
            ...(Number(oldCoupon.value) !== data.value
              ? { value: { old: Number(oldCoupon.value), new: data.value } }
              : {}),
            ...(oldCoupon.isActive !== data.isActive
              ? { isActive: { old: oldCoupon.isActive, new: data.isActive } }
              : {}),
          },
        },
      });
    } else {
      const existing = await db.discount.findUnique({
        where: { code: data.code },
      });

      if (existing) {
        return {
          success: false,
          error: `Coupon code "${data.code}" already exists.`,
        };
      }

      const createData = {
        code: data.code,
        type: data.type,
        value: data.value,
        description: data.description ?? null,
        minSpend: data.minSpend ?? null,
        usageLimit: data.usageLimit ?? null,
        endDate: data.endDate,
        isActive: data.isActive,
        affiliateId: data.affiliateId ?? null,
        affiliateCommissionRate: data.affiliateCommissionRate ?? null,
        ruleLogic: { allowFreeShipping } as unknown as Prisma.InputJsonValue,
        createdBy: user.id,
      };

      const coupon = await db.discount.create({
        data: createData as unknown as Prisma.DiscountCreateInput,
      });

      await logActivity({
        action: "COUPON_CREATED",
        entityType: "Discount",
        entityId: coupon.id,
        details: {
          code: coupon.code,
          type: coupon.type,
          value: Number(coupon.value),
          isActive: coupon.isActive,
          hasExpiry: !!coupon.endDate,
          hasUsageLimit: !!coupon.usageLimit,
        },
      });
    }

    revalidatePath("/admin/coupons");
    return {
      success: true,
      message: isUpdate
        ? "Coupon updated successfully."
        : "Coupon created successfully.",
    };
  } catch (error) {
    console.error("SAVE_COUPON_ERROR", error);
    return { success: false, error: "Operation failed. Please try again." };
  }
}

// ==========================================
// 3. SOFT DELETE COUPONS
// ==========================================

export async function deleteCoupons(
  ids: string[]
): Promise<{ success: boolean; message?: string; error?: string }> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized access." };

  if (!ids.length) return { success: false, error: "No coupons selected." };

  try {
    const coupons = await db.discount.findMany({
      where: { id: { in: ids } },
      select: { id: true, code: true },
    });

    await db.discount.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: new Date() },
    });

    await logActivity({
      action: "COUPON_BULK_SOFT_DELETED",
      entityType: "Discount",
      entityId: ids[0],
      details: {
        count: ids.length,
        codes: coupons.map((c) => c.code),
      },
    });

    revalidatePath("/admin/coupons");
    return {
      success: true,
      message: `${ids.length} coupon(s) moved to trash.`,
    };
  } catch (error) {
    console.error("DELETE_COUPONS_ERROR", error);
    return { success: false, error: "Failed to move coupons to trash." };
  }
}

// ==========================================
// 4. RESTORE COUPONS
// ==========================================

export async function restoreCoupons(
  ids: string[]
): Promise<{ success: boolean; message?: string; error?: string }> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized access." };

  if (!ids.length) return { success: false, error: "No coupons selected." };

  try {
    await db.discount.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: null },
    });

    await logActivity({
      action: "COUPON_BULK_RESTORED",
      entityType: "Discount",
      entityId: ids[0],
      details: {
        count: ids.length,
        ids,
      },
    });

    revalidatePath("/admin/coupons");
    return {
      success: true,
      message: `${ids.length} coupon(s) restored successfully.`,
    };
  } catch (error) {
    console.error("RESTORE_COUPONS_ERROR", error);
    return { success: false, error: "Failed to restore coupons." };
  }
}

// ==========================================
// 5. HARD DELETE COUPONS (PERMANENT)
// ==========================================

export async function hardDeleteCoupons(
  ids: string[]
): Promise<{ success: boolean; message?: string; error?: string }> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized access." };

  if (!ids.length) return { success: false, error: "No coupons selected." };

  try {
    const coupons = await db.discount.findMany({
      where: { id: { in: ids } },
      select: { id: true, code: true },
    });

    await db.discount.deleteMany({ where: { id: { in: ids } } });

    await logActivity({
      action: "COUPON_BULK_FORCE_DELETED",
      entityType: "Discount",
      entityId: ids[0],
      details: {
        count: ids.length,
        codes: coupons.map((c) => c.code),
        permanent: true,
      },
    });

    revalidatePath("/admin/coupons");
    return {
      success: true,
      message: `${ids.length} coupon(s) permanently deleted.`,
    };
  } catch (error) {
    console.error("HARD_DELETE_COUPONS_ERROR", error);
    return { success: false, error: "Failed to permanently delete coupons." };
  }
}

// ==========================================
// 6. CHECK AFFILIATE MODULE ENABLED
// ==========================================

export async function getAffiliateEnabled(): Promise<boolean> {
  try {
    const settings = await db.storeSettings.findUnique({
      where: { id: "settings" },
      select: { generalConfig: true },
    });
    if (!settings?.generalConfig) return false;
    const config = settings.generalConfig as Record<string, unknown>;
    return config.enableAffiliateProgram === true;
  } catch {
    return false;
  }
}
