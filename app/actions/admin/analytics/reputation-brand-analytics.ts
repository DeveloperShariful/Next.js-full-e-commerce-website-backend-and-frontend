//app/actions/admin/analytics/reputation-brand-analytics.ts

"use server";

import { db } from "@/lib/prisma";
import { DateRange, ReviewSummary, BrandPerformanceMetric } from "./types";

export async function getReputationAndBrandAnalytics(current: DateRange): Promise<{
  reviewSummary: ReviewSummary;
  brandPerformance: BrandPerformanceMetric[];
}> {

  const reviews = await db.review.findMany({
    where: {
      createdAt: { gte: current.startDate, lte: current.endDate }
    },
    select: {
      rating: true,
      content: true,
      id: true,
      user: { select: { name: true } },
      product: { select: { name: true } }
    }
  });

  // ✅ FIX: Decimal -> Number (rating is already Decimal in schema)
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? reviews.reduce((acc, r) => acc + Number(r.rating), 0) / totalReviews 
    : 0;

  const distMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(r => {
    // Convert to number before comparison
    const rating = Number(r.rating);
    if (rating >= 1 && rating <= 5) {
      distMap[Math.floor(rating) as keyof typeof distMap]++;
    }
  });

  const ratingDistribution = Object.entries(distMap).map(([star, count]) => ({
    star: parseInt(star),
    count
  })).sort((a, b) => b.star - a.star);

  const recentNegativeReviews = reviews
    .filter(r => Number(r.rating) <= 2)
    .slice(0, 5)
    .map(r => ({
      id: r.id,
      author: r.user?.name || "Anonymous",
      rating: Number(r.rating),
      comment: r.content || "No comment",
      productName: r.product?.name || "Unknown Product"
    }));

  const brandItems = await db.orderItem.findMany({
    where: {
      order: {
        createdAt: { gte: current.startDate, lte: current.endDate },
        status: { notIn: ["CANCELLED", "FAILED"] }
      }
    },
    select: {
      total: true,
      quantity: true,
      product: {
        select: {
          costPerItem: true,
          brand: {
            select: { id: true, name: true }
          }
        }
      }
    }
  });

  const brandMap = new Map<string, BrandPerformanceMetric>();

  brandItems.forEach(item => {
    if (item.product?.brand) {
      const brand = item.product.brand;
      // ✅ FIX: Decimal -> Number
      const revenue = Number(item.total);
      const cost = Number(item.product.costPerItem || 0) * item.quantity;
      const profit = revenue - cost;

      if (brandMap.has(brand.id)) {
        const existing = brandMap.get(brand.id)!;
        existing.revenue += revenue;
        existing.profitEstimate += profit;
        existing.orders += 1; 
      } else {
        brandMap.set(brand.id, {
          id: brand.id,
          name: brand.name,
          revenue,
          profitEstimate: profit,
          orders: 1
        });
      }
    }
  });

  const brandPerformance = Array.from(brandMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8); 

  return {
    reviewSummary: {
      averageRating,
      totalReviews,
      ratingDistribution,
      recentNegativeReviews
    },
    brandPerformance
  };
}