//app/(storefront)/affiliates/_components/dashboard-overview.tsx

"use client";

import { DollarSign, Wallet, MousePointer, Users, TrendingUp, Calendar, ExternalLink } from "lucide-react";
import StatsCard from "./stats-card"; // ✅ Used Here
import PerformanceChart from "./performance-chart"; // ✅ Used Here
import { format } from "date-fns";
import Link from "next/link";

interface Props {
  data: {
    stats: any;
    recentActivity: any[];
    chartData: any[];
  };
  currency: string;
  userName: string;
}

export default function DashboardOverview({ data, currency, userName }: Props) {
  const { stats, recentActivity, chartData } = data;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Hello, {userName.split(" ")[0]}! 👋
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            You have earned <span className="font-bold text-green-600">{currency}{stats.totalEarnings.toFixed(2)}</span> lifetime commissions.
          </p>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/affiliates?view=payouts"
            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-sm flex items-center gap-2"
          >
            <Wallet className="w-4 h-4" /> Withdraw
          </Link>
          <Link 
            href="/affiliates?view=links" 
            className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 text-sm flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" /> Create Link
          </Link>
        </div>
      </div>

      {/* ✅ KPI Stats using StatsCard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard 
          title="Unpaid Balance"
          value={`${currency}${stats.unpaidEarnings.toFixed(2)}`}
          icon={Wallet}
          color="blue"
          trend="neutral"
          description="Ready to payout"
        />
        <StatsCard 
          title="Total Earnings"
          value={`${currency}${stats.totalEarnings.toFixed(2)}`}
          icon={DollarSign}
          color="green"
          trend="up"
          description="Lifetime income"
        />
        <StatsCard 
          title="Total Clicks"
          value={stats.clicks.toLocaleString()}
          icon={MousePointer}
          color="purple"
          trend="up"
          description="Unique visitors"
        />
        <StatsCard 
          title="Conversions"
          value={stats.referrals.toLocaleString()}
          icon={Users}
          color="orange"
          description={`${stats.conversionRate.toFixed(1)}% Conversion Rate`}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Chart */}
        <div className="xl:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[450px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Performance Overview
              </h3>
              <p className="text-xs text-gray-500 mt-1">Daily earnings for the last 30 days</p>
            </div>
          </div>
          <div className="flex-1 w-full min-h-0">
            {/* ✅ Chart Component */}
            <PerformanceChart data={chartData} currencySymbol={currency} />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[450px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 text-lg">Recent Activity</h3>
            <Link href="/affiliates?view=ledger" className="text-xs font-medium text-indigo-600 hover:underline">View All</Link>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-0 custom-scrollbar">
            {recentActivity.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                <Calendar className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm">No activity yet</p>
              </div>
            ) : (
              recentActivity.map((activity, i) => (
                <div key={activity.id} className="flex gap-4 py-4 border-b border-gray-50 last:border-0 group hover:bg-gray-50/50 transition-colors px-2 -mx-2 rounded-lg">
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-green-600 shadow-sm group-hover:scale-110 transition-transform">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{format(new Date(activity.date), "MMM d, yyyy • h:mm a")}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm font-bold text-green-600">
                      +{currency}{activity.amount?.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">{activity.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}