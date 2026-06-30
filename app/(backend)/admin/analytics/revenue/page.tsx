//File Location: app/(backend)/admin/analytics/revenue/page.tsx

import React from "react";
import { parseDateRange } from "@/app/actions/backend/analytics/shared.utils";
import { getRevenueAnalyticsData } from "@/app/actions/backend/analytics/revenue.actions";
import { calculatePercentageChange, formatCurrency } from "@/app/actions/backend/analytics/shared.utils";
import { formatTz } from "@/lib/store-time";
import { getStoreTimezone } from "@/lib/get-store-timezone";

import DateRangePicker from "../_components/date-range-picker";
import AnalyticsChart from "../_components/analytics-chart";
import RevenueTable from "../_components/revenue-table";

type SearchParams = Promise<{ period?: string; compare?: string; from?: string; to?: string }>;

interface RevenuePageProps {
  searchParams: SearchParams;
}

export default async function RevenueAnalyticsPage(props: RevenuePageProps) {
  const searchParams = await props.searchParams;

  const period = searchParams.period || "month_to_date"; 
  const compareParam = searchParams.compare;
  const compare = compareParam !== undefined ? compareParam : "previous_year"; 
  
  const customFrom = searchParams.from;
  const customTo = searchParams.to;
  
  const dates = parseDateRange(period, compare, customFrom, customTo);
  const isComparing = compare !== "none";

  const data = await getRevenueAnalyticsData(dates.current, dates.previous);

  const cards = [
    { title: "Gross sales", value: data.summary.grossSales, prev: data.previousSummary.grossSales, isCurrency: true },
    { title: "Returns", value: data.summary.returns, prev: data.previousSummary.returns, isCurrency: true, isNegative: true },
    { title: "Coupons", value: data.summary.coupons, prev: data.previousSummary.coupons, isCurrency: true, isNegative: true },
    { title: "Net sales", value: data.summary.netSales, prev: data.previousSummary.netSales, isCurrency: true },
    { title: "Taxes", value: data.summary.taxes, prev: data.previousSummary.taxes, isCurrency: true },
    { title: "Shipping", value: data.summary.shipping, prev: data.previousSummary.shipping, isCurrency: true },
    { title: "Total sales", value: data.summary.totalSales, prev: data.previousSummary.totalSales, isCurrency: true },
  ];

  const rateCards = [
    { title: "Cart abandonment rate", value: data.summary.cartAbandonmentRate, prev: data.previousSummary.cartAbandonmentRate, isNegative: true },
    { title: "Refund rate", value: data.summary.refundRate, prev: data.previousSummary.refundRate, isNegative: true },
    { title: "Repeat purchase rate", value: data.summary.repeatPurchaseRate, prev: data.previousSummary.repeatPurchaseRate, isNegative: false },
  ];

  const timezone = await getStoreTimezone();

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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-0 border border-[#c3c4c7] bg-white shadow-sm mb-6 rounded-sm">
        {cards.map((card, index) => {
          const percentChange = calculatePercentageChange(card.value, card.prev);
          const isPositiveChange = card.isNegative ? percentChange <= 0 : percentChange >= 0;

          return (
            <div 
              key={card.title} 
              className={`p-4 border-[#f0f0f1] 
                border-r border-b xl:border-b-0
                ${index % 2 !== 0 ? 'border-r-0 md:border-r' : ''} 
                ${index === cards.length - 1 ? 'border-r-0 border-b-0' : ''}
              `}
            >
                <div className="flex items-center gap-1 mb-2">
                  <h3 className="text-[13px] text-[#50575e]">{card.title}</h3>
                </div>
                
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2 xl:gap-0">
                  <span className="text-[20px] font-normal text-[#1d2327]">
                    {formatCurrency(card.value)}
                  </span>
                  
                  {isComparing && (
                    <span 
                      className={`text-[12px] font-medium px-1.5 py-0.5 rounded-[3px] self-start xl:self-auto ${
                        isPositiveChange 
                          ? "bg-[#e5f5fa] text-[#008a20]" 
                          : "bg-[#fbeaea] text-[#d63638]"
                      }`}
                    >
                      {percentChange >= 0 ? "" : "-"}
                      {Math.abs(percentChange)}%
                    </span>
                  )}
                </div>
            </div>
          );
        })}
      </div>

      {/* Rate Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#c3c4c7] bg-white shadow-sm mb-6 rounded-sm">
        {rateCards.map((card, index) => {
          const percentChange = calculatePercentageChange(card.value, card.prev);
          const isPositiveChange = card.isNegative ? percentChange <= 0 : percentChange >= 0;
          return (
            <div
              key={card.title}
              className={`p-4 border-[#f0f0f1] ${index < rateCards.length - 1 ? "border-r" : ""}`}
            >
              <h3 className="text-[13px] text-[#50575e] mb-2">{card.title}</h3>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[20px] font-normal text-[#1d2327]">{card.value}%</span>
                {isComparing && (
                  <span
                    className={`text-[12px] font-medium px-1.5 py-0.5 rounded-[3px] ${
                      isPositiveChange ? "bg-[#e5f5fa] text-[#008a20]" : "bg-[#fbeaea] text-[#d63638]"
                    }`}
                  >
                    {percentChange >= 0 ? "" : "-"}{Math.abs(percentChange)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* The Fully Upgraded WooCommerce Chart */}
      <div className="border border-[#c3c4c7] shadow-sm rounded-sm mb-8 overflow-hidden">
         <AnalyticsChart 
            currentPeriod={data.chartData} 
            previousPeriod={data.previousChartData} 
            metricKey="grossSales" 
            isCurrency={true} 
            isComparing={isComparing}
            metricLabel="Gross sales"
            currentTotal={data.summary.grossSales}
            previousTotal={data.previousSummary.grossSales}
            currentDateLabel={currentDateLabel}
            previousDateLabel={previousDateLabel}
         />
      </div>

      {/* The Responsive Revenue Table */}
      <RevenueTable data={data.tableData} />

    </div>
  );
}
