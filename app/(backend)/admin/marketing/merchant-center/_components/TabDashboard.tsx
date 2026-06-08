//File Path: app/(backend)/admin/marketing/merchant-center/_components/TabDashboard.tsx

"use client";

import { useEffect, useState } from "react";
import { fetchGoogleAdsMetrics, DashboardMetrics } from "@/app/actions/backend/merchant-center/gmc-reports.actions";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from "recharts";

interface Props {
  config: any;
  totalStoreViews: number;
  syncedCount: number;
  failedCount: number;
}

export default function TabDashboard({ config, totalStoreViews, syncedCount, failedCount }: Props) {
  // ডাইনামিক ডেট রেঞ্জ
  const currentMonth = new Date().toLocaleString('en-US', { month: 'short' });
  const currentYear = new Date().getFullYear();

  // Metrics State
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  // গুগল অ্যাডস কানেক্টেড থাকলে লাইভ ডেটা ফেচ করা হবে
  useEffect(() => {
    if (config.googleAdsConnected) {
      setIsLoadingMetrics(true);
      fetchGoogleAdsMetrics().then((res) => {
        if (res.success && res.data) {
          setMetrics(res.data);
        } else {
          setMetricsError(res.error || "Failed to load metrics.");
        }
        setIsLoadingMetrics(false);
      });
    }
  }, [config.googleAdsConnected]);

  // ক্যালকুলেশন
  const avgCpc = metrics && metrics.totalClicks > 0 
    ? (metrics.totalCost / metrics.totalClicks).toFixed(2) 
    : "0.00";

  return (
    <div className="max-w-[1200px] mx-auto mt-2">
      
      {/* Dynamic Sync Alert */}
      {failedCount > 0 ? (
        <div className="bg-[#fcf0f1] border border-[#d63638] border-l-4 p-4 mb-6 rounded-[3px] shadow-sm flex items-start gap-4">
          <div className="text-[#d63638] mt-1 font-bold">!</div>
          <div>
            <p className="text-[14px] text-[#1d2327] m-0 mb-1 leading-relaxed">
              <strong>Action Required:</strong> You have {failedCount} products that failed to sync with Google Merchant Center. Fix them to increase your visibility.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-[#f0f6ea] border border-[#00a32a] border-l-4 p-4 mb-6 rounded-[3px] shadow-sm flex items-start gap-4">
          <div className="text-[#00a32a] mt-1 font-bold">✓</div>
          <div>
            <p className="text-[14px] text-[#1d2327] m-0 leading-relaxed">
              All {syncedCount} products are perfectly synced with Google! Connect Google Ads to start running campaigns.
            </p>
          </div>
        </div>
      )}

      {/* Dynamic Date Filter */}
      <div className="mb-6 flex justify-between items-end">
        <div>
          <label className="block text-[12px] text-[#646970] mb-1">Date range:</label>
          <select className="border border-[#8c8f94] rounded-[3px] px-3 py-1.5 text-[14px] bg-white min-w-[300px] focus:outline-none focus:border-[#2271b1]">
            <option>Last 30 days (Auto Synced)</option>
            <option>Month to date ({currentMonth} 1 - {new Date().getDate()}, {currentYear})</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left Column: Google Ads Information */}
        <div className="bg-white border border-[#ccd0d4] rounded-[3px] overflow-hidden">
          <h2 className="text-[16px] font-semibold text-[#1d2327] border-b border-[#ccd0d4] px-6 py-4 m-0">
            Google Ads Integration
          </h2>
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6 mb-6">
              <div className="w-[180px] h-[200px] bg-[#f0f0f1] border border-[#ccd0d4] rounded-[5px] flex-shrink-0 relative overflow-hidden flex flex-col items-center justify-center">
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-8 h-8 mb-4 opacity-80" />
                <div className="h-[12px] bg-[#e0e0e0] w-[60%] rounded-full mb-2"></div>
                <div className="h-[12px] bg-[#e0e0e0] w-[40%] rounded-full"></div>
              </div>

              <ul className="list-none p-0 m-0 text-[13px] text-[#50575e] leading-relaxed flex flex-col gap-3">
                <li className="flex gap-2"><span className="text-[#00a32a]">✓</span> Reach more customers by advertising {syncedCount} products across Google channels.</li>
                <li className="flex gap-2"><span className="text-[#00a32a]">✓</span> Set a daily budget and only pay when people click on your ads.</li>
                <li className="flex gap-2"><span className="text-[#00a32a]">✓</span> Performance Max uses AI to show the most impactful ads at the right time.</li>
              </ul>
            </div>

            <div className="text-right border-t border-[#ccd0d4] pt-4">
              {config.googleAdsConnected ? (
                <a 
                  href={`https://ads.google.com/aw/campaigns/new?ocid=${config.googleAdsAccountId}`} 
                  target="_blank"
                  className="inline-block bg-[#2271b1] text-white px-5 py-2 rounded-[3px] text-[13px] font-semibold hover:bg-[#135e96] transition-colors"
                >
                  Create Campaign ↗
                </a>
              ) : (
                <a 
                  href="/admin/marketing/merchant-center?tab=settings" 
                  className="inline-block bg-[#2271b1] text-white px-5 py-2 rounded-[3px] text-[13px] font-semibold hover:bg-[#135e96] transition-colors"
                >
                  Connect Google Ads
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Store Performance Overview */}
        <div className="bg-white border border-[#ccd0d4] rounded-[3px] h-fit">
          <h2 className="text-[16px] font-semibold text-[#1d2327] border-b border-[#ccd0d4] px-6 py-4 m-0 flex justify-between items-center">
            <span>Store Performance Overview</span>
            {config.googleAdsConnected && <span className="text-[11px] bg-[#e6f4ea] text-[#137333] px-2 py-1 rounded-[3px]">Ads Connected</span>}
          </h2>
          
          <div className="flex divide-x divide-[#ccd0d4] border-b border-[#ccd0d4]">
            <div className="flex-1 p-6">
              <p className="text-[12px] font-semibold text-[#646970] m-0 mb-1 uppercase tracking-wide">Total Store Views</p>
              <div className="flex items-end gap-3 mt-2">
                <span className="text-[28px] font-normal text-[#1d2327]">{totalStoreViews.toLocaleString()}</span>
                {totalStoreViews > 0 && <span className="text-[#00a32a] text-[12px] font-bold mb-2">↑ Active</span>}
              </div>
            </div>
            
            <div className="flex-1 p-6 bg-[#f9f9f9]">
              <p className="text-[12px] font-semibold text-[#646970] m-0 mb-1 uppercase tracking-wide">Live in Google</p>
              <div className="flex items-end gap-3 mt-2">
                <span className="text-[28px] font-normal text-[#2271b1]">{syncedCount}</span>
                <span className="text-[#646970] text-[12px] font-semibold mb-2">Products</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 🚀 PRO FEATURE: LIVE GOOGLE ADS PERFORMANCE CHART (WooCommerce Style) */}
      {/* ==================================================================== */}
      {config.googleAdsConnected && (
        <div className="bg-white border border-[#ccd0d4] rounded-[3px] overflow-hidden mb-10 shadow-sm animate-in fade-in duration-500">
          
          {/* Top 4 Colored Stat Boxes */}
          <div className="grid grid-cols-2 md:grid-cols-4 border-b border-[#ccd0d4]">
            
            {/* Clicks (Blue) */}
            <div className="p-4 bg-[#1a73e8] text-white border-r border-[#ccd0d4]">
              <div className="flex items-center gap-1 mb-1">
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-white"></div>
                <p className="text-[13px] font-semibold m-0">Clicks</p>
              </div>
              <p className="text-[26px] font-normal m-0">{isLoadingMetrics ? "..." : metrics?.totalClicks.toLocaleString()}</p>
            </div>

            {/* Impressions (Red) */}
            <div className="p-4 bg-[#d93025] text-white border-r border-[#ccd0d4]">
              <div className="flex items-center gap-1 mb-1">
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-white"></div>
                <p className="text-[13px] font-semibold m-0">Impressions</p>
              </div>
              <p className="text-[26px] font-normal m-0">{isLoadingMetrics ? "..." : metrics?.totalImpressions.toLocaleString()}</p>
            </div>

            {/* Avg CPC (White) */}
            <div className="p-4 bg-white text-[#3c4043] border-r border-[#ccd0d4]">
              <div className="flex items-center gap-1 mb-1">
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-[#3c4043]"></div>
                <p className="text-[13px] font-semibold m-0">Avg. CPC</p>
              </div>
              <p className="text-[26px] font-normal m-0">{isLoadingMetrics ? "..." : `$${avgCpc}`}</p>
            </div>

            {/* Conversions (Yellow) */}
            <div className="p-4 bg-[#fbbc04] text-[#3c4043]">
              <div className="flex items-center gap-1 mb-1">
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-[#3c4043]"></div>
                <p className="text-[13px] font-semibold m-0">Conversions</p>
              </div>
              <p className="text-[26px] font-normal m-0">{isLoadingMetrics ? "..." : metrics?.totalConversions}</p>
            </div>

          </div>

          {/* Line Chart Area */}
          <div className="p-6">
            {isLoadingMetrics ? (
              <div className="h-[250px] flex items-center justify-center text-[#646970] text-[13px]">
                Loading Live Chart Data from Google...
              </div>
            ) : metricsError ? (
              <div className="h-[250px] flex items-center justify-center text-[#d63638] text-[13px]">
                {metricsError}
              </div>
            ) : metrics && metrics.chartData.length > 0 ? (
              <div className="h-[280px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8eaed" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: "#5f6368", fontSize: 11 }} 
                      tickLine={false} 
                      axisLine={{ stroke: "#e8eaed" }} 
                      dy={10} 
                    />
                    <YAxis 
                      yAxisId="left" 
                      tick={{ fill: "#5f6368", fontSize: 11 }} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#3c4043", color: "#fff", borderRadius: "4px", fontSize: "12px", border: "none" }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Line yAxisId="left" type="monotone" dataKey="clicks" name="Clicks" stroke="#1a73e8" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    <Line yAxisId="left" type="monotone" dataKey="impressions" name="Impressions" stroke="#d93025" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    <Line yAxisId="left" type="monotone" dataKey="conversions" name="Conversions" stroke="#fbbc04" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex flex-col items-center justify-center text-[#646970] text-[13px]">
                <p>No campaign data found for the last 30 days.</p>
                <a href={`https://ads.google.com/aw/campaigns/new?ocid=${config.googleAdsAccountId}`} target="_blank" className="text-[#2271b1] hover:underline mt-1">Start a new campaign</a>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}