//File Location: app/(backend)/admin/analytics/orders/page.tsx

import React from "react";
import { parseDateRange } from "@/app/actions/backend/analytics/shared.utils";
import { getOrdersAnalyticsData } from "@/app/actions/backend/analytics/orders.actions";
import { calculatePercentageChange, formatCurrency, formatNumber } from "@/app/actions/backend/analytics/shared.utils";
import { formatTz } from "@/lib/store-time";
import { getStoreTimezone } from "@/lib/get-store-timezone";

// Components
import DateRangePicker from "../_components/date-range-picker";
import AnalyticsChart from "../_components/analytics-chart";
import OrdersTable from "../_components/orders-table";

type SearchParams = Promise<{ period?: string; compare?: string; from?: string; to?: string }>;

interface OrdersPageProps {
  searchParams: SearchParams;
}

export default async function OrdersAnalyticsPage(props: OrdersPageProps) {
  const searchParams = await props.searchParams;

  const period = searchParams.period || "last_year"; 
  const compareParam = searchParams.compare;
  const compare = compareParam !== undefined ? compareParam : "previous_year"; 
  
  const customFrom = searchParams.from;
  const customTo = searchParams.to;
  
  const dates = parseDateRange(period, compare, customFrom, customTo);
  const isComparing = compare !== "none";

  // Fetch data specifically for Orders Tab
  const [data, timezone] = await Promise.all([
    getOrdersAnalyticsData(dates.current, dates.previous),
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

      {/* WooCommerce Specific Summary Bar for Orders Tab (4 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border border-[#c3c4c7] bg-white shadow-sm mb-6 rounded-sm">
        
        {/* Orders */}
        <div className="p-4 border-[#f0f0f1] border-b md:border-b-0 lg:border-r">
            <h3 className="text-[13px] text-[#50575e] mb-2">Orders</h3>
            <div className="flex items-center justify-between">
              <span className="text-[20px] font-normal text-[#1d2327]">{formatNumber(data.summary.orders)}</span>
              {isComparing && (
                <span className={`text-[12px] font-medium px-1.5 py-0.5 rounded-[3px] ${calculatePercentageChange(data.summary.orders, data.previousSummary.orders) >= 0 ? "bg-[#e5f5fa] text-[#008a20]" : "bg-[#fbeaea] text-[#d63638]"}`}>
                  {calculatePercentageChange(data.summary.orders, data.previousSummary.orders) >= 0 ? "" : "-"}
                  {Math.abs(calculatePercentageChange(data.summary.orders, data.previousSummary.orders))}%
                </span>
              )}
            </div>
        </div>

        {/* Net Sales */}
        <div className="p-4 border-[#f0f0f1] border-b lg:border-b-0 lg:border-r">
            <h3 className="text-[13px] text-[#50575e] mb-2">Net sales</h3>
            <div className="flex items-center justify-between">
              <span className="text-[20px] font-normal text-[#1d2327]">{formatCurrency(data.summary.netSales)}</span>
              {isComparing && (
                <span className={`text-[12px] font-medium px-1.5 py-0.5 rounded-[3px] ${calculatePercentageChange(data.summary.netSales, data.previousSummary.netSales) >= 0 ? "bg-[#e5f5fa] text-[#008a20]" : "bg-[#fbeaea] text-[#d63638]"}`}>
                  {calculatePercentageChange(data.summary.netSales, data.previousSummary.netSales) >= 0 ? "" : "-"}
                  {Math.abs(calculatePercentageChange(data.summary.netSales, data.previousSummary.netSales))}%
                </span>
              )}
            </div>
        </div>

        {/* Average Order Value */}
        <div className="p-4 border-[#f0f0f1] border-b md:border-b-0 lg:border-r">
            <h3 className="text-[13px] text-[#50575e] mb-2">Average order value</h3>
            <div className="flex items-center justify-between">
              <span className="text-[20px] font-normal text-[#1d2327]">{formatCurrency(data.summary.averageOrderValue)}</span>
              {isComparing && (
                <span className={`text-[12px] font-medium px-1.5 py-0.5 rounded-[3px] ${calculatePercentageChange(data.summary.averageOrderValue, data.previousSummary.averageOrderValue) >= 0 ? "bg-[#e5f5fa] text-[#008a20]" : "bg-[#fbeaea] text-[#d63638]"}`}>
                  {calculatePercentageChange(data.summary.averageOrderValue, data.previousSummary.averageOrderValue) >= 0 ? "" : "-"}
                  {Math.abs(calculatePercentageChange(data.summary.averageOrderValue, data.previousSummary.averageOrderValue))}%
                </span>
              )}
            </div>
        </div>

        {/* Average Items Per Order */}
        <div className="p-4">
            <h3 className="text-[13px] text-[#50575e] mb-2">Average items per order</h3>
            <div className="flex items-center justify-between">
              <span className="text-[20px] font-normal text-[#1d2327]">{formatNumber(data.summary.averageItemsPerOrder)}</span>
              {isComparing && (
                <span className={`text-[12px] font-medium px-1.5 py-0.5 rounded-[3px] ${calculatePercentageChange(data.summary.averageItemsPerOrder, data.previousSummary.averageItemsPerOrder) >= 0 ? "bg-[#e5f5fa] text-[#008a20]" : "bg-[#fbeaea] text-[#d63638]"}`}>
                  {calculatePercentageChange(data.summary.averageItemsPerOrder, data.previousSummary.averageItemsPerOrder) >= 0 ? "" : "-"}
                  {Math.abs(calculatePercentageChange(data.summary.averageItemsPerOrder, data.previousSummary.averageItemsPerOrder))}%
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
          // In WooCommerce orders tab, it shows "totalOrders" (Orders count) by default
          metricKey="totalOrders" 
          isCurrency={false} 
          isComparing={isComparing}
          metricLabel="Orders"
          currentTotal={data.summary.orders}
          previousTotal={data.previousSummary.orders}
          currentDateLabel={currentDateLabel}
          previousDateLabel={previousDateLabel}
        />
      </div>

      {/* The Orders Table */}
      <OrdersTable data={data.tableData} />

    </div>
  );
}
