//app/(storefront)/affiliates/_components/dashboard-overview.tsx

"use client";

import { 
  DollarSign, Wallet, MousePointer, Users, TrendingUp, Calendar, ExternalLink,
  ArrowUpRight, ArrowDownRight, type LucideIcon, CheckCircle2, Clock, Trophy, Target, Zap, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
// ✅ IMPORT GLOBAL STORE
import { useGlobalStore } from "@/app/providers/global-store-provider";

// =========================================================
// UI HELPERS
// =========================================================

const safeNumber = (val: any) => Number(val) || 0;

// =========================================================
// COMPONENT 1: STATS CARD
// =========================================================

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: "up" | "down" | "neutral";
  color?: "blue" | "green" | "purple" | "orange";
}

function StatsCard({ title, value, icon: Icon, description, trend, color = "blue" }: StatsCardProps) {
  
  const styles = {
    blue:   { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100", ring: "group-hover:ring-blue-100" },
    green:  { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", ring: "group-hover:ring-emerald-100" },
    purple: { bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-100", ring: "group-hover:ring-violet-100" },
    orange: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", ring: "group-hover:ring-amber-100" },
  };

  const theme = styles[color];

  return (
    <div className={cn(
      "group bg-white p-6 rounded-2xl border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1",
      theme.ring
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-3 rounded-xl", theme.bg, theme.text)}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className={cn(
            "flex items-center text-xs font-bold px-2 py-1 rounded-full",
            trend === "up" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          )}>
            {trend === "up" ? <ArrowUpRight className="w-3 h-3 mr-1"/> : <ArrowDownRight className="w-3 h-3 mr-1"/>}
            {/* Dynamic Trend can be added here if backend sends it */}
            12% 
          </span>
        )}
      </div>
      
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>
        {description && (
          <p className="text-xs text-gray-400 mt-2 font-medium">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

// =========================================================
// COMPONENT 2: PERFORMANCE CHART
// =========================================================

function PerformanceChart({ data }: { data: any[] }) {
  // ✅ DYNAMIC CURRENCY
  const { symbol, formatPrice } = useGlobalStore();
  const currency = symbol || "$";

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
        <TrendingUp className="w-8 h-8 mb-2 opacity-20" />
        <p>No performance data available yet.</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            dy={10}
            tickFormatter={(value) => value.slice(5)} 
          />
          
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickFormatter={(val) => `${currency}${val}`}
          />
          
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
            itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
            formatter={(value: any) => [formatPrice(Number(value)), 'Earnings']}
            labelStyle={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}
          />
          
          <Area 
            type="monotone" 
            dataKey="earnings" 
            stroke="#6366f1" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorEarnings)" 
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// =========================================================
// COMPONENT 3: RECENT ACTIVITY LIST ITEM
// =========================================================

function ActivityItem({ activity }: { activity: any }) {
  const { formatPrice } = useGlobalStore();
  
  const isPositive = activity.type === "COMMISSION" || activity.type === "BONUS";
  const amount = safeNumber(activity.amount);

  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-50 last:border-0 group hover:bg-gray-50/80 transition-colors px-3 -mx-3 rounded-lg cursor-default">
      <div className="relative shrink-0">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center border shadow-sm transition-transform group-hover:scale-105",
          isPositive 
            ? "bg-green-50 border-green-100 text-green-600" 
            : "bg-red-50 border-red-100 text-red-600"
        )}>
           {isPositive ? <DollarSign className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{activity.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-gray-500">{format(new Date(activity.date), "MMM d, h:mm a")}</p>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium uppercase">
            {activity.type.replace("_", " ")}
          </span>
        </div>
      </div>
      
      <div className="text-right">
        <span className={cn("block text-sm font-bold", isPositive ? "text-green-600" : "text-gray-900")}>
          {isPositive ? "+" : "-"}{formatPrice(amount)}
        </span>
        <div className="flex items-center justify-end gap-1 mt-1">
           {activity.status === "COMPLETED" ? (
             <CheckCircle2 className="w-3 h-3 text-green-500" /> 
           ) : (
             <Clock className="w-3 h-3 text-amber-500" />
           )}
           <span className={cn(
             "text-[10px] font-medium uppercase",
             activity.status === "COMPLETED" ? "text-green-600" : "text-amber-600"
           )}>
             {activity.status}
           </span>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// ✅ COMPONENT 4: TIER PROGRESS CARD (FIXED)
// =========================================================
function TierProgressCard({ data }: { data: any }) {
    const { formatPrice } = useGlobalStore();
    
    if (!data) return null;

    // ✅ Dynamic Rate Display (Currency or Percentage)
    const rateDisplay = data.nextTierType === "FIXED" 
        ? formatPrice(data.nextTierRate) 
        : `${data.nextTierRate}%`;

    return (
        <div className="bg-gradient-to-br from-gray-900 to-indigo-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-xs text-indigo-200 font-bold uppercase tracking-wider mb-1">Current Tier</p>
                        <h3 className="text-2xl font-bold flex items-center gap-2">
                            <Trophy className="w-6 h-6 text-yellow-400" /> 
                            {data.currentTierName}
                        </h3>
                    </div>
                    {!data.isMaxTier && (
                        <div className="text-right">
                            <p className="text-xs text-indigo-200 font-bold uppercase tracking-wider mb-1">Next Goal</p>
                            <h3 className="text-xl font-bold text-white/90">{data.nextTierName}</h3>
                        </div>
                    )}
                </div>

                {!data.isMaxTier ? (
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-medium text-indigo-100">
                            <span>Progress</span>
                            <span>{data.progress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden border border-white/10">
                            <div 
                                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full rounded-full transition-all duration-1000 ease-out" 
                                style={{ width: `${data.progress}%` }} 
                            />
                        </div>
                        <p className="text-xs text-indigo-200 mt-2 flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            Earn <span className="text-white font-bold">{formatPrice(data.amountNeeded)}</span> more to reach <span className="text-white font-bold">{rateDisplay} commission!</span>
                        </p>
                    </div>
                ) : (
                    <div className="p-4 bg-white/10 rounded-xl border border-white/20 text-center">
                        <Sparkles className="w-6 h-6 text-yellow-300 mx-auto mb-2" />
                        <p className="text-sm font-bold text-white">You are a Top Partner!</p>
                        <p className="text-xs text-indigo-200">Maximum commission rates applied.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// =========================================================
// ✅ COMPONENT 5: ACTIVE RULES (FIXED)
// =========================================================
function ActiveRulesList({ rules }: { rules: any[] }) {
    const { formatPrice } = useGlobalStore();
    
    if (!rules || rules.length === 0) return null;

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" /> Active Bonuses
            </h3>
            <div className="space-y-3">
                {rules.map((rule) => {
                    // ✅ Dynamic Bonus Display
                    const bonusDisplay = rule.type === "FIXED" 
                        ? formatPrice(rule.value) 
                        : `${rule.value}%`;

                    return (
                        <div key={rule.id} className="flex items-start gap-3 p-3 bg-yellow-50/50 rounded-xl border border-yellow-100">
                            <div className="mt-1 p-1.5 bg-yellow-100 rounded-lg text-yellow-700">
                                <Target className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900">{rule.name}</h4>
                                <p className="text-xs text-gray-600 mt-0.5">{rule.description}</p>
                                <span className="inline-block mt-2 text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-yellow-200 text-yellow-700">
                                    {bonusDisplay} Bonus
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// =========================================================
// MAIN COMPONENT: DASHBOARD OVERVIEW
// =========================================================

interface DashboardProps {
  data: {
    stats: any;
    recentActivity: any[];
    chartData: any[];
    tierProgress?: any; 
    activeRules?: any[];
  };
  userName: string;
}

export default function DashboardOverview({ data, userName }: DashboardProps) {
  const { stats, recentActivity, chartData, tierProgress, activeRules } = data;
  const { formatPrice } = useGlobalStore();

  const totalEarnings = safeNumber(stats.totalEarnings);
  const unpaidEarnings = safeNumber(stats.unpaidEarnings);
  const clicks = safeNumber(stats.clicks);
  const referrals = safeNumber(stats.referrals);
  const conversionRate = safeNumber(stats.conversionRate);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
      
      {/* 1. Top Section: Welcome & Tier Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Welcome Banner */}
          <div className="lg:col-span-2 relative overflow-hidden bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                  Hello, {userName.split(" ")[0]}! 👋
                </h1>
                <p className="text-gray-500 text-sm max-w-md leading-relaxed">
                  You have generated <span className="text-black font-bold">{formatPrice(totalEarnings)}</span> in lifetime revenue. 
                  Check out your new marketing assets!
                </p>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <Link href="/affiliates?view=payouts" className="px-5 py-2.5 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all text-xs flex items-center gap-2 shadow-lg active:scale-95">
                  <Wallet className="w-3.5 h-3.5" /> Withdraw Funds
                </Link>
                <Link href="/affiliates?view=links" className="px-5 py-2.5 bg-gray-100 text-gray-900 font-bold rounded-xl hover:bg-gray-200 transition-all text-xs flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5" /> Create Link
                </Link>
              </div>
            </div>
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                <TrendingUp className="w-64 h-64 -mr-10 -mb-10 text-indigo-600" />
            </div>
          </div>

          {/* Tier Progress */}
          <div className="lg:col-span-1">
             <TierProgressCard data={tierProgress} />
          </div>
      </div>

      {/* 2. KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Unpaid Balance" value={formatPrice(unpaidEarnings)} icon={Wallet} color="blue" trend="neutral" description="Available for payout" />
        <StatsCard title="Total Earnings" value={formatPrice(totalEarnings)} icon={DollarSign} color="green" trend="up" description="Lifetime income generated" />
        <StatsCard title="Total Clicks" value={clicks.toLocaleString()} icon={MousePointer} color="purple" trend="up" description="Unique link visits" />
        <StatsCard title="Conversions" value={referrals.toLocaleString()} icon={Users} color="orange" description={`${conversionRate.toFixed(1)}% Conversion Rate`} />
      </div>

      {/* 3. Main Content Split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Chart */}
        <div className="xl:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-gray-900 text-xl flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-indigo-600 bg-indigo-50 p-1 rounded-md" />
                Performance
              </h3>
              <p className="text-sm text-gray-500 mt-1">Earnings overview for the last 30 days</p>
            </div>
          </div>
          <div className="flex-1 w-full min-h-0">
            <PerformanceChart data={chartData} />
          </div>
        </div>

        {/* Right Column: Activity & Rules */}
        <div className="space-y-6">
            {/* Active Rules Widget */}
            {activeRules && activeRules.length > 0 && (
                <ActiveRulesList rules={activeRules} />
            )}

            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col h-auto min-h-[300px]">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-lg">Recent Activity</h3>
                <Link href="/affiliates?view=ledger" className="text-xs font-bold text-indigo-600 hover:underline">View All</Link>
              </div>
              <div className="flex-1 space-y-1">
                {recentActivity.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-10">
                    <Calendar className="w-10 h-10 mb-3 opacity-10" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                ) : (
                  recentActivity.map((activity, i) => <ActivityItem key={activity.id || i} activity={activity} />)
                )}
              </div>
            </div>
        </div>

      </div>
    </div>
  );
}