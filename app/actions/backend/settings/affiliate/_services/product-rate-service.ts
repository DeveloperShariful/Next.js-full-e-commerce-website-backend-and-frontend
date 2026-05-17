// File: app/actions/admin/settings/affiliate/_services/product-rate-service.ts

"use server";

import { db } from "@/lib/prisma";
import { Prisma, CommissionType } from "@prisma/client";
import { DecimalMath } from "@/lib/decimal-math";
import { auditService } from "@/lib/audit-service";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "../types";
import { protectAction } from "../permission-service";

// =========================================
// READ OPERATIONS
// =========================================

export async function getAllRates(page: number = 1, limit: number = 20, search?: string) {
  await protectAction("VIEW_ANALYTICS");

  const skip = (page - 1) * limit;
  const where: Prisma.AffiliateProductRateWhereInput = {
    product: {
      deletedAt: null, 
      ...(search && { name: { contains: search, mode: "insensitive" } })
    },
    ...(search && {
      OR: [
        { product: { name: { contains: search, mode: "insensitive" } } },
        { affiliate: { user: { name: { contains: search, mode: "insensitive" } } } },
        { group: { name: { contains: search, mode: "insensitive" } } }
      ]
    })
  };

  const [total, data] = await Promise.all([
    db.affiliateProductRate.count({ where }),
    db.affiliateProductRate.findMany({
      where,
      take: limit,
      skip,
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: { 
            id: true, 
            name: true, 
            slug: true, 
            price: true, 
            images: true,
            affiliateCommissionRate: true,
            affiliateCommissionType: true
          }
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
  await protectAction("MANAGE_CONFIGURATION");
  
  return await db.product.findMany({
    where: {
      name: { contains: query, mode: "insensitive" },
      status: "ACTIVE",
      deletedAt: null 
    },
    take: 10,
    select: { 
        id: true, 
        name: true, 
        price: true,
        affiliateCommissionRate: true 
    }
  });
}

// =========================================
// WRITE OPERATIONS
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
    const actor = await protectAction("MANAGE_CONFIGURATION");
    const rateDecimal = DecimalMath.toDecimal(data.rate);

    if (data.affiliateId && data.groupId) {
      return { success: false, message: "Cannot assign to both Affiliate and Group at once." };
    }

    const productExists = await db.product.findFirst({
        where: { id: data.productId, deletedAt: null }
    });
    if (!productExists) return { success: false, message: "Product not found or deleted." };

    const payload = {
      rate: rateDecimal,
      type: data.type,
      isDisabled: data.isDisabled,
      affiliateId: data.affiliateId || null,
      groupId: data.groupId || null,
    };

    if (data.id) {
      await db.affiliateProductRate.update({
        where: { id: data.id },
        data: payload
      });
    } 
    else {
      if (data.affiliateId) {
        await db.affiliateProductRate.upsert({
          where: {
            productId_affiliateId: {
              productId: data.productId,
              affiliateId: data.affiliateId
            }
          },
          create: { productId: data.productId, ...payload },
          update: payload
        });
      } else if (data.groupId) {
        await db.affiliateProductRate.upsert({
          where: {
            productId_groupId: {
              productId: data.productId,
              groupId: data.groupId
            }
          },
          create: { productId: data.productId, ...payload },
          update: payload
        });
      } else {
        const existingGlobal = await db.affiliateProductRate.findFirst({
          where: { productId: data.productId, affiliateId: null, groupId: null }
        });

        if (existingGlobal) {
          await db.affiliateProductRate.update({
            where: { id: existingGlobal.id },
            data: payload
          });
        } else {
          await db.affiliateProductRate.create({
            data: { productId: data.productId, ...payload }
          });
        }
      }
    }

    await auditService.log({
        userId: actor.id,
        action: "UPSERT_PRODUCT_RATE",
        entity: "AffiliateProductRate",
        entityId: data.id || "UPSERT",
        newData: data
    });

    revalidatePath("/admin/settings/affiliate/product-rates");
    return { success: true, message: "Commission override saved successfully." };
  } catch (error: any) {
    console.error(error);
    return { success: false, message: error.message || "Database error occurred." };
  }
}

export async function deleteRateAction(id: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_CONFIGURATION");

    await db.affiliateProductRate.delete({ where: { id } });
    
    await auditService.log({
        userId: actor.id,
        action: "DELETE_PRODUCT_RATE",
        entity: "AffiliateProductRate",
        entityId: id
    });

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
    const actor = await protectAction("MANAGE_CONFIGURATION");

    if (rates.length === 0) return { success: false, message: "No data provided" };
    if (rates.length > 500) return { success: false, message: "Limit 500 rows per import" };

    const productIds = rates.map(r => r.productId);
    const validProducts = await db.product.findMany({
        where: { id: { in: productIds }, deletedAt: null },
        select: { id: true }
    });
    const validIdSet = new Set(validProducts.map(p => p.id));
    const validRates = rates.filter(r => validIdSet.has(r.productId));

    if (validRates.length < rates.length) {
        console.warn(`Skipped ${rates.length - validRates.length} invalid products in import`);
    }

    await db.$transaction(async (tx) => {
      for (const r of validRates) {
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
      userId: actor.id,
      action: "BULK_IMPORT_RATES",
      entity: "AffiliateProductRate",
      entityId: "BULK",
      meta: { count: validRates.length }
    });

    revalidatePath("/admin/settings/affiliate/product-rates");
    return { success: true, message: `Imported ${validRates.length} rates successfully.` };
  } catch (error: any) {
    return { success: false, message: "Bulk import failed." };
  }
}