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
  totalClicks: string;
  totalImpressions: string;
  totalCost: string;
  totalConversions: string;
  avgCpc: string;
  optimizationScore: string;
  campaigns: CampaignData[];
  chartData: { date: string; clicks: number; impressions: number; conversions: number; cost: number }[];
}

export interface GmcReportData {
  totalClicks: number;
  totalImpressions: number;
  chartData: { date: string; clicks: number; impressions: number }[];
  productData: { id: string; title: string; clicks: number; impressions: number }[];
}

// ============================================================================
// 🚀 2. FETCH GOOGLE ADS LIVE PERFORMANCE METRICS (DASHBOARD TAB)
// ============================================================================
export async function fetchGoogleAdsMetrics(): Promise<{ success: boolean; data?: DashboardMetrics; error?: string }> {
  const defaultEmptyMetrics: DashboardMetrics = {
    totalClicks: "0", totalImpressions: "0", totalCost: "0.00", totalConversions: "0.00",
    avgCpc: "0.00", optimizationScore: "N/A", campaigns: [], chartData: []
  };

  try {
    const config = await db.marketingIntegration.findUnique({
      where: { id: "marketing_config" },
      select: { googleAccessToken: true, googleRefreshToken: true, googleAdsAccountId: true, googleAdsConnected: true }
    });

    if (!config?.googleAdsConnected || !config?.googleAdsAccountId || !config?.googleRefreshToken) {
      return { success: true, data: defaultEmptyMetrics };
    }

    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    if (!devToken) return { success: true, error: "Developer token is missing.", data: defaultEmptyMetrics };

    // Auto Token Refresh Logic
    let activeToken = config.googleAccessToken;
    try {
      const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
      oauth2Client.setCredentials({ refresh_token: config.googleRefreshToken });
      const { token } = await oauth2Client.getAccessToken();
      if (token) activeToken = token;
    } catch (e) { console.warn("Token refresh failed in background."); }

    const formattedAccountId = config.googleAdsAccountId.replace(/-/g, "");
    const apiUrl = `https://googleads.googleapis.com/v24/customers/${formattedAccountId}/googleAds:search`;
    const headers = {
      "Authorization": `Bearer ${activeToken}`,
      "developer-token": devToken.trim(),
      "Content-Type": "application/json",
      "login-customer-id": formattedAccountId 
    };

    const summaryQuery = `SELECT metrics.clicks, metrics.impressions, metrics.cost_micros, metrics.conversions FROM customer WHERE segments.date DURING LAST_30_DAYS`;
    const chartQuery = `SELECT segments.date, metrics.clicks, metrics.impressions, metrics.conversions FROM customer WHERE segments.date DURING LAST_30_DAYS ORDER BY segments.date ASC`;
    const optScoreQuery = `SELECT customer.optimization_score FROM customer LIMIT 1`;
    const campaignQuery = `SELECT campaign.id, campaign.name, campaign.status, metrics.cost_micros, metrics.clicks, metrics.conversions FROM campaign WHERE segments.date DURING LAST_30_DAYS ORDER BY metrics.cost_micros DESC LIMIT 5`;

    // 🚀 ১. মেইন কোয়েরি কল
    const summaryRes = await fetch(apiUrl, { method: "POST", headers, body: JSON.stringify({ query: summaryQuery }), cache: "no-store" });
    
    if (!summaryRes.ok) {
      return { success: true, error: "API Restricted or Unavailable for this account.", data: defaultEmptyMetrics };
    }

    const summaryData = await summaryRes.json();
    let sumClicks = 0; let sumImpressions = 0; let sumCostMicros = 0; let sumConversions = 0;
    (summaryData.results || []).forEach((row: any) => {
      const m = row.metrics || {};
      sumClicks += Number(m.clicks || 0); sumImpressions += Number(m.impressions || 0);
      sumCostMicros += Number(m.costMicros || 0); sumConversions += Number(m.conversions || 0);
    });

    const finalCost = sumCostMicros / 1000000;
    const avgCpc = sumClicks > 0 ? (finalCost / sumClicks).toFixed(2) : "0.00";

    // 🚀 ২. বাকি রিকোয়েস্টগুলো আলাদাভাবে করা হচ্ছে (যাতে ফেইল করলে মেইন ডেটা না হারায়)
    let chartData: any[] = [];
    let optScoreStr = "N/A";
    let campaigns: CampaignData[] = [];

    // Chart Data
    const chartRes = await fetch(apiUrl, { method: "POST", headers, body: JSON.stringify({ query: chartQuery }), cache: "no-store" });
    if (chartRes.ok) {
      const chartDataRes = await chartRes.json();
      chartData = (chartDataRes.results || []).map((row: any) => {
        const dateObj = new Date(row.segments?.date || "");
        return {
          date: dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          clicks: Number(row.metrics?.clicks || 0), impressions: Number(row.metrics?.impressions || 0), conversions: Number(row.metrics?.conversions || 0)
        };
      });
    }

    // Optimization Score
    const optScoreRes = await fetch(apiUrl, { method: "POST", headers, body: JSON.stringify({ query: optScoreQuery }), cache: "no-store" });
    if (optScoreRes.ok) {
      const optScoreData = await optScoreRes.json();
      const rawScore = optScoreData.results?.[0]?.customer?.optimizationScore;
      if (rawScore !== undefined && rawScore !== null) optScoreStr = `${(Number(rawScore) * 100).toFixed(1)}%`;
    }

    // Campaigns Data
    const campaignRes = await fetch(apiUrl, { method: "POST", headers, body: JSON.stringify({ query: campaignQuery }), cache: "no-store" });
    if (campaignRes.ok) {
      const campaignDataRes = await campaignRes.json();
      campaigns = (campaignDataRes.results || []).map((row: any) => {
        const camp = row.campaign || {}; const m = row.metrics || {};
        return {
          id: camp.id || "", name: camp.name || "Unknown Campaign", status: camp.status || "UNKNOWN",
          cost: (Number(m.costMicros || 0) / 1000000).toFixed(2), clicks: Number(m.clicks || 0), conversions: Number(m.conversions || 0).toFixed(2)
        };
      });
    }

    return { 
      success: true, 
      data: {
        totalClicks: sumClicks.toLocaleString(), totalImpressions: sumImpressions.toLocaleString(),
        totalCost: finalCost.toFixed(2), totalConversions: sumConversions.toFixed(2),
        avgCpc, optimizationScore: optScoreStr, campaigns, chartData
      }
    };
  } catch (error: any) {
    return { success: true, error: "System error occurred.", data: defaultEmptyMetrics };
  }
}

