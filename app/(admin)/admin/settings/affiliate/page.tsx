// File: app/(admin)/admin/settings/affiliate/page.tsx

import { statsService } from "@/app/actions/admin/settings/affiliates/_services/stats-service";
import MainOverview from "./_components/main-overview"; 
import { DateRange } from "@/app/actions/admin/settings/affiliates/types";
import { subDays } from "date-fns";

export const metadata = {
  title: "Affiliate Dashboard | Admin",
};

export default async function AffiliateDashboardPage({
  searchParams,
}: {
  // 🔥 FIX 1: Type must be Promise
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  // 🔥 FIX 2: Await the params before using them
  const params = await searchParams;

  const range: DateRange = {
    from: params.from ? new Date(params.from) : subDays(new Date(), 30),
    to: params.to ? new Date(params.to) : new Date(),
  };

  const [kpiData, chartData] = await Promise.all([
    statsService.getDashboardKPI(range),
    statsService.getChartData(range),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Affiliate Overview</h2>
          <p className="text-sm text-gray-500">
            Performance metrics, revenue stats, and activity logs.
          </p>
        </div>
      </div>
      
      <div className="h-px bg-gray-200" />
      <MainOverview kpi={kpiData} charts={chartData} />
    </div>
  );
}