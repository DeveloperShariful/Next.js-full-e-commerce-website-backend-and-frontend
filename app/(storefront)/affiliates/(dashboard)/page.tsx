//app/(storefront)/affiliates/page.tsx

import { dashboardService } from "@/app/actions/storefront/affiliates/_services/dashboard-service";
import StatsCard from "./_components/stats-card";
import PerformanceChart from "./_components/performance-chart";
import { requireUser } from "@/app/actions/storefront/affiliates/auth-helper";
import { 
  MousePointer, 
  Users, 
  DollarSign, 
  Wallet, 
  TrendingUp, 
  ExternalLink 
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { db } from "@/lib/prisma";

export const metadata = {
  title: "Dashboard | Partner Program",
};

export default async function AffiliateDashboard() {
  
  const userId = await requireUser();
  const profile = await dashboardService.getProfile(userId);
  
  if (!profile) return null; 

  // 1. Parallel Data Fetching
  const [stats, recentActivity, chartData, settings] = await Promise.all([
    dashboardService.getStats(profile.id),
    dashboardService.getRecentActivity(profile.id),
    dashboardService.getPerformanceChart(profile.id),
    db.storeSettings.findUnique({ where: { id: "settings" } })
  ]);

  // 2. Dynamic Currency from DB (Fallback to $)
  const currencySymbol = settings?.currencySymbol || "$";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {profile.name.split(" ")[0]}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here's what's happening with your partner account today.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            href="/affiliates/marketing/links"
            className="inline-flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm"
          >
            <ExternalLink className="w-4 h-4" />
            Get Links
          </Link>
        </div>
      </div>

      {/* KPI Grid (Currency Dynamic) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Earnings"
          value={`${currencySymbol}${stats.totalEarnings.toFixed(2)}`}
          icon={DollarSign}
          color="green"
          description="Lifetime commission"
        />
        <StatsCard 
          title="Unpaid Balance"
          value={`${currencySymbol}${stats.unpaidEarnings.toFixed(2)}`}
          icon={Wallet}
          color="blue"
          description="Available for payout"
        />
        <StatsCard 
          title="Total Clicks"
          value={stats.clicks.toLocaleString()}
          icon={MousePointer}
          color="purple"
          description="Unique visits"
        />
        <StatsCard 
          title="Referrals"
          value={stats.referrals.toLocaleString()}
          icon={Users}
          color="orange"
          description={`${stats.conversionRate.toFixed(1)}% Conversion rate`}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chart Area (Fixed) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-400" />
              Performance (Last 30 Days)
            </h3>
          </div>
          
          <div className="flex-1 w-full min-h-[300px]">
            <PerformanceChart data={chartData} currencySymbol={currencySymbol} />
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <h3 className="font-semibold text-gray-900 mb-6">Recent Activity</h3>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 max-h-[350px]">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-10">No recent activity.</p>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-4">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-green-50 border border-green-100 flex items-center justify-center z-10 relative">
                      <DollarSign className="w-4 h-4 text-green-600" />
                    </div>
                    {/* Connector Line */}
                    <div className="absolute top-8 left-4 w-px h-full bg-gray-100 -ml-px last:hidden" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {format(new Date(activity.date), "MMM d, h:mm a")}
                      </span>
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 rounded">
                        +{currencySymbol}{activity.amount?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Fixed Link */}
          <div className="mt-6 pt-4 border-t">
            <Link 
              href="/affiliates/reports" 
              className="text-sm text-black font-medium hover:underline flex items-center gap-1"
            >
              View all transactions &rarr;
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}