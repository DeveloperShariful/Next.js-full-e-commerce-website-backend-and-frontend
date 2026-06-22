// File: app/(backend)/admin/affiliate/page.tsx

import { Suspense } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import AffiliateMainView from "./_components/affiliate-main-view";
import { db } from "@/lib/prisma";
import * as statsService from "@/app/actions/backend/affiliate/_services/dashboard-service";
import * as accountService from "@/app/actions/backend/affiliate/_services/account-service"; 
import * as payoutService from "@/app/actions/backend/affiliate/_services/payout-service";
import * as configService from "@/app/actions/backend/affiliate/_services/general-config-service";
import * as tierService from "@/app/actions/backend/affiliate/_services/tier-service";
import * as marketingService from "@/app/actions/backend/affiliate/_services/marketing-assets-service";
import * as ruleEngineService from "@/app/actions/backend/affiliate/_services/commition-rule-service";
import * as engagementService from "@/app/actions/backend/affiliate/_services/engagement-service";
import * as fraudService from "@/app/actions/backend/affiliate/_services/fraud-service";
import * as productRateService from "@/app/actions/backend/affiliate/_services/product-rate-service";
import * as kycService from "@/app/actions/backend/affiliate/_services/kyc-service";
import * as ledgerService from "@/app/actions/backend/affiliate/_services/ledger-service";
import * as analyticsService from "@/app/actions/backend/affiliate/_services/dashboard-service";
import * as couponTagService from "@/app/actions/backend/affiliate/_services/coupon-tag-service";
import * as logService from "@/app/actions/backend/affiliate/_services/log-service"; 
import { serializePrismaData } from "@/lib/format-data"; 

export const metadata = {
  title: "Affiliate Program | WP Admin Style",
  description: "Advanced control center for affiliate marketing and commission management.",
};

