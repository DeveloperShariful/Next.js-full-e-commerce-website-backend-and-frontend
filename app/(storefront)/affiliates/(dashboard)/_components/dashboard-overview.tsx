//app/(storefront)/affiliates/_components/dashboard-overview.tsx

"use client";

import { 
  DollarSign, Wallet, MousePointer, Users, TrendingUp, Calendar, ExternalLink,
  ArrowUpRight, ArrowDownRight, type LucideIcon, CheckCircle2, Clock
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
            {trend === "up" ? "+12%" : "-2%"} 
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
  // ✅ GLOBAL STORE USAGE
  const { symbol } = useGlobalStore();
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
            formatter={(value: any) => [`${currency}${Number(value).toFixed(2)}`, 'Earnings']}
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
  // ✅ GLOBAL STORE USAGE
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
// MAIN COMPONENT: DASHBOARD OVERVIEW
// =========================================================

interface DashboardProps {
  data: {
    stats: any;
    recentActivity: any[];
    chartData: any[];
  };
  userName: string;
}

export default function DashboardOverview({ data, userName }: DashboardProps) {
  const { stats, recentActivity, chartData } = data;

  // ✅ GLOBAL STORE USAGE
  const { formatPrice, symbol } = useGlobalStore();
  const currency = symbol || "$";

  // Safe Stats Access
  const totalEarnings = safeNumber(stats.totalEarnings);
  const unpaidEarnings = safeNumber(stats.unpaidEarnings);
  const clicks = safeNumber(stats.clicks);
  const referrals = safeNumber(stats.referrals);
  const conversionRate = safeNumber(stats.conversionRate);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
      
      {/* 1. Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-indigo-950 to-indigo-900 p-8 rounded-3xl shadow-xl text-white">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {userName.split(" ")[0]}! 👋
            </h1>
            <p className="text-indigo-200 text-sm max-w-lg leading-relaxed">
              You've earned <span className="text-white font-bold text-lg mx-1">{formatPrice(totalEarnings)}</span> in lifetime commissions. 
              Keep pushing your campaigns to reach the next tier!
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link 
              href="/affiliates?view=payouts"
              className="px-5 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-medium rounded-xl hover:bg-white/20 transition-all text-sm flex items-center gap-2 shadow-sm"
            >
              <Wallet className="w-4 h-4" /> 
              <span>Withdraw Funds</span>
            </Link>
            <Link 
              href="/affiliates?view=links" 
              className="px-5 py-3 bg-white text-indigo-900 font-bold rounded-xl hover:bg-indigo-50 transition-all shadow-lg active:scale-95 text-sm flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" /> 
              <span>Create Link</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Unpaid Balance"
          value={formatPrice(unpaidEarnings)}
          icon={Wallet}
          color="blue"
          trend="neutral"
          description="Available for payout"
        />
        <StatsCard 
          title="Total Earnings"
          value={formatPrice(totalEarnings)}
          icon={DollarSign}
          color="green"
          trend="up"
          description="Lifetime income generated"
        />
        <StatsCard 
          title="Total Clicks"
          value={clicks.toLocaleString()}
          icon={MousePointer}
          color="purple"
          trend="up"
          description="Unique link visits"
        />
        <StatsCard 
          title="Conversions"
          value={referrals.toLocaleString()}
          icon={Users}
          color="orange"
          description={`${conversionRate.toFixed(1)}% Conversion Rate`}
        />
      </div>

      {/* 3. Main Content Split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Chart Section (2/3 Width) */}
        <div className="xl:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-gray-900 text-xl flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-indigo-600 bg-indigo-50 p-1 rounded-md" />
                Performance
              </h3>
              <p className="text-sm text-gray-500 mt-1">Earnings overview for the last 30 days</p>
            </div>
            <select className="text-xs border-gray-300 border rounded-lg px-2 py-1 bg-gray-50 text-gray-600 focus:ring-indigo-500 focus:border-indigo-500">
                <option>Last 30 Days</option>
            </select>
          </div>
          <div className="flex-1 w-full min-h-0">
            <PerformanceChart data={chartData} />
          </div>
        </div>

        {/* Recent Activity Section (1/3 Width) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-lg">Recent Activity</h3>
            <Link href="/affiliates?view=ledger" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline">
              View All
            </Link>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-1">
            {recentActivity.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                <Calendar className="w-12 h-12 mb-3 opacity-10" />
                <p className="text-sm font-medium">No recent activity</p>
                <p className="text-xs mt-1">Start promoting to see data here!</p>
              </div>
            ) : (
              recentActivity.map((activity, i) => (
                <ActivityItem key={activity.id || i} activity={activity} />
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}