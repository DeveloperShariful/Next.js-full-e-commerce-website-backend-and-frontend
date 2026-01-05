//app/actions/admin/analytics/index.ts

"use server";

import { getAnalyticsDateRanges } from "./utils";
import { getFinancialAnalytics } from "./general-analytics";
import { getProductAnalytics } from "./product-analytics";
import { getCustomerAnalytics } from "./customer-analytics";
import { getMarketingAnalytics } from "./marketing-analytics";

// --- NEW IMPORTS ---
import { getTrafficAnalytics } from "./traffic-analytics";
import { getReputationAndBrandAnalytics } from "./reputation-brand-analytics";
import { getSalesForecast } from "./forecasting";

import { AnalyticsResponse, Period } from "./types";

/**
 * MASTER ANALYTICS AGGREGATOR (UPDATED V2)
 * ---------------------------------------------------------
 * Now includes Traffic, Reputation, Brands, and AI Forecasting.
 * Fetches 7 parallel queries for maximum performance.
 */
export async function getAnalyticsDashboardData(
  period: Period = "30d", 
  customStart?: Date, 
  customEnd?: Date
): Promise<{ success: boolean; data?: AnalyticsResponse; error?: string }> {
  
  try {
    // 1. Calculate Date Ranges
    const { current, previous } = getAnalyticsDateRanges(period, customStart, customEnd);

    // 2. Parallel Data Fetching (The Power of Server Actions)
    const [
      financialData,
      productData,
      customerData,
      marketingData,
      trafficData,      // NEW
      reputationData,   // NEW
      forecastData      // NEW
    ] = await Promise.all([
      getFinancialAnalytics(current, previous),
      getProductAnalytics(current),
      getCustomerAnalytics(current),
      getMarketingAnalytics(current),
      getTrafficAnalytics(current),
      getReputationAndBrandAnalytics(current),
      getSalesForecast() // Forecasting uses its own fixed 90d history
    ]);

    // 3. Construct the Full "High Pro" Response
    const response: AnalyticsResponse = {
      // Financials
      summary: financialData.summary,
      salesChart: financialData.chartData,
      
      // Products
      topProducts: productData.topProducts,
      inventoryHealth: productData.inventoryHealth,
      categoryPerformance: productData.categoryPerformance,
      
      // Customers
      customerDemographics: customerData.customerDemographics,
      customerTypeBreakdown: customerData.customerTypeBreakdown,
      topCustomers: customerData.topCustomers,
      
      // Marketing
      orderStatusDistribution: marketingData.orderStatusDistribution,
      paymentMethodDistribution: marketingData.paymentMethodDistribution,
      cartMetrics: marketingData.cartMetrics,
      topCoupons: marketingData.topCoupons,

      // --- NEW SECTIONS ---
      // Traffic
      conversionFunnel: trafficData.conversionFunnel,
      mostViewedProducts: trafficData.mostViewedProducts,

      // Reputation & Brand
      reviewSummary: reputationData.reviewSummary,
      brandPerformance: reputationData.brandPerformance,

      // Forecasting
      salesForecast: forecastData
    }; 

    return {
      success: true,
      data: response
    };

  } catch (error) {
    console.error("🔥 ANALYTICS AGGREGATION ERROR:", error);
    return { 
      success: false, 
      error: "Failed to generate comprehensive analytics report." 
    };
  }
}