export default async function AffiliateMasterPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    page?: string;
    search?: string;
    status?: string;
    logTab?: string;
    level?: string;
    action?: string;
    entity?: string;
    source?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const params = await searchParams;
  const currentView = params.view || "overview";
  const page = Number(params.page) || 1;
  const search = params.search || "";
  const data: any = {};

  try {
    data.config = await configService.getSettings();

    // Sidebar badge counts — always fetched regardless of current view
    const [pendingPayoutsCount, pendingKycCount, highRiskCount] = await Promise.all([
      db.affiliatePayout.count({ where: { status: "PENDING" } }),
      db.affiliateAccount.count({ where: { kycStatus: "PENDING" } }),
      db.affiliateAccount.count({ where: { riskScore: { gt: 50 } } }),
    ]);
    data.counts = { payouts: pendingPayoutsCount, kyc: pendingKycCount, fraud: highRiskCount };

    switch (currentView) {
      case "overview":
        const [
            kpi, 
            charts, 
            topProducts, 
            trafficSources, 
            topAffiliates, 
            monthlyStats
        ] = await Promise.all([
          statsService.getDashboardKPI(),
          statsService.getChartData(),
          analyticsService.getTopProducts(),
          analyticsService.getTrafficSources(),
          analyticsService.getTopAffiliates(),
          analyticsService.getMonthlyPerformance(),
        ]);
        data.dashboard = { 
            kpi, 
            charts, 
            topProducts, 
            trafficSources, 
            topAffiliates, 
            monthlyStats 
        };
        break;
      
      case "partners":
        const [usersData, tagsList] = await Promise.all([
          accountService.getAffiliates(page, 20, params.status as any, search),
          couponTagService.getAllTags()
        ]);

        data.partners = {
          users: usersData,
          tags: tagsList,
          defaultRate: data.config?.commissionRate ?? null,
          defaultType: data.config?.commissionType ?? "PERCENTAGE"
        };
        break;

      case "payouts":
        const [payoutsResult, ledgerResult] = await Promise.all([
          payoutService.getPayouts(page, 20, params.status as any),
          ledgerService.getLedgerHistory(page, 20),
        ]);
        data.payouts = { payouts: payoutsResult, ledger: ledgerResult };
        break;

      case "tiers":
        data.tiers = await tierService.getAllTiers();
        break;

      case "rules":
        data.rules = await ruleEngineService.getRules();
        break;

      case "creatives":
        data.creatives = await marketingService.getAllCreatives();
        break;

      case "campaigns":
        const [campaignsResult, contestsResult] = await Promise.all([
          engagementService.getAllCampaigns(page, 20, search),
          engagementService.getContests(),
        ]);
        data.campaigns = { campaigns: campaignsResult, contests: contestsResult };
        break;

      case "announcements":
        data.announcements = await marketingService.getAllAnnouncements(page, 20);
        break;

      case "fraud":
        const [highRisk, flagged, fraudRules, fraudStats, fraudAlerts] = await Promise.all([
          fraudService.getHighRiskAffiliates(),
          fraudService.getFlaggedReferrals(),
          fraudService.getRules(),
          fraudService.getFraudStats(),
          fraudService.getRecentFraudAlerts(20),
        ]);
        data.fraud = { highRisk, flagged, rules: fraudRules, stats: fraudStats, alerts: fraudAlerts };
        break;

      case "product-rates":
        data.rates = await productRateService.getAllRates(page, 50, search);
        break;

      case "kyc":
        data.kyc = await kycService.getDocuments(page, 20, params.status);
        break;

      case "general":
        break;
        
      case "coupons":
        const [couponsResult, tagsResult] = await Promise.all([
          couponTagService.getAllAffiliateCoupons(),
          couponTagService.getAllTags(),
        ]);
        data.coupons = { coupons: couponsResult, tags: tagsResult };
        break;

      case "logs":
        const logTab = params.logTab || "overview";
        const [logStats, auditResult, systemResult, auditFilterOpts, systemSources] = await Promise.all([
          logService.getLogStats(),
          logTab === "audit"
            ? logService.getAuditLogs({
                page,
                limit: 20,
                search,
                action: params.action,
                tableName: params.entity,
                dateFrom: params.dateFrom,
                dateTo: params.dateTo,
              })
            : Promise.resolve({ logs: [], total: 0, totalPages: 0 }),
          logTab === "system"
            ? logService.getSystemLogs({
                page,
                limit: 20,
                search,
                level: params.level,
                source: params.source,
                dateFrom: params.dateFrom,
                dateTo: params.dateTo,
              })
            : Promise.resolve({ logs: [], total: 0, totalPages: 0 }),
          logService.getAuditFilterOptions(),
          logService.getSystemLogSources(),
        ]);
        data.logs = {
          stats: logStats,
          audit: auditResult,
          system: systemResult,
          auditFilterOpts,
          systemSources,
          tab: logTab,
        };
        break;
    }
  } catch (error: any) {
    console.error("Affiliate Dashboard Error:", error);
    data.error = error.message || "Failed to load module data. Please try again.";
  }
  
  return (
    // WP Background Color
    <div className="bg-[#f0f0f1] w-full font-sans text-[13px]"> 
      <Suspense fallback={
        <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f0f0f1]">
            <Loader2 className="w-8 h-8 animate-spin text-[#2271b1] mb-4" />
            <p className="text-[13px] text-[#50575e]">Loading WordPress Engine...</p>
        </div>
      }>
        {data.error ? (
          <div className=" flex flex-col items-center justify-center h-[50vh] text-center">
            <AlertTriangle className="w-12 h-12 text-[#d63638] mb-4" />
            <h3 className="text-lg font-semibold text-[#1d2327]">Module Error</h3>
            <p className="text-[#50575e] max-w-md mt-2">{data.error}</p>
          </div>
        ) : (
          <AffiliateMainView
            initialData={serializePrismaData(data)}
            currentView={currentView}
            counts={data.counts}
          />
        )}
      </Suspense>
    </div>
  );
}