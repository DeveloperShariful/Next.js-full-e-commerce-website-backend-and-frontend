//app/(storefront)/affiliates/page.tsx

import { Suspense } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import AffiliateMainView from "./_components/affiliate-main-view";
import { serializePrismaData } from "@/lib/format-data"; 

import { 
  getProfile, 
  getStats, 
  getRecentActivity, 
  getPerformanceChart,
  getTierProgress, 
  getActiveRules   
} from "@/app/actions/storefront/affiliates/_services/dashboard-service";

import { getLinks, getCampaigns, getCreatives, getCoupons } from "@/app/actions/storefront/affiliates/_services/marketing-service";
import { getWalletData, getPayoutHistory, getLedger } from "@/app/actions/storefront/affiliates/_services/finance-service";
import { getSponsor, getNetworkTree, getNetworkStats } from "@/app/actions/storefront/affiliates/_services/network-service";
import { getSettings } from "@/app/actions/storefront/affiliates/_services/settings-service";

import { getAuthAffiliate } from "@/app/actions/storefront/affiliates/auth-helper";
import { db } from "@/lib/prisma";

export const metadata = {
  title: "Partner Dashboard | GoBike",
};

export default async function AffiliateStorefrontPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; page?: string; search?: string }>;
}) {
  const authSession = await getAuthAffiliate();
  const userId = authSession.userId; 

  const params = await searchParams;
  const currentView = params.view || "overview";
  
  const [profile, storeSettings] = await Promise.all([
    getProfile(userId),
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

  const affiliateConfig = (storeSettings?.affiliateConfig as any) || {};
  const appConfig = {
    paramName: affiliateConfig.referralParam || "ref", 
    baseUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    currency: storeSettings?.currencySymbol || "$",
  };

  const data: any = {
    profile,
    config: { ...affiliateConfig, ...appConfig }, 
  };

  try {
    switch (currentView) {
      case "overview":
        const [stats, recentActivity, chartData, tierProgress, activeRules] = await Promise.all([
          getStats(profile.id),
          getRecentActivity(profile.id),
          getPerformanceChart(profile.id),
          getTierProgress(profile.id),
          getActiveRules()
        ]);
        data.dashboard = { stats, recentActivity, chartData, tierProgress, activeRules };
        break;

      case "links":
        const [links, campaigns] = await Promise.all([
          getLinks(profile.id),
          getCampaigns(profile.id)
        ]);
        data.marketing = { 
            links, 
            campaigns, 
            defaultSlug: profile.slug,
            ...appConfig 
        };
        break;

      // ✅ NEW: Separate View for Coupons
      case "coupons":
        const coupons = await getCoupons(profile.id);
        data.marketing = { coupons }; // Reuse marketing object structure
        break;

      case "creatives":
        data.creatives = await getCreatives();
        break;

      case "network":
        const [sponsor, tree, netStats] = await Promise.all([
          getSponsor(profile.id),
          getNetworkTree(profile.id),
          getNetworkStats(profile.id)
        ]);
        data.network = { sponsor, tree, stats: netStats };
        break;

      case "payouts":
        const [wallet, payoutHistory] = await Promise.all([
          getWalletData(profile.id),
          getPayoutHistory(profile.id)
        ]);
        data.finance = { wallet, history: payoutHistory };
        break;

      case "ledger":
        data.ledger = await getLedger(profile.id, 50);
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
        data.settings = await getSettings(userId);
        break;
    }
  } catch (error) {
    console.error("Affiliate Data Fetch Error:", error);
    data.error = "Failed to load data. Please try refreshing.";
  }

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