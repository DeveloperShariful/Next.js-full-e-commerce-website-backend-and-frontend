import { Loader2 } from "lucide-react";

export default function AnalyticsLoading() {
  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Header Skeleton */}
      <div className="flex justify-between items-end pb-2">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-slate-200 rounded animate-pulse" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-32 flex flex-col justify-between animate-pulse">
            <div className="flex justify-between">
              <div className="h-10 w-10 bg-slate-100 rounded-lg" />
              <div className="h-6 w-16 bg-slate-100 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-slate-100 rounded" />
              <div className="h-8 w-32 bg-slate-200 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Skeleton (Left) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[400px] animate-pulse">
            <div className="h-6 w-48 bg-slate-100 rounded mb-6" />
            <div className="h-full bg-slate-50 rounded-lg" />
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[400px] animate-pulse" />
        </div>

        {/* Right Widgets Skeleton */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[350px] animate-pulse" />
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[400px] animate-pulse" />
        </div>
      </div>
    </div>
  );
}