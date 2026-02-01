//app/(storefront)/affiliates/page.tsx

import { Suspense } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import AffiliateMainView from "./_components/affiliate-main-view";
import { serializePrismaData } from "@/lib/format-data"; // ✅ Serialization Utility Added

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

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
        <p className="text-gray-500 mt-2">Your affiliate account is pending approval or does not exist.</p>
      </div>
    );
  }

  // ✅ Prepare Configuration (Dynamic Param & Base URL)
  const affiliateConfig = (storeSettings?.affiliateConfig as any) || {};
  const appConfig = {
    paramName: affiliateConfig.referralParam || "ref", // Dynamic Parameter
    baseUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    currency: storeSettings?.currencySymbol || "$",
  };

  const data: any = {
    profile,
    config: { ...affiliateConfig, ...appConfig }, // Merged Config
  };

  // 2. Conditional Data Fetching based on View
  try {
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
        // Pass essential data for LinkManager
        data.marketing = { 
            links, 
            campaigns, 
            defaultSlug: profile.slug,
            ...appConfig // Pass baseUrl & paramName
        };
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
  } catch (error) {
    console.error("Affiliate Data Fetch Error:", error);
    // You can handle error state or pass error to client view
    data.error = "Failed to load data. Please try refreshing.";
  }

  // ✅ Serialize Data before passing to Client Component
  const serializedData = serializePrismaData(data);

  return (
    <div className="w-full min-h-screen bg-gray-50/30">
      <Suspense fallback={
        <div className="h-screen w-full flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
            <p className="text-sm text-gray-500 font-medium">Loading Dashboard...</p>
        </div>
      }>
        <AffiliateMainView initialData={serializedData} currentView={currentView} />
      </Suspense>
    </div>
  );
}