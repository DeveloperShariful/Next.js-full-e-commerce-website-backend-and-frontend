// Location: app/(backend)/admin/analytics/page.tsx

import React from "react";
import { getOverviewData } from "@/app/actions/backend/analytics/overview.actions";
import { getLeaderboardsData } from "@/app/actions/backend/analytics/leaderboards.actions";
import { parseDateRange } from "@/app/actions/backend/analytics/shared.utils";
import { formatTz } from "@/lib/store-time";
import { getStoreTimezone } from "@/lib/get-store-timezone";

import SummaryCards from "./_components/summary-cards";
import AnalyticsChart from "./_components/analytics-chart";
import DateRangePicker from "./_components/date-range-picker";
import OverviewLeaderboards from "./_components/overview-leaderboards";

type SearchParams = Promise<{ period?: string; compare?: string; from?: string; to?: string }>;

interface PageProps {
  searchParams: SearchParams;
}

export default async function AnalyticsOverviewPage(props: PageProps) {
  const searchParams = await props.searchParams;

  const period = searchParams.period || "month_to_date"; 
  const compareParam = searchParams.compare;
  const compare = compareParam !== undefined ? compareParam : "previous_year"; 
  
  const customFrom = searchParams.from;
  const customTo = searchParams.to;
  
  const dates = parseDateRange(period, compare, customFrom, customTo);
  const isComparing = compare !== "none";

  const [overviewData, leaderboardsData, timezone] = await Promise.all([
    getOverviewData(dates.current, dates.previous),
    getLeaderboardsData(dates.current),
    getStoreTimezone(),
  ]);

  // Formatting dates for the Chart Legend
  const currentDateLabel = dates.current.from.getTime() === dates.current.to.getTime()
      ? formatTz(dates.current.from, timezone, "MMM d, yyyy")
      : `${formatTz(dates.current.from, timezone, "MMM d")} - ${formatTz(dates.current.to, timezone, "d, yyyy")}`;

  const previousDateLabel = dates.previous.from.getTime() === dates.previous.to.getTime()
      ? formatTz(dates.previous.from, timezone, "MMM d, yyyy")
      : `${formatTz(dates.previous.from, timezone, "MMM d")} - ${formatTz(dates.previous.to, timezone, "d, yyyy")}`;

  return (
    <div className="w-full">
      <div className="bg-white border border-[#c3c4c7] shadow-sm p-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 rounded-sm">
        <div className="w-full sm:w-auto">
          <h2 className="text-[13px] font-semibold text-[#50575e] mb-2 uppercase tracking-wide">Date range:</h2>
          <DateRangePicker />
        </div>
      </div>

      <SummaryCards 
        current={overviewData.currentSummary} 
        previous={overviewData.previousSummary} 
        isComparing={isComparing} 
      />

      <h2 className="text-[18px] text-[#1d2327] mb-4 font-normal mt-8">sessions</h2>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Total Sales Chart */}
        <div className="border border-[#c3c4c7] shadow-sm rounded-sm overflow-hidden bg-white flex flex-col">
          <div className="flex-1">
            <AnalyticsChart 
              currentPeriod={overviewData.currentPeriod} 
              previousPeriod={overviewData.previousPeriod} 
              metricKey="grossSales" // Total Sales
              isCurrency={true} 
              isComparing={isComparing}
              // 🔥 NEW: Required props for custom chart header
              metricLabel="Total sales"
              currentTotal={overviewData.currentSummary.totalSales}
              previousTotal={overviewData.previousSummary.totalSales}
              currentDateLabel={currentDateLabel}
              previousDateLabel={previousDateLabel}
            />
          </div>
        </div>

        {/* Net Sales Chart */}
        <div className="border border-[#c3c4c7] shadow-sm rounded-sm overflow-hidden bg-white flex flex-col">
          <div className="flex-1">
            <AnalyticsChart 
              currentPeriod={overviewData.currentPeriod} 
              previousPeriod={overviewData.previousPeriod} 
              metricKey="netSales" 
              isCurrency={true} 
              isComparing={isComparing}
              // 🔥 NEW: Required props for custom chart header
              metricLabel="Net sales"
              currentTotal={overviewData.currentSummary.netSales}
              previousTotal={overviewData.previousSummary.netSales}
              currentDateLabel={currentDateLabel}
              previousDateLabel={previousDateLabel}
            />
          </div>
        </div>

      </div>

      <OverviewLeaderboards data={leaderboardsData} />
    </div>
  );
}
