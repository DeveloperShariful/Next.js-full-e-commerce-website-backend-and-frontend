//app/(storefront)/affiliates/_components/stats-card.tsx

import { cn } from "@/lib/utils";
import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: "up" | "down" | "neutral"; // Optional trend indicator
  trendValue?: string;
  color?: "blue" | "green" | "purple" | "orange";
}

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend,
  trendValue,
  color = "blue" 
}: StatsCardProps) {
  
  const colorStyles = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>
        </div>
        <div className={cn("p-3 rounded-lg border", colorStyles[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      {(description || trend) && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          {trend && (
            <span className={cn(
              "flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded",
              trend === "up" ? "text-green-700 bg-green-50" : 
              trend === "down" ? "text-red-700 bg-red-50" : "text-gray-600 bg-gray-100"
            )}>
              {trend === "up" && <ArrowUpRight className="w-3 h-3" />}
              {trend === "down" && <ArrowDownRight className="w-3 h-3" />}
              {trend === "neutral" && <Minus className="w-3 h-3" />}
              {trendValue}
            </span>
          )}
          <span className="text-gray-500 truncate max-w-[150px]" title={description}>
            {description}
          </span>
        </div>
      )}
    </div>
  );
}