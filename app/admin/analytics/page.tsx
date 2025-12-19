"use client";

import { useState, useEffect } from "react";
import { getAnalyticsData, AnalyticsResponse } from "@/app/actions/analytics";
import { Loader2 } from "lucide-react";
import { AnalyticsHeader } from "@/app/admin/analytics/_components/analytics-header";
import { SummaryCards } from "@/app/admin/analytics/_components/summary-cards";
import { SalesChart } from "@/app/admin/analytics/_components/sales-chart";
import { TopProducts } from "@/app/admin/analytics/_components/top-products";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  // TODO: Fetch this from StoreSettings in DB
  const storeCurrency = "BDT"; 

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getAnalyticsData(period);
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  if (loading && !data) {
    return (
      <div className="h-[calc(100vh-200px)] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 mb-3" size={40}/>
        <p className="text-slate-500 font-medium text-sm animate-pulse">Calculating store metrics...</p>
      </div>
    );
  }

  return (
    <div className=" p-5 font-sans text-slate-800 pb-10">
      
      {/* 1. Filter Header */}
      <AnalyticsHeader period={period} setPeriod={setPeriod} />

      {/* 2. Key Metrics */}
      {data && <SummaryCards summary={data.summary} currency={storeCurrency} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* 3. Main Graph */}
         {data && <SalesChart data={data.chartData} />}

         {/* 4. Top Selling Items */}
         {data && <TopProducts products={data.topProducts} currency={storeCurrency} />}

      </div>
    </div>
  );
}