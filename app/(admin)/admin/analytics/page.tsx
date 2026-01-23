//app/(admin)/admin/analytics/page.tsx

"use client";

import { useState, useEffect } from "react";
import { getAnalyticsDashboardData } from "@/app/actions/admin/analytics";
import { AnalyticsResponse, Period } from "@/app/actions/admin/analytics/types";
import { Loader2, AlertCircle } from "lucide-react";

// Components
import { AnalyticsHeader } from "./_components/analytics-header";
import { KpiStatsGrid } from "./_components/kpi-stats-grid";
import { SalesGrowthChart } from "./_components/sales-growth-chart";
import { OperationsWidget } from "./_components/operations-widget";
import { ProductInsightsWidget } from "./_components/product-insights-widget";
import { CustomerInsightsWidget } from "./_components/customer-insights-widget";
import { ForecastWidget } from "./_components/forecast-widget";
import { TrafficConversionWidget } from "./_components/traffic-conversion-widget";
import { BrandReputationWidget } from "./_components/brand-reputation-widget";

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  
  // Two loading states: 
  // 1. initialLoad: Shows full screen spinner (First time only)
  // 2. isFetching: Shows subtle indicators (When switching tabs)
  const [initialLoad, setInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      // If we already have data, it's a "refetch", so use isFetching
      if (data) {
        setIsFetching(true);
      } else {
        setInitialLoad(true);
      }
      
      setError(null);
      
      try {
        const res = await getAnalyticsDashboardData(period);
        
        if (isMounted) {
          if (res.success && res.data) {
            // ✅ FIX: Serialize data to handle any remaining Decimal objects safely
            setData(JSON.parse(JSON.stringify(res.data)));
          } else {
            setError(res.error || "Failed to load analytics data.");
          }
        }
      } catch (err) {
        if (isMounted) setError("An unexpected error occurred.");
        console.error(err);
      } finally {
        if (isMounted) {
          setInitialLoad(false);
          setIsFetching(false);
        }
      }
    }

    fetchData();

    return () => { isMounted = false; };
  }, [period]);

  // --- 1. Initial Full Screen Loading ---
  if (initialLoad) {
    return (
      <div className="h-[calc(100vh-100px)] w-full flex flex-col items-center justify-center bg-slate-50/50">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
        <h3 className="text-slate-800 font-bold text-lg">Initializing Analytics...</h3>
        <p className="text-slate-500 text-sm mt-1 animate-pulse">Calculating Revenue, Traffic & Forecasts</p>
      </div>
    );
  }

  // --- 2. Error State ---
  if (error) {
    return (
      <div className="p-8 flex items-center justify-center h-[50vh]">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 shadow-sm max-w-md w-full text-center">
          <AlertCircle className="h-10 w-10 mx-auto mb-3 text-red-500" />
          <h3 className="text-lg font-bold mb-2">Data Load Failed</h3>
          <p className="text-sm opacity-80 mb-6">{error}</p>
          <button 
            onClick={() => setPeriod(period)}
            className="px-6 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // --- 3. Main Dashboard (With Overlay Loading Support) ---
  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-8 pb-24 relative">
      
      {/* Header receives isFetching to show localized spinner */}
      <AnalyticsHeader period={period} setPeriod={setPeriod} isFetching={isFetching} />

      {/* Content Wrapper: Reduces opacity slightly when fetching new data */}
      <div className={`space-y-8 transition-opacity duration-300 ${isFetching ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
        
        {data && (
          <>
            <section>
              <KpiStatsGrid summary={data.summary} />
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                 <SalesGrowthChart data={data.salesChart} />
              </div>
              <div className="xl:col-span-1">
                 <ForecastWidget data={data.salesForecast} />
              </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                 <TrafficConversionWidget 
                    funnel={data.conversionFunnel} 
                    mostViewed={data.mostViewedProducts} 
                 />
              </div>
              <div className="xl:col-span-1">
                 <BrandReputationWidget 
                    reviews={data.reviewSummary}
                    brands={data.brandPerformance}
                 />
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
               <ProductInsightsWidget 
                  topProducts={data.topProducts} 
                  inventory={data.inventoryHealth}
                  categories={data.categoryPerformance}
               />
               <CustomerInsightsWidget 
                  demographics={data.customerDemographics}
                  retention={data.customerTypeBreakdown}
                  topCustomers={data.topCustomers}
               />
               <OperationsWidget 
                  statusData={data.orderStatusDistribution} 
                  cartMetrics={data.cartMetrics}
               />
            </section>
          </>
        )}
      </div>
    </div>
  );
}