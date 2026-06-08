//app/actions/backend/merchant-center/gmc-reports.actions.ts

"use server";

import { db } from "@/lib/prisma";
import { google } from "googleapis";

// ============================================================================
// 1. INTERFACES
// ============================================================================
export interface CampaignData {
  id: string;
  name: string;
  status: string;
  cost: string;
  clicks: number;
  conversions: string;
}

export interface DashboardMetrics {
  totalClicks: number;
  totalImpressions: number;
  totalCost: number;
  totalConversions: number;
  optimizationScore: string; 
  campaigns: CampaignData[]; 
  chartData: { date: string; clicks: number; impressions: number; conversions: number; cost: number }[];
}

// 🚀 NEW: GMC Reports Interface
export interface GmcReportData {
  totalClicks: number;
  totalImpressions: number;
  chartData: { date: string; clicks: number; impressions: number }[];
  productData: { id: string; title: string; clicks: number; impressions: number }[];
}

// ============================================================================
// 2. FETCH GOOGLE ADS LIVE PERFORMANCE METRICS
// ============================================================================
export async function fetchGoogleAdsMetrics(): Promise<{ success: boolean; data?: DashboardMetrics; error?: string }> {
  try {
    const config = await db.marketingIntegration.findUnique({
      where: { id: "marketing_config" },
      select: { googleAccessToken: true, googleAdsAccountId: true, googleAdsConnected: true }
    });

    if (!config?.googleAdsConnected || !config?.googleAdsAccountId || !config?.googleAccessToken) {
      return { success: false, error: "Google Ads account is not connected." };
    }

    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    if (!devToken) return { success: false, error: "Developer token is missing." };

    const formattedAccountId = config.googleAdsAccountId.replace(/-/g, "");
    
    const apiHeaders = {
      "Authorization": `Bearer ${config.googleAccessToken}`,
      "developer-token": devToken.trim(),
      "Content-Type": "application/json",
      "login-customer-id": formattedAccountId 
    };

    const query = `
      SELECT segments.date, metrics.clicks, metrics.impressions, metrics.cost_micros, metrics.conversions 
      FROM customer WHERE segments.date DURING LAST_30_DAYS ORDER BY segments.date ASC
    `;

    const response = await fetch(`https://googleads.googleapis.com/v24/customers/${formattedAccountId}/googleAds:search`, {
      method: "POST", headers: apiHeaders, body: JSON.stringify({ query }), cache: "no-store", 
    });

    if (!response.ok) return { success: false, error: "Failed to fetch metrics from Google Ads API." };

    const responseData = await response.json();
    const rows = responseData.results || [];

    let totalClicks = 0; let totalImpressions = 0; let totalCostMicros = 0; let totalConversions = 0;
    const chartData: any[] = [];

    rows.forEach((row: any) => {
      const metrics = row.metrics || {};
      const dateStr = row.segments?.date || ""; 
      const clicks = Number(metrics.clicks || 0);
      const impressions = Number(metrics.impressions || 0);
      const conversions = Number(metrics.conversions || 0);
      const costMicros = Number(metrics.costMicros || 0);

      totalClicks += clicks; totalImpressions += impressions; totalConversions += conversions; totalCostMicros += costMicros;

      const dateObj = new Date(dateStr);
      chartData.push({
        date: dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        clicks, impressions, conversions, cost: Number((costMicros / 1000000).toFixed(2))
      });
    });

    const finalTotalCost = Number((totalCostMicros / 1000000).toFixed(2));

    let optScoreStr = "N/A";
    try {
      const optScoreQuery = `SELECT customer.optimization_score FROM customer LIMIT 1`;
      const optRes = await fetch(`https://googleads.googleapis.com/v24/customers/${formattedAccountId}/googleAds:search`, {
        method: "POST", headers: apiHeaders, body: JSON.stringify({ query: optScoreQuery }), cache: "no-store",
      });
      if (optRes.ok) {
        const optData = await optRes.json();
        const rawScore = optData.results?.[0]?.customer?.optimizationScore;
        if (rawScore !== undefined && rawScore !== null) optScoreStr = `${(Number(rawScore) * 100).toFixed(1)}%`;
      }
    } catch (e) {}

    let campaignsList: CampaignData[] = [];
    try {
      const campQuery = `SELECT campaign.id, campaign.name, campaign.status, metrics.cost_micros, metrics.clicks, metrics.conversions FROM campaign WHERE segments.date DURING LAST_30_DAYS ORDER BY metrics.cost_micros DESC LIMIT 5`;
      const campRes = await fetch(`https://googleads.googleapis.com/v24/customers/${formattedAccountId}/googleAds:search`, {
        method: "POST", headers: apiHeaders, body: JSON.stringify({ query: campQuery }), cache: "no-store",
      });
      if (campRes.ok) {
        const campData = await campRes.json();
        campaignsList = (campData.results || []).map((row: any) => {
          const camp = row.campaign || {}; const m = row.metrics || {};
          return {
            id: camp.id || "", name: camp.name || "Unknown Campaign", status: camp.status || "UNKNOWN",
            cost: (Number(m.costMicros || 0) / 1000000).toFixed(2), clicks: Number(m.clicks || 0), conversions: Number(m.conversions || 0).toFixed(2)
          };
        });
      }
    } catch (e) {}

    return { 
      success: true, 
      data: { totalClicks, totalImpressions, totalCost: finalTotalCost, totalConversions, optimizationScore: optScoreStr, campaigns: campaignsList, chartData }
    };
  } catch (error: any) {
    return { success: false, error: "An unexpected error occurred while fetching metrics." };
  }
}

