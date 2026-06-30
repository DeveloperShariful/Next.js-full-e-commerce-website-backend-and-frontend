//File Location: app/(backend)/admin/analytics/coupons/page.tsx

import React from "react";
import { parseDateRange } from "@/app/actions/backend/analytics/shared.utils";
import { getCouponsAnalyticsData } from "@/app/actions/backend/analytics/coupons.actions";
import { calculatePercentageChange, formatCurrency, formatNumber } from "@/app/actions/backend/analytics/shared.utils";
import { formatTz } from "@/lib/store-time";
import { getStoreTimezone } from "@/lib/get-store-timezone";

// Components
import DateRangePicker from "../_components/date-range-picker";
import AnalyticsChart from "../_components/analytics-chart";
import CouponsTable from "../_components/coupons-table";

type SearchParams = Promise<{ period?: string; compare?: string; from?: string; to?: string }>;

interface CouponsPageProps {
  searchParams: SearchParams;
}

export default async function CouponsAnalyticsPage(props: CouponsPageProps) {
  const searchParams = await props.searchParams;

  const period = searchParams.period || "month_to_date"; 
  const compareParam = searchParams.compare;
  const compare = compareParam !== undefined ? compareParam : "previous_year"; 
  
  const customFrom = searchParams.from;
  const customTo = searchParams.to;
  
  const dates = parseDateRange(period, compare, customFrom, customTo);
  const isComparing = compare !== "none";

  // Fetch data specifically for Coupons Tab
  const [data, timezone] = await Promise.all([
    getCouponsAnalyticsData(dates.current, dates.previous),
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
      
      {/* Header & Date Range Selection Area */}
      <div className="bg-white border border-[#c3c4c7] shadow-sm p-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 rounded-sm">
        <div className="w-full sm:w-auto">
          <h2 className="text-[13px] font-semibold text-[#50575e] mb-2 uppercase tracking-wide">Date range:</h2>
          <DateRangePicker />
        </div>
      </div>

      {/* WooCommerce Specific Summary Bar for Coupons Tab (2 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-[#c3c4c7] bg-white shadow-sm mb-6 rounded-sm">
        
        {/* Discounted Orders */}
        <div className="p-4 border-[#f0f0f1] border-b md:border-b-0 md:border-r">
            <h3 className="text-[13px] text-[#50575e] mb-2">Discounted orders</h3>
            <div className="flex items-center justify-between">
              <span className="text-[20px] font-normal text-[#1d2327]">{formatNumber(data.summary.discountedOrders)}</span>
              {isComparing && (
                <span className={`text-[12px] font-medium px-1.5 py-0.5 rounded-[3px] ${calculatePercentageChange(data.summary.discountedOrders, data.previousSummary.discountedOrders) >= 0 ? "bg-[#e5f5fa] text-[#008a20]" : "bg-[#fbeaea] text-[#d63638]"}`}>
                  {calculatePercentageChange(data.summary.discountedOrders, data.previousSummary.discountedOrders) >= 0 ? "" : "-"}
                  {Math.abs(calculatePercentageChange(data.summary.discountedOrders, data.previousSummary.discountedOrders))}%
                </span>
              )}
            </div>
        </div>

        {/* Amount */}
        <div className="p-4">
            <h3 className="text-[13px] text-[#50575e] mb-2">Amount</h3>
            <div className="flex items-center justify-between">
              <span className="text-[20px] font-normal text-[#1d2327]">{formatCurrency(data.summary.amount)}</span>
              {isComparing && (
                <span className={`text-[12px] font-medium px-1.5 py-0.5 rounded-[3px] ${calculatePercentageChange(data.summary.amount, data.previousSummary.amount) >= 0 ? "bg-[#e5f5fa] text-[#008a20]" : "bg-[#fbeaea] text-[#d63638]"}`}>
                  {calculatePercentageChange(data.summary.amount, data.previousSummary.amount) >= 0 ? "" : "-"}
                  {Math.abs(calculatePercentageChange(data.summary.amount, data.previousSummary.amount))}%
                </span>
              )}
            </div>
        </div>

      </div>

      {/* Main Chart Area */}
      <div className="border border-[#c3c4c7] shadow-sm rounded-sm mb-8 overflow-hidden">
        <AnalyticsChart 
          currentPeriod={data.chartData} 
          previousPeriod={data.previousChartData} 
          // totalDiscounts maps to the Amount discounted
          metricKey="totalDiscounts" 
          isCurrency={true} 
          isComparing={isComparing}
          metricLabel="Amount"
          currentTotal={data.summary.amount}
          previousTotal={data.previousSummary.amount}
          currentDateLabel={currentDateLabel}
          previousDateLabel={previousDateLabel}
        />
      </div>

      {/* The Coupons Table */}
      <CouponsTable data={data.tableData} />

    </div>
  );
}
