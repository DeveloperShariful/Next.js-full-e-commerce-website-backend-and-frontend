// File: app/(admin)/admin/settings/affiliate/page.tsx

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import AffiliateMainView from "./_components/affiliate-main-view";

// Services
import { statsService } from "@/app/actions/admin/settings/affiliates/_services/stats-service";
import { accountService } from "@/app/actions/admin/settings/affiliates/_services/account-service";
import { payoutService } from "@/app/actions/admin/settings/affiliates/_services/payout-service";
import { configService } from "@/app/actions/admin/settings/affiliates/_services/config-service";
import { tierService } from "@/app/actions/admin/settings/affiliates/_services/tier-service";
import { creativeService } from "@/app/actions/admin/settings/affiliates/_services/creative-service";
import { ruleEngineService } from "@/app/actions/admin/settings/affiliates/_services/rule-engine-service";
import { contestService } from "@/app/actions/admin/settings/affiliates/_services/contest-service";
import { campaignService } from "@/app/actions/admin/settings/affiliates/_services/campaign-service";
import { announcementService } from "@/app/actions/admin/settings/affiliates/_services/announcement-service";
import { networkService } from "@/app/actions/admin/settings/affiliates/_services/network-service";
import { fraudService } from "@/app/actions/admin/settings/affiliates/_services/fraud-service";
import { fraudRuleService } from "@/app/actions/admin/settings/affiliates/_services/fraud-rule-service";
import { domainService } from "@/app/actions/admin/settings/affiliates/_services/domain-service";
import { pixelService } from "@/app/actions/admin/settings/affiliates/_services/pixel-service";
import { productRateService } from "@/app/actions/admin/settings/affiliates/_services/product-rate-service";
import { kycService } from "@/app/actions/admin/settings/affiliates/_services/kyc-service";
import { ledgerService } from "@/app/actions/admin/settings/affiliates/_services/ledger-service";
import { analyticsService } from "@/app/actions/admin/settings/affiliates/_services/analytics-service";
import { db } from "@/lib/prisma";

export const metadata = {
  title: "Affiliate Program Management",
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
  
  // 1. Always fetch Config (Needed for Context/Sidebar)
  data.config = await configService.getSettings();

  // 2. Conditional Fetching
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

    case "users":
      data.users = await accountService.getAffiliates(page, 20, params.status as any, search);
      data.groups = await db.affiliateGroup.findMany({ select: { id: true, name: true } });
      data.tags = await db.affiliateTag.findMany({ select: { id: true, name: true } });
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
        rules: await fraudRuleService.getRules(),
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

    case "groups":
      data.groupsList = await db.affiliateGroup.findMany({
        include: { _count: { select: { affiliates: true } } }
      });
      break;
      
    // 🔥 UPDATE: 'general' (Settings) ভিউতে এখন MLM ডাটাও যাবে
    case "general":
      data.mlmConfig = await db.affiliateMLMConfig.findUnique({ where: { id: "mlm_config" } });
      break;
  }

  return (
    <div className="bg-white min-h-[calc(100vh-64px)] w-full"> 
      <Suspense fallback={<div className="h-96 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>}>
        <AffiliateMainView initialData={data} currentView={currentView} />
      </Suspense>
    </div>
  );
}