// ============================================================================
// 🚀 3. NEW: FETCH GOOGLE MERCHANT CENTER ORGANIC REPORTS (WooCommerce Style)
// ============================================================================
export async function fetchGmcReportsData(): Promise<{ success: boolean; data?: GmcReportData; error?: string }> {
  // Safety Fallback if API fails
  const defaultData: GmcReportData = { totalClicks: 0, totalImpressions: 0, chartData: [], productData: [] };

  try {
    const config = await db.marketingIntegration.findUnique({
      where: { id: "marketing_config" },
      select: { googleRefreshToken: true, gmcMerchantId: true }
    });

    if (!config?.googleRefreshToken || !config?.gmcMerchantId) {
      return { success: true, data: defaultData };
    }

    const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    oauth2Client.setCredentials({ refresh_token: config.googleRefreshToken });
    
    // Using Content API v2.1 for GMC Reporting
    const shoppingContent = google.content({ version: "v2.1", auth: oauth2Client });

    // 🚀 Query 1: Daily Chart & Totals
    const dailyQuery = `
      SELECT segments.date, metrics.clicks, metrics.impressions 
      FROM MerchantPerformanceView 
      WHERE segments.date DURING LAST_30_DAYS 
      ORDER BY segments.date ASC
    `;

    // 🚀 Query 2: Product Level Data (Top 50 clicked products)
    const productQuery = `
      SELECT segments.offer_id, segments.title, metrics.clicks, metrics.impressions 
      FROM MerchantPerformanceView 
      WHERE segments.date DURING LAST_30_DAYS 
      ORDER BY metrics.clicks DESC 
      LIMIT 50
    `;

    const [dailyRes, productRes] = await Promise.all([
      shoppingContent.reports.search({ merchantId: config.gmcMerchantId, requestBody: { query: dailyQuery } }).catch(() => null),
      shoppingContent.reports.search({ merchantId: config.gmcMerchantId, requestBody: { query: productQuery } }).catch(() => null)
    ]);

    let totalClicks = 0;
    let totalImpressions = 0;
    const chartData: any[] = [];
    const productData: any[] = [];

    // Process Chart Data
    if (dailyRes?.data?.results) {
      dailyRes.data.results.forEach((row: any) => {
        const m = row.metrics || {};
        const d = row.segments?.date || {};
        // Google Content API returns date as an object { year, month, day }
        if (d.year && d.month && d.day) {
          const dateStr = `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
          const dateObj = new Date(dateStr);
          const clicks = Number(m.clicks || 0);
          const impressions = Number(m.impressions || 0);

          totalClicks += clicks;
          totalImpressions += impressions;

          chartData.push({
            date: dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            clicks,
            impressions
          });
        }
      });
    }

    // Process Product Table Data
    if (productRes?.data?.results) {
      productRes.data.results.forEach((row: any) => {
        const m = row.metrics || {};
        const s = row.segments || {};
        productData.push({
          id: s.offerId || "Unknown ID",
          title: s.title || "Unknown Product",
          clicks: Number(m.clicks || 0),
          impressions: Number(m.impressions || 0)
        });
      });
    }

    return { success: true, data: { totalClicks, totalImpressions, chartData, productData } };

  } catch (error) {
    console.error("GMC Reports API Error:", error);
    return { success: true, data: defaultData }; // Return empty data without crashing
  }
}