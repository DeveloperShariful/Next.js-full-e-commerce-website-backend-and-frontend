//app/actions/admin/analytics/reputation-brand-analytics.ts

"use server";

import { db } from "@/lib/prisma";
import { DateRange, ReviewSummary, BrandPerformanceMetric } from "./types";

/**
 * Calculates Brand Profitability and Customer Sentiment (Reviews).
 */
export async function getReputationAndBrandAnalytics(current: DateRange): Promise<{
  reviewSummary: ReviewSummary;
  brandPerformance: BrandPerformanceMetric[];
}> {

  // ====================================================
  // 1. REPUTATION (Reviews)
  // ====================================================
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

  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews 
    : 0;

  // Distribution (1 to 5 stars)
  const distMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(r => {
    if (r.rating >= 1 && r.rating <= 5) {
      distMap[r.rating as keyof typeof distMap]++;
    }
  });

  const ratingDistribution = Object.entries(distMap).map(([star, count]) => ({
    star: parseInt(star),
    count
  })).sort((a, b) => b.star - a.star);

  // Recent Negative Reviews (Actionable Items)
  const recentNegativeReviews = reviews
    .filter(r => r.rating <= 2)
    .slice(0, 5)
    .map(r => ({
      id: r.id,
      author: r.user?.name || "Anonymous",
      rating: r.rating,
      comment: r.content || "No comment",
      productName: r.product?.name || "Unknown Product"
    }));

  // ====================================================
  // 2. BRAND ANALYTICS (Supply Chain)
  // ====================================================
  // Analyze which brands are generating the most revenue.
  // We need to fetch OrderItems and resolve their Product's Brand.
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
      const revenue = item.total;
      // Calculate Profit: Revenue - (Cost * Qty)
      const cost = (item.product.costPerItem || 0) * item.quantity;
      const profit = revenue - cost;

      if (brandMap.has(brand.id)) {
        const existing = brandMap.get(brand.id)!;
        existing.revenue += revenue;
        existing.profitEstimate += profit;
        existing.orders += 1; // Technically line items, but indicates volume
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
    .slice(0, 8); // Top 8 Brands

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