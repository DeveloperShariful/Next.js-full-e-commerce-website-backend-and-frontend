//app/(storefront)/affiliates/page.tsx

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import AffiliateMainView from "./_components/affiliate-main-view";

// Services
import { dashboardService } from "@/app/actions/storefront/affiliates/_services/dashboard-service";
import { marketingService } from "@/app/actions/storefront/affiliates/_services/marketing-service";
import { financeService } from "@/app/actions/storefront/affiliates/_services/finance-service";
import { networkService } from "@/app/actions/storefront/affiliates/_services/network-service";
import { settingsService } from "@/app/actions/storefront/affiliates/_services/settings-service";
import { requireUser } from "@/app/actions/storefront/affiliates/auth-helper";
import { db } from "@/lib/prisma";

export const metadata = {
  title: "Partner Dashboard | GoBike",
};

export default async function AffiliateStorefrontPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; page?: string; search?: string }>;
}) {
  const userId = await requireUser();
  const params = await searchParams;
  const currentView = params.view || "overview";
  
  // 1. Fetch Profile & Global Settings (Always Required)
  const [profile, storeSettings] = await Promise.all([
    dashboardService.getProfile(userId),
    db.storeSettings.findUnique({ where: { id: "settings" } })
  ]);

  if (!profile) return <div>Access Denied or Account Pending</div>;

  const data: any = {
    profile,
    currency: storeSettings?.currencySymbol || "$",
    config: storeSettings?.affiliateConfig || {},
  };

  // 2. Conditional Data Fetching based on View
  switch (currentView) {
    case "overview":
      const [stats, recentActivity, chartData] = await Promise.all([
        dashboardService.getStats(profile.id),
        dashboardService.getRecentActivity(profile.id),
        dashboardService.getPerformanceChart(profile.id)
      ]);
      data.dashboard = { stats, recentActivity, chartData };
      break;

    case "links":
      const [links, campaigns] = await Promise.all([
        marketingService.getLinks(profile.id),
        marketingService.getCampaigns(profile.id)
      ]);
      data.marketing = { links, campaigns };
      break;

    case "creatives":
      data.creatives = await marketingService.getCreatives();
      break;

    case "network":
      const [sponsor, tree, netStats] = await Promise.all([
        networkService.getSponsor(profile.id),
        networkService.getNetworkTree(profile.id),
        networkService.getNetworkStats(profile.id)
      ]);
      data.network = { sponsor, tree, stats: netStats };
      break;

    case "payouts":
      const [wallet, payoutHistory] = await Promise.all([
        financeService.getWalletData(profile.id),
        financeService.getPayoutHistory(profile.id)
      ]);
      data.finance = { wallet, history: payoutHistory };
      break;

    case "ledger":
      data.ledger = await financeService.getLedger(profile.id, 50);
      break;

    case "reports":
      // Reusing dashboard logic or separate report query if needed
      data.reports = {
        conversions: await db.referral.findMany({
            where: { affiliateId: profile.id },
            include: { order: { select: { orderNumber: true, total: true } } },
            orderBy: { createdAt: "desc" },
            take: 100
        })
      };
      break;

    case "settings":
      data.settings = await settingsService.getSettings(userId);
      break;
  }

  return (
    <div className="w-full min-h-screen bg-gray-50/30">
      <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-black" /></div>}>
        <AffiliateMainView initialData={data} currentView={currentView} />
      </Suspense>
    </div>
  );
}