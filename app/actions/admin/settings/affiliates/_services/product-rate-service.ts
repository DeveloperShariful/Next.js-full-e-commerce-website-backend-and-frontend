//File: app/actions/admin/settings/affiliates/_services/product-rate-service.ts

import { db } from "@/lib/prisma";
import { Prisma, CommissionType } from "@prisma/client";

export const productRateService = {
  async getAllRates(page: number = 1, limit: number = 20, search?: string) {
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

    return { 
      rates: data, 
      total, 
      totalPages: Math.ceil(total / limit) 
    };
  },

  async upsertRate(data: {
    id?: string;
    productId: string;
    affiliateId?: string | null;
    groupId?: string | null;
    rate: number;
    type: CommissionType;
    isDisabled: boolean;
  }) {
    if (data.id) {
      return await db.affiliateProductRate.update({
        where: { id: data.id },
        data: {
          rate: data.rate,
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

      if (existing) {
        throw new Error("A rate rule already exists for this combination.");
      }

      return await db.affiliateProductRate.create({
        data: {
          productId: data.productId,
          rate: data.rate,
          type: data.type,
          isDisabled: data.isDisabled,
          affiliateId: data.affiliateId || null,
          groupId: data.groupId || null
        }
      });
    }
  },

  async deleteRate(id: string) {
    return await db.affiliateProductRate.delete({
      where: { id }
    });
  },

  async searchProducts(query: string) {
    return await db.product.findMany({
      where: {
        name: { contains: query, mode: "insensitive" },
        status: "ACTIVE"
      },
      take: 10,
      select: { id: true, name: true, price: true }
    });
  }
};