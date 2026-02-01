// File: app/(admin)/admin/settings/affiliate/page.tsx

import { Suspense } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import AffiliateMainView from "./_components/affiliate-main-view";
import { db } from "@/lib/prisma";

import * as statsService from "@/app/actions/admin/settings/affiliate/_services/dashboard-service";
import * as accountService from "@/app/actions/admin/settings/affiliate/_services/account-service"; 
import * as payoutService from "@/app/actions/admin/settings/affiliate/_services/payout-service";
import * as configService from "@/app/actions/admin/settings/affiliate/_services/general-config-service";
import * as tierService from "@/app/actions/admin/settings/affiliate/_services/tier-service";
import * as marketingService from "@/app/actions/admin/settings/affiliate/_services/marketing-assets-service";
import * as ruleEngineService from "@/app/actions/admin/settings/affiliate/_services/commition-rule-service";
import * as engagementService from "@/app/actions/admin/settings/affiliate/_services/engagement-service";
import * as networkService from "@/app/actions/admin/settings/affiliate/_services/mlm-network-service";
import * as fraudService from "@/app/actions/admin/settings/affiliate/_services/fraud-service";
import * as trackingService from "@/app/actions/admin/settings/affiliate/_services/pixel-domain-service";
import * as productRateService from "@/app/actions/admin/settings/affiliate/_services/product-rate-service";
import * as kycService from "@/app/actions/admin/settings/affiliate/_services/kyc-service";
import * as ledgerService from "@/app/actions/admin/settings/affiliate/_services/ledger-service";
import * as analyticsService from "@/app/actions/admin/settings/affiliate/_services/dashboard-service";
import * as groupService from "@/app/actions/admin/settings/affiliate/_services/group-service";
import * as couponTagService from "@/app/actions/admin/settings/affiliate/_services/coupon-tag-service";
import * as logService from "@/app/actions/admin/settings/affiliate/_services/log-service"; // ✅ Import Log Service
import { serializePrismaData } from "@/lib/format-data"; 

export const metadata = {
  title: "Affiliate Program Management | Enterprise Admin",
  description: "Advanced control center for affiliate marketing, MLM, and commission management.",
};

// ✅ TYPE DEFINITION UPDATED
export default async function AffiliateMasterPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    view?: string; 
    page?: string; 
    search?: string; 
    status?: string;
    logType?: string; // ✅ Added
    level?: string;   // ✅ Added
  }>;
}) {
  const params = await searchParams;
  const currentView = params.view || "overview";
  const page = Number(params.page) || 1;
  const search = params.search || "";
  const data: any = {};

  try {
    data.config = await configService.getSettings();

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
        const [usersData, groupsList, tagsList] = await Promise.all([
          accountService.getAffiliates(page, 20, params.status as any, search),
          groupService.getAllGroups(),
          couponTagService.getAllTags() 
        ]);
        
        data.partners = {
          users: usersData,
          groups: groupsList,
          tags: tagsList,
          defaultRate: data.config?.commissionRate ?? null ,
          defaultType: data.config?.commissionType ?? "PERCENTAGE"
        };
        break;

      case "payouts":
        data.payouts = await payoutService.getPayouts(page, 20, params.status as any);
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

      case "contests":
        data.contests = await engagementService.getContests();
        break;

      case "campaigns":
        data.campaigns = await engagementService.getAllCampaigns(page, 20, search);
        break;

      case "announcements":
        data.announcements = await marketingService.getAllAnnouncements(page, 20);
        break;

      case "network":
        data.network = await networkService.getMLMTree();
        break;

      case "fraud":
        data.fraud = {
          highRisk: await fraudService.getHighRiskAffiliates(),
          flagged: await fraudService.getFlaggedReferrals(),
          rules: await fraudService.getRules(),
        };
        break;

      case "domains":
        data.domains = await trackingService.getAllDomains();
        break;

      case "pixels":
        data.pixels = await trackingService.getAllPixels();
        break;

      case "product-rates":
        data.rates = await productRateService.getAllRates(page, 50, search);
        break;

      case "kyc":
        data.kyc = await kycService.getDocuments(page, 20, params.status);
        break;

      case "ledger":
        data.ledger = await ledgerService.getLedgerHistory(page, 20);
        break;
        
      case "general":
        data.mlmConfig = await db.affiliateMLMConfig.findUnique({ where: { id: "mlm_config" } });
        break;
        
      case "tags":
        data.tags = await couponTagService.getAllTags();
        break;
        
      case "coupons":
        data.coupons = await couponTagService.getAllAffiliateCoupons(); 
        break;

      case "logs": // ✅ Logs View Added
        const logType = params.logType || "AUDIT"; 
        const [auditLogs, systemLogs] = await Promise.all([
            logService.getAuditLogs(page, 20, search),
            logService.getSystemLogs(page, 20, params.level as string)
        ]);
        data.logs = { 
            audit: auditLogs, 
            system: systemLogs, 
            currentTab: logType 
        };
        break;
    }
  } catch (error: any) {
    console.error("Affiliate Dashboard Error:", error);
    data.error = error.message || "Failed to load module data. Please try again.";
  }

  return (
    <div className="bg-white min-h-[calc(100vh-64px)] w-full"> 
      <Suspense fallback={
        <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50/50">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
            <p className="text-sm font-medium text-gray-500 animate-pulse">Loading Affiliate Control Panel...</p>
        </div>
      }>
        {data.error ? (
          <div className="p-8 flex flex-col items-center justify-center h-[50vh] text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-gray-900">Module Error</h3>
            <p className="text-gray-500 max-w-md mt-2">{data.error}</p>
          </div>
        ) : (
          <AffiliateMainView initialData={serializePrismaData(data) } currentView={currentView} />
        )}
      </Suspense>
    </div>
  );
}