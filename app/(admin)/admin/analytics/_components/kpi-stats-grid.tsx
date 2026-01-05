//app/(admin)/admin/analytics/_components/kpi-stats-grid.tsx

"use client";

import { FinancialSummary, KPIMetric } from "@/app/actions/admin/analytics/types";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  CreditCard, 
  PackageCheck 
} from "lucide-react";

interface KpiStatsGridProps {
  summary: FinancialSummary;
}

export function KpiStatsGrid({ summary }: KpiStatsGridProps) {
  const { formatPrice } = useGlobalStore();

  const metrics = [
    {
      label: "Total Revenue",
      metric: summary.totalRevenue,
      format: (val: number) => formatPrice(val),
      icon: DollarSign,
      color: "blue"
    },
    {
      label: "Net Sales",
      metric: summary.netSales,
      format: (val: number) => formatPrice(val),
      icon: CreditCard,
      color: "indigo"
    },
    {
      label: "Total Orders",
      metric: summary.totalOrders,
      format: (val: number) => val.toLocaleString(),
      icon: ShoppingBag,
      color: "purple"
    },
    {
      label: "Avg. Order Value",
      metric: summary.averageOrderValue,
      format: (val: number) => formatPrice(val),
      icon: PackageCheck,
      color: "emerald"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {metrics.map((item, idx) => (
        <KpiCard 
          key={idx}
          label={item.label}
          metric={item.metric}
          formatter={item.format}
          Icon={item.icon}
          colorTheme={item.color}
        />
      ))}
    </div>
  );
}

// --- Sub Component ---
interface KpiCardProps {
  label: string;
  metric: KPIMetric;
  formatter: (val: number) => string;
  Icon: any;
  colorTheme: string;
}

function KpiCard({ label, metric, formatter, Icon, colorTheme }: KpiCardProps) {
  const isPositive = metric.trend === "up";
  const isNeutral = metric.trend === "neutral";

  const bgColors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    purple: "bg-purple-50 text-purple-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-lg ${bgColors[colorTheme]} bg-opacity-50 group-hover:bg-opacity-100 transition-all`}>
          <Icon size={20} />
        </div>
        
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
          isNeutral ? "bg-slate-100 text-slate-500" :
          isPositive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
        }`}>
          {isNeutral ? <span>—</span> : isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{Math.abs(metric.percentageChange).toFixed(1)}%</span>
        </div>
      </div>

      <div>
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{formatter(metric.value)}</h3>
        <p className="text-xs text-slate-400 mt-2">vs. {formatter(metric.previousValue)} prev. period</p>
      </div>
    </div>
  );
}