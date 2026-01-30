// File: app/(admin)/admin/settings/affiliate/page.tsx

import { Suspense } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import AffiliateMainView from "./_components/affiliate-main-view";
import { db } from "@/lib/prisma";

import * as statsService from "@/app/actions/admin/settings/affiliates/_services/stats-service";
import * as accountService from "@/app/actions/admin/settings/affiliates/_services/account-service"; 
import * as payoutService from "@/app/actions/admin/settings/affiliates/_services/payout-service";
import * as configService from "@/app/actions/admin/settings/affiliates/_services/general-config-service";
import * as tierService from "@/app/actions/admin/settings/affiliates/_services/tier-service";
import * as creativeService from "@/app/actions/admin/settings/affiliates/_services/creative-service";
import * as ruleEngineService from "@/app/actions/admin/settings/affiliates/_services/commition-rule-service";
import * as contestService from "@/app/actions/admin/settings/affiliates/_services/contest-service";
import * as campaignService from "@/app/actions/admin/settings/affiliates/_services/campaign-service";
import * as announcementService from "@/app/actions/admin/settings/affiliates/_services/announcement-service";
import * as networkService from "@/app/actions/admin/settings/affiliates/_services/network-service";
import * as fraudService from "@/app/actions/admin/settings/affiliates/_services/fraud-service";
import * as domainService from "@/app/actions/admin/settings/affiliates/_services/domain-service";
import * as pixelService from "@/app/actions/admin/settings/affiliates/_services/pixel-service";
import * as productRateService from "@/app/actions/admin/settings/affiliates/_services/product-rate-service";
import * as kycService from "@/app/actions/admin/settings/affiliates/_services/kyc-service";
import * as ledgerService from "@/app/actions/admin/settings/affiliates/_services/ledger-service";
import * as analyticsService from "@/app/actions/admin/settings/affiliates/_services/analytics-service";
import * as groupService from "@/app/actions/admin/settings/affiliates/_services/group-service";
import * as tagService from "@/app/actions/admin/settings/affiliates/_services/tag-service";
import * as couponService from "@/app/actions/admin/settings/affiliates/_services/coupon-service";
import { serializePrismaData } from "@/lib/format-data"; 

export const metadata = {
  title: "Affiliate Program Management | Enterprise Admin",
  description: "Advanced control center for affiliate marketing, MLM, and commission management.",
};

export default async function AffiliateMasterPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; page?: string; search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const currentView = params.view || "overview";
  const page = Number(params.page) || 1;
  const search = params.search || "";

  // Data Container
  const data: any = {};

  try {
    // 1. Always fetch Configuration (Required for Context & Global Rules)
    data.config = await configService.getSettings();

    // 2. Efficient Data Fetching Switch
    switch (currentView) {
      case "overview":
        const [kpi, charts] = await Promise.all([
          statsService.getDashboardKPI(),
          statsService.getChartData(),
        ]);
        data.dashboard = { kpi, charts };
        break;

      case "reports":
        const [topProducts, trafficSources, topAffiliates, monthlyStats] = await Promise.all([
          analyticsService.getTopProducts(),
          analyticsService.getTrafficSources(),
          analyticsService.getTopAffiliates(),
          analyticsService.getMonthlyPerformance(),
        ]);
        data.reports = { topProducts, trafficSources, topAffiliates, monthlyStats };
        break;

      case "partners": // Merged View: Users + Groups + Tags
        const [usersData, groupsList, tagsList] = await Promise.all([
          accountService.getAffiliates(page, 20, params.status as any, search),
          groupService.getAllGroups(),
          tagService.getAllTags() 
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
        data.creatives = await creativeService.getAllCreatives();
        break;

      case "contests":
        data.contests = await contestService.getContests();
        break;

      case "campaigns":
        data.campaigns = await campaignService.getAllCampaigns(page, 20, search);
        break;

      case "announcements":
        data.announcements = await announcementService.getAllAnnouncements(page, 20);
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
        data.domains = await domainService.getAllDomains();
        break;

      case "pixels":
        data.pixels = await pixelService.getAllPixels();
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
        // Fetch MLM Config specifically for the settings page
        data.mlmConfig = await db.affiliateMLMConfig.findUnique({ where: { id: "mlm_config" } });
        break;
      case "tags":
        data.tags = await tagService.getAllTags();
        break;
      case "coupons":
        data.coupons = await couponService.getAllAffiliateCoupons(); 
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