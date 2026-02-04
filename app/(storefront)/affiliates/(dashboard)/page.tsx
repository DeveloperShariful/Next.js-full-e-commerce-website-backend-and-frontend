//app/(storefront)/affiliates/page.tsx

import { Suspense } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import AffiliateMainView from "./_components/affiliate-main-view";
import { serializePrismaData } from "@/lib/format-data"; 
import { db } from "@/lib/prisma";
import { getAuthAffiliate } from "@/app/actions/storefront/affiliates/auth-helper";
import { 
  getStats, 
  getRecentActivity, 
  getPerformanceChart, 
  getTierProgress, 
  getActiveRules, 
  getActiveContests // ✅ Already imported
} from "@/app/actions/storefront/affiliates/_services/dashboard-service";
import { getLinks, getCampaigns, getCreatives, getCoupons } from "@/app/actions/storefront/affiliates/_services/marketing-service";
import { getWalletData, getPayoutHistory, getLedger } from "@/app/actions/storefront/affiliates/_services/finance-service";
import { getSponsor, getNetworkTree, getNetworkStats } from "@/app/actions/storefront/affiliates/_services/network-service";
import { getSettings } from "@/app/actions/storefront/affiliates/_services/settings-service";

export const metadata = {
  title: "Partner Dashboard | GoBike",
};

export default async function AffiliateStorefrontPage() {
  const profile = await getAuthAffiliate(); 

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
      </div>
    );
  }

  // 1. Fetch ALL Data in Parallel
  const [
    storeSettings,
    // Dashboard Data
    stats, recentActivity, chartData, tierProgress, activeRules, activeContests, // ✅ Added activeContests variable
    // Marketing Data
    links, campaigns, creatives, coupons, 
    // Finance Data
    wallet, payoutHistory, ledger,
    // Network Data
    sponsor, tree, netStats, 
    // Settings
    settings, 
    // Reports
    conversions 
  ] = await Promise.all([ 
    db.storeSettings.findUnique({ where: { id: "settings" } }),
    
    // Dashboard Data Calls
    getStats(profile.id),
    getRecentActivity(profile.id),
    getPerformanceChart(profile.id),
    getTierProgress(profile.id),
    getActiveRules(),
    getActiveContests(), // ✅ Added Function Call

    // Marketing Data Calls
    getLinks(profile.id),
    getCampaigns(profile.id),
    getCreatives(),
    getCoupons(profile.id),

    // Finance Data Calls
    getWalletData(profile.id),
    getPayoutHistory(profile.id),
    getLedger(profile.id, 50),

    // Network Data Calls
    getSponsor(profile.id),
    getNetworkTree(profile.id),
    getNetworkStats(profile.id),

    // Settings Call
    getSettings(profile.userId),

    // Reports Call
    db.referral.findMany({
        where: { affiliateId: profile.id },
        include: { order: { select: { orderNumber: true, total: true } } },
        orderBy: { createdAt: "desc" },
        take: 20 
    })
  ]);

  // 2. Prepare Config
  const affiliateConfig = (storeSettings?.affiliateConfig as any) || {};
  const appConfig = {
    paramName: affiliateConfig.referralParam || "ref", 
    baseUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    currency: storeSettings?.currencySymbol || "$",
  };

  // 3. Construct the COMPLETE Data Object
  const fullData = {
    profile,
    config: { ...affiliateConfig, ...appConfig },
    dashboard: { 
        stats, 
        recentActivity, 
        chartData, 
        tierProgress, 
        activeRules, 
        activeContests // ✅ Added to dashboard object
    },
    marketing: { links, campaigns, creatives, coupons, defaultSlug: profile.slug, ...appConfig },
    creatives, 
    finance: { wallet, history: payoutHistory },
    ledger,
    network: { sponsor, tree, stats: netStats },
    reports: { conversions },
    settings
  };

  // 4. Serialize to prevent Decimal errors
  const serializedData = serializePrismaData(fullData);

  return (
    <div className="w-full min-h-screen bg-gray-50/30">
      <Suspense fallback={
        <div className="h-screen w-full flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
            <p className="text-sm text-gray-500 font-medium">Loading Dashboard...</p>
        </div>
      }>
        <AffiliateMainView initialData={serializedData} />
      </Suspense>
    </div>
  );
}