//File Location: app/(backend)/admin/analytics/products/page.tsx

import React from "react";
import { parseDateRange } from "@/app/actions/backend/analytics/shared.utils";
import { getProductsAnalyticsData } from "@/app/actions/backend/analytics/products.actions";
import { calculatePercentageChange, formatCurrency, formatNumber } from "@/app/actions/backend/analytics/shared.utils";
import { formatTz } from "@/lib/store-time";
import { getStoreTimezone } from "@/lib/get-store-timezone";

// Components
import DateRangePicker from "../_components/date-range-picker";
import AnalyticsChart from "../_components/analytics-chart";
import ProductsTable from "../_components/products-table";

type SearchParams = Promise<{ period?: string; compare?: string; from?: string; to?: string }>;

interface ProductsPageProps {
  searchParams: SearchParams;
}

export default async function ProductsAnalyticsPage(props: ProductsPageProps) {
  const searchParams = await props.searchParams;

  const period = searchParams.period || "month_to_date"; 
  const compareParam = searchParams.compare;
  const compare = compareParam !== undefined ? compareParam : "previous_year"; 
  
  const customFrom = searchParams.from;
  const customTo = searchParams.to;
  
  const dates = parseDateRange(period, compare, customFrom, customTo);
  const isComparing = compare !== "none";

  // Fetch data specifically for Products Tab
  const data = await getProductsAnalyticsData(dates.current, dates.previous);

  // We need to calculate Previous Summary dynamically to show the % badges properly.
  const previousSummary = data.previousChartData.reduce(
    (acc, curr) => {
      acc.itemsSold += curr.productsSold;
      acc.netSales += curr.netSales;
      acc.orders += curr.totalOrders;
      return acc;
    },
    { itemsSold: 0, netSales: 0, orders: 0 }
  );

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
      
      {/* Header & Date Range Selection Area */}
      <div className="bg-white border border-[#c3c4c7] shadow-sm p-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 rounded-sm">
        <div className="w-full sm:w-auto">
          <h2 className="text-[13px] font-semibold text-[#50575e] mb-2 uppercase tracking-wide">Date range:</h2>
          <DateRangePicker />
        </div>
      </div>

      {/* WooCommerce Specific Summary Bar for Products Tab */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#c3c4c7] bg-white shadow-sm mb-6 rounded-sm">
        
        {/* Items Sold */}
        <div className="p-4 border-[#f0f0f1] border-b md:border-b-0 md:border-r">
            <h3 className="text-[13px] text-[#50575e] mb-2">Items sold</h3>
            <div className="flex items-center justify-between">
              <span className="text-[20px] font-normal text-[#1d2327]">{formatNumber(data.summary.itemsSold)}</span>
              {isComparing && (
                <span className={`text-[12px] font-medium px-1.5 py-0.5 rounded-[3px] ${calculatePercentageChange(data.summary.itemsSold, previousSummary.itemsSold) >= 0 ? "bg-[#e5f5fa] text-[#008a20]" : "bg-[#fbeaea] text-[#d63638]"}`}>
                  {calculatePercentageChange(data.summary.itemsSold, previousSummary.itemsSold) >= 0 ? "" : "-"}
                  {Math.abs(calculatePercentageChange(data.summary.itemsSold, previousSummary.itemsSold))}%
                </span>
              )}
            </div>
        </div>

        {/* Net Sales */}
        <div className="p-4 border-[#f0f0f1] border-b md:border-b-0 md:border-r">
            <h3 className="text-[13px] text-[#50575e] mb-2">Net sales</h3>
            <div className="flex items-center justify-between">
              <span className="text-[20px] font-normal text-[#1d2327]">{formatCurrency(data.summary.netSales)}</span>
              {isComparing && (
                <span className={`text-[12px] font-medium px-1.5 py-0.5 rounded-[3px] ${calculatePercentageChange(data.summary.netSales, previousSummary.netSales) >= 0 ? "bg-[#e5f5fa] text-[#008a20]" : "bg-[#fbeaea] text-[#d63638]"}`}>
                  {calculatePercentageChange(data.summary.netSales, previousSummary.netSales) >= 0 ? "" : "-"}
                  {Math.abs(calculatePercentageChange(data.summary.netSales, previousSummary.netSales))}%
                </span>
              )}
            </div>
        </div>

        {/* Orders */}
        <div className="p-4">
            <h3 className="text-[13px] text-[#50575e] mb-2">Orders</h3>
            <div className="flex items-center justify-between">
              <span className="text-[20px] font-normal text-[#1d2327]">{formatNumber(data.summary.orders)}</span>
              {isComparing && (
                <span className={`text-[12px] font-medium px-1.5 py-0.5 rounded-[3px] ${calculatePercentageChange(data.summary.orders, previousSummary.orders) >= 0 ? "bg-[#e5f5fa] text-[#008a20]" : "bg-[#fbeaea] text-[#d63638]"}`}>
                  {calculatePercentageChange(data.summary.orders, previousSummary.orders) >= 0 ? "" : "-"}
                  {Math.abs(calculatePercentageChange(data.summary.orders, previousSummary.orders))}%
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
          // In WooCommerce products tab, it shows "Items sold" by default
          metricKey="productsSold" 
          isCurrency={false} 
          isComparing={isComparing}
          // 🔥 NEW PROPS ADDED TO AVOID ERROR
          metricLabel="Items sold"
          currentTotal={data.summary.itemsSold}
          previousTotal={previousSummary.itemsSold}
          currentDateLabel={currentDateLabel}
          previousDateLabel={previousDateLabel}
        />
      </div>

      {/* The Products Table */}
      <ProductsTable data={data.tableData} />

    </div>
  );
}
