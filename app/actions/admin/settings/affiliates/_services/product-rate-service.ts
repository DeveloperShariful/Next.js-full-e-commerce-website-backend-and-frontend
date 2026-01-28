// File: app/actions/admin/settings/affiliate/_services/product-rate-service.ts

"use server";

import { db } from "@/lib/prisma";
import { Prisma, CommissionType } from "@prisma/client";
import { DecimalMath } from "@/lib/utils/decimal-math";
import { auditService } from "@/lib/services/audit-service";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "../types";
import { syncUser } from "@/lib/auth-sync";

// =========================================
// READ OPERATIONS
// =========================================
export async function getAllRates(page: number = 1, limit: number = 20, search?: string) {
  const skip = (page - 1) * limit;

  const where: Prisma.AffiliateProductRateWhereInput = search ? {
    OR: [
      { product: { name: { contains: search, mode: "insensitive" } } },
      { affiliate: { user: { name: { contains: search, mode: "insensitive" } } } },
      { group: { name: { contains: search, mode: "insensitive" } } }
    ]
  } : {};

  const [total, data] = await Promise.all([
    db.affiliateProductRate.count({ where }),
    db.affiliateProductRate.findMany({
      where,
      take: limit,
      skip,
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: { id: true, name: true, slug: true, price: true, images: true }
        },
        affiliate: {
          select: { id: true, slug: true, user: { select: { name: true, email: true } } }
        },
        group: {
          select: { id: true, name: true, slug: true }
        }
      }
    })
  ]);

  return { rates: data, total, totalPages: Math.ceil(total / limit) };
}

export async function searchProducts(query: string) {
  return await db.product.findMany({
    where: {
      name: { contains: query, mode: "insensitive" },
      status: "ACTIVE"
    },
    take: 10,
    select: { id: true, name: true, price: true }
  });
}

// =========================================
// SERVER ACTIONS (Mutations)
// =========================================

export async function upsertRateAction(data: {
  id?: string;
  productId: string;
  rate: number;
  type: CommissionType;
  isDisabled: boolean;
  affiliateId?: string | null;
  groupId?: string | null;
}): Promise<ActionResponse> {
  try {
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) return { success: false, message: "Unauthorized" };

    const rateDecimal = DecimalMath.toDecimal(data.rate);

    if (data.id) {
      await db.affiliateProductRate.update({
        where: { id: data.id },
        data: {
          rate: rateDecimal,
          type: data.type,
          isDisabled: data.isDisabled,
          affiliateId: data.affiliateId || null,
          groupId: data.groupId || null
        }
      });
    } else {
      const existing = await db.affiliateProductRate.findFirst({
        where: {
          productId: data.productId,
          affiliateId: data.affiliateId || null,
          groupId: data.groupId || null
        }
      });

      if (existing) return { success: false, message: "Rule exists for this combination" };

      await db.affiliateProductRate.create({
        data: {
          productId: data.productId,
          rate: rateDecimal,
          type: data.type,
          isDisabled: data.isDisabled,
          affiliateId: data.affiliateId || null,
          groupId: data.groupId || null
        }
      });
    }

    revalidatePath("/admin/settings/affiliate/product-rates");
    return { success: true, message: "Rule saved." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function deleteRateAction(id: string): Promise<ActionResponse> {
  try {
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) return { success: false, message: "Unauthorized" };

    await db.affiliateProductRate.delete({ where: { id } });
    
    revalidatePath("/admin/settings/affiliate/product-rates");
    return { success: true, message: "Rule removed." };
  } catch (error: any) {
    return { success: false, message: "Failed to delete." };
  }
}

export async function bulkImportRatesAction(rates: {
  productId: string;
  rate: number;
  type: CommissionType;
}[]): Promise<ActionResponse> {
  try {
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) return { success: false, message: "Unauthorized" };

    if (rates.length === 0) return { success: false, message: "No data provided" };
    if (rates.length > 500) return { success: false, message: "Limit 500 rows per import" };

    await db.$transaction(async (tx) => {
      for (const r of rates) {
         const existing = await tx.affiliateProductRate.findFirst({
           where: { productId: r.productId, affiliateId: null, groupId: null }
         });
         
         if(existing) {
           await tx.affiliateProductRate.update({
             where: { id: existing.id },
             data: { rate: r.rate, type: r.type }
           });
         } else {
           await tx.affiliateProductRate.create({
             data: { productId: r.productId, rate: r.rate, type: r.type }
           });
         }
      }
    });

    await auditService.log({
      userId: auth.id,
      action: "BULK_IMPORT",
      entity: "AffiliateProductRate",
      entityId: "BULK",
      meta: { count: rates.length }
    });

    revalidatePath("/admin/settings/affiliate/product-rates");
    return { success: true, message: `Imported ${rates.length} rates successfully.` };
  } catch (error: any) {
    return { success: false, message: "Bulk import failed." };
  }
}