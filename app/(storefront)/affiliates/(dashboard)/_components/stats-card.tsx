//app/(storefront)/affiliates/_components/stats-card.tsx

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: "up" | "down" | "neutral";
  color?: "blue" | "green" | "purple" | "orange";
}

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
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
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>
        </div>
        <div className={cn("p-3 rounded-lg border", colorStyles[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {description && (
        <div className="mt-4 flex items-center text-xs text-gray-500">
          {description}
        </div>
      )}
    </div>
  );
}