// ============================================================================
// 🚀 3. FETCH GOOGLE MERCHANT CENTER ORGANIC REPORTS (REPORTS TAB)
// ============================================================================
export async function fetchGmcReportsData(): Promise<{ success: boolean; data?: GmcReportData; error?: string }> {
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

    const dailyQuery = `SELECT segments.date, metrics.clicks, metrics.impressions FROM MerchantPerformanceView WHERE segments.date DURING LAST_30_DAYS ORDER BY segments.date ASC`;
    const productQuery = `SELECT segments.offer_id, segments.title, metrics.clicks, metrics.impressions FROM MerchantPerformanceView WHERE segments.date DURING LAST_30_DAYS ORDER BY metrics.clicks DESC LIMIT 50`;

    const [dailyRes, productRes] = await Promise.all([
      shoppingContent.reports.search({ merchantId: config.gmcMerchantId, requestBody: { query: dailyQuery } }).catch(() => null),
      shoppingContent.reports.search({ merchantId: config.gmcMerchantId, requestBody: { query: productQuery } }).catch(() => null)
    ]);

    let totalClicks = 0; let totalImpressions = 0;
    const chartData: any[] = []; const productData: any[] = [];

    // Process Chart Data
    if (dailyRes?.data?.results) {
      dailyRes.data.results.forEach((row: any) => {
        const m = row.metrics || {}; const d = row.segments?.date || {};
        if (d.year && d.month && d.day) {
          const dateStr = `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
          const dateObj = new Date(dateStr);
          const clicks = Number(m.clicks || 0); const impressions = Number(m.impressions || 0);

          totalClicks += clicks; totalImpressions += impressions;
          chartData.push({ date: dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }), clicks, impressions });
        }
      });
    }

    // Process Product Table Data
    if (productRes?.data?.results) {
      productRes.data.results.forEach((row: any) => {
        const m = row.metrics || {}; const s = row.segments || {};
        productData.push({
          id: s.offerId || "Unknown ID", title: s.title || "Unknown Product",
          clicks: Number(m.clicks || 0), impressions: Number(m.impressions || 0)
        });
      });
    }

    return { success: true, data: { totalClicks, totalImpressions, chartData, productData } };

  } catch (error) {
    console.error("GMC Reports API Error:", error);
    return { success: true, data: defaultData };
  }
}