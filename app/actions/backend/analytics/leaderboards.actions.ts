//File: app/actions/backend/analytics/leaderboards.actions.ts

"use server";

import { db } from "@/lib/prisma";
import { DateRange } from "./shared.utils";

// স্ট্রিক্ট টাইপস (No any)
export interface TopProductData {
  id: string;
  name: string;
  itemsSold: number;
  netSales: number;
}

export interface TopCategoryData {
  id: string;
  name: string;
  itemsSold: number;
  netSales: number;
}

export interface LeaderboardsResponse {
  topProducts: TopProductData[];
  topCategories: TopCategoryData[];
}

export async function getLeaderboardsData(
  currentRange: DateRange
): Promise<LeaderboardsResponse> {
  
  // ১. Top Products Query (Grouping by productId)
  const productGroups = await db.productAnalytics.groupBy({
    by: ["productId"],
    where: {
      date: {
        gte: currentRange.from,
        lte: currentRange.to,
      },
    },
    _sum: {
      itemsSold: true,
      netSales: true,
    },
    orderBy: {
      _sum: { itemsSold: "desc" },
    },
    take: 5, // Top 5 Products
  });

  // Product ID দিয়ে অরিজিনাল প্রোডাক্টের নাম ফেচ করা
  const topProducts: TopProductData[] = await Promise.all(
    productGroups.map(async (group) => {
      const product = await db.product.findUnique({
        where: { id: group.productId },
        select: { name: true },
      });

      return {
        id: group.productId,
        name: product?.name || "Unknown Product",
        itemsSold: group._sum.itemsSold || 0,
        netSales: Number(group._sum.netSales) || 0,
      };
    })
  );

  // ২. Top Categories Query (Grouping by categoryId)
  // (স্কিমা অনুযায়ী ProductAnalytics এ categoryId রাখা আছে)
  const categoryGroups = await db.productAnalytics.groupBy({
    by: ["categoryId"],
    where: {
      date: {
        gte: currentRange.from,
        lte: currentRange.to,
      },
      categoryId: { not: null }, // Null ক্যাটাগরি ইগনোর করা
    },
    _sum: {
      itemsSold: true,
      netSales: true,
    },
    orderBy: {
      _sum: { itemsSold: "desc" },
    },
    take: 5, // Top 5 Categories
  });

  // Category ID দিয়ে অরিজিনাল ক্যাটাগরির নাম ফেচ করা
  const topCategories: TopCategoryData[] = await Promise.all(
    categoryGroups.map(async (group) => {
      if (!group.categoryId) return null;
      
      const category = await db.category.findUnique({
        where: { id: group.categoryId },
        select: { name: true },
      });

      return {
        id: group.categoryId,
        name: category?.name || "Unknown Category",
        itemsSold: group._sum.itemsSold || 0,
        netSales: Number(group._sum.netSales) || 0,
      };
    })
  ).then(res => res.filter((item): item is TopCategoryData => item !== null));

  return {
    topProducts,
    topCategories,
  };
}