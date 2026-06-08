//File Path: app/(backend)/admin/marketing/merchant-center/_components/TabDashboard.tsx

"use client";

import { useEffect, useState } from "react";
import { fetchGoogleAdsMetrics, DashboardMetrics } from "@/app/actions/backend/merchant-center/gmc-reports.actions";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";

interface Props {
  config: any;
  totalStoreViews: number;
  syncedCount: number;
  failedCount: number;
}

// 🚀 উকমার্সের মতো অ্যানিমেটেড অ্যাডস প্রিভিউ কম্পোনেন্ট
const AnimatedAdsPreview = () => {
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % 3);
    }, 3000); 
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-[180px] h-[220px] bg-white border border-[#ccd0d4] rounded-[5px] flex-shrink-0 relative overflow-hidden shadow-sm flex flex-col transition-all duration-500">
      
      {/* Search Ad Mockup */}
      {slideIndex === 0 && (
        <div className="p-3 animate-in fade-in duration-500">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 bg-[#4285F4] text-white flex justify-center items-center rounded-full text-[10px] font-bold">G</div>
            <div className="h-[6px] bg-[#e8eaed] w-[60%] rounded-full"></div>
          </div>
          <div className="h-[8px] bg-[#1a0dab] w-[90%] rounded-full mb-2"></div>
          <div className="h-[6px] bg-[#202124] w-[100%] rounded-full mb-1"></div>
          <div className="h-[6px] bg-[#202124] w-[80%] rounded-full"></div>
          <div className="mt-4 border-t border-[#f0f0f0] pt-2">
            <span className="text-[10px] font-bold text-[#202124] bg-[#f1f3f4] px-1 py-0.5 rounded">Ad</span>
            <span className="text-[10px] text-[#5f6368] ml-2">GoBike Electric Bikes</span>
          </div>
        </div>
      )}

      {/* YouTube Ad Mockup */}
      {slideIndex === 1 && (
        <div className="animate-in fade-in duration-500 h-full flex flex-col">
          <div className="h-[120px] bg-[#f0f0f1] relative flex justify-center items-center">
            {/* Play Button */}
            <div className="w-10 h-7 bg-[#FF0000] rounded-[6px] flex justify-center items-center">
              <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-white border-b-[4px] border-b-transparent"></div>
            </div>
          </div>
          <div className="p-2 flex gap-2">
            <div className="w-6 h-6 bg-[#d9d9d9] rounded-full flex-shrink-0"></div>
            <div className="flex-1">
              <div className="h-[6px] bg-[#202124] w-[90%] rounded-full mb-1"></div>
              <div className="h-[6px] bg-[#5f6368] w-[60%] rounded-full mb-1"></div>
              <span className="text-[9px] font-bold text-white bg-[#fbbc04] px-1 rounded">Ad</span>
            </div>
          </div>
        </div>
      )}

      {/* Gmail Ad Mockup */}
      {slideIndex === 2 && (
        <div className="p-3 animate-in fade-in duration-500 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4 border-b border-[#f0f0f0] pb-2">
            <div className="w-6 h-4 bg-[#ea4335] text-white flex justify-center items-center rounded-[3px] text-[8px] font-bold">M</div>
            <div className="h-[6px] bg-[#e8eaed] w-[60%] rounded-full"></div>
          </div>
          <div className="flex gap-2 mb-2">
            <span className="text-[9px] font-bold text-green-700 bg-green-100 border border-green-200 px-1 rounded">Ad</span>
            <div className="h-[8px] bg-[#202124] w-[60%] rounded-full"></div>
          </div>
          <div className="h-[6px] bg-[#5f6368] w-[100%] rounded-full mb-1"></div>
          <div className="h-[6px] bg-[#5f6368] w-[80%] rounded-full"></div>
          <div className="mt-auto flex justify-center">
             <div className="w-[80px] h-[80px] bg-[#f0f0f1] rounded-[4px] border border-[#e8eaed]"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function TabDashboard({ config, totalStoreViews, syncedCount, failedCount }: Props) {
  const currentMonth = new Date().toLocaleString('en-US', { month: 'short' });
  const currentYear = new Date().getFullYear();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [apiNote, setApiNote] = useState<string | null>(null);

  useEffect(() => {
    if (config.googleAdsConnected) {
      setIsLoadingMetrics(true);
      fetchGoogleAdsMetrics().then((res) => {
        if (res.success && res.data) {
          setMetrics(res.data);
        } else {
          setApiNote(res.error || null);
        }
        setIsLoadingMetrics(false);
      });
    }
  }, [config.googleAdsConnected]);

  // 🚀 Safe Calculation for Avg CPC
  const avgCpc = metrics && Number(metrics.totalClicks.replace(/,/g, '')) > 0 
    ? (Number(metrics.totalCost) / Number(metrics.totalClicks.replace(/,/g, ''))).toFixed(2) 
    : "0.00";

  return (
    <div className="w-full">
      
      {/* 🚀 Dynamic Merchant Center Sync Alerts */}
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

      {/* Date Filter */}
      <div className="mb-6 flex justify-between items-end">
        <div>
          <label className="block text-[12px] text-[#646970] mb-1">Date range:</label>
          <select className="border border-[#8c8f94] rounded-[3px] px-3 py-1.5 text-[14px] bg-white min-w-[300px] focus:outline-none focus:border-[#2271b1]">
            <option>Last 30 days (Auto Synced)</option>
            <option>Month to date ({currentMonth} 1 - {new Date().getDate()}, {currentYear})</option>
          </select>
        </div>
      </div>

      {/* 🚀 STORE PERFORMANCE & INTEGRATION OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* Google Ads Onboarding/Integration Box */}
        <div className="bg-white border border-[#ccd0d4] rounded-[3px] overflow-hidden flex flex-col shadow-sm">
          <h2 className="text-[16px] font-semibold text-[#1d2327] border-b border-[#ccd0d4] px-6 py-4 m-0">
            Google Ads Integration
          </h2>
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex flex-col md:flex-row gap-6 mb-4">
              <AnimatedAdsPreview />
              <ul className="list-none p-0 m-0 text-[13px] text-[#50575e] leading-relaxed flex flex-col gap-3">
                <li className="flex gap-2"><span className="text-[#00a32a] font-bold">✓</span> Reach more customers by advertising products across Google channels.</li>
                <li className="flex gap-2"><span className="text-[#00a32a] font-bold">✓</span> Set a daily budget and only pay when people click on your ads.</li>
                <li className="flex gap-2"><span className="text-[#00a32a] font-bold">✓</span> Performance Max uses AI to show the most impactful ads at the right time.</li>
              </ul>
            </div>
            <div className="mt-auto border-t border-[#f0f0f0] pt-4 flex items-center gap-3">
               <div className="text-[20px]">🎁</div>
               <p className="text-[12px] text-[#1d2327] m-0">Claim $500 in ads credit when you spend your first $500 with Google Ads.</p>
            </div>
          </div>
          <div className="bg-[#f9f9f9] border-t border-[#ccd0d4] px-6 py-3 text-right">
             {config.googleAdsConnected ? (
                <a href={`https://ads.google.com/aw/campaigns/new?ocid=${config.googleAdsAccountId}`} target="_blank" className="inline-block bg-[#2271b1] text-white px-5 py-1.5 rounded-[3px] text-[13px] font-semibold hover:bg-[#135e96]">
                  Create Campaign ↗
                </a>
             ) : (
                <a href="/admin/marketing/merchant-center?tab=settings" className="inline-block bg-[#2271b1] text-white px-5 py-1.5 rounded-[3px] text-[13px] font-semibold hover:bg-[#135e96]">
                  Connect Google Ads
                </a>
             )}
          </div>
        </div>

        {/* Store Views & Products Live Box */}
        <div className="bg-white border border-[#ccd0d4] rounded-[3px] h-fit shadow-sm">
          <h2 className="text-[16px] font-semibold text-[#1d2327] border-b border-[#ccd0d4] px-6 py-4 m-0 flex justify-between items-center">
            <span>Store Performance Overview</span>
            {config.googleAdsConnected && <span className="text-[11px] bg-[#e6f4ea] text-[#137333] border border-[#bce3c6] px-2 py-1 rounded-[3px]">Ads Connected</span>}
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
      {/* 🚀 GOOGLE ADS PERFORMANCE (4 BOXES + CHART) */}
      {/* ==================================================================== */}
      {config.googleAdsConnected && (
        <div className="bg-white border border-[#ccd0d4] rounded-[3px] overflow-hidden mb-6 shadow-sm">
          {apiNote && <div className="bg-[#fff8e5] px-4 py-2 border-b border-[#ccd0d4] text-[12px] text-[#664d03]">Note: {apiNote}</div>}
          
          <div className="grid grid-cols-2 md:grid-cols-4 border-b border-[#ccd0d4] divide-x divide-y md:divide-y-0 divide-[#ccd0d4]">
            <div className="p-4 bg-[#1a73e8] text-white">
              <p className="text-[12px] font-semibold m-0 opacity-90">▼ Clicks</p>
              <p className="text-[26px] font-normal m-0 mt-1">{isLoadingMetrics ? "..." : metrics?.totalClicks}</p>
            </div>
            <div className="p-4 bg-[#d93025] text-white">
              <p className="text-[12px] font-semibold m-0 opacity-90">▼ Impressions</p>
              <p className="text-[26px] font-normal m-0 mt-1">{isLoadingMetrics ? "..." : metrics?.totalImpressions}</p>
            </div>
            <div className="p-4 bg-white text-[#3c4043]">
              <p className="text-[12px] font-semibold m-0 text-[#5f6368]">▼ Avg. CPC</p>
              <p className="text-[26px] font-normal m-0 mt-1">{isLoadingMetrics ? "..." : `$${avgCpc}`}</p>
            </div>
            <div className="p-4 bg-[#fbbc04] text-[#3c4043]">
              <p className="text-[12px] font-semibold m-0 text-[#5f6368]">▼ Conversions</p>
              <p className="text-[26px] font-normal m-0 mt-1">{isLoadingMetrics ? "..." : metrics?.totalConversions}</p>
            </div>
          </div>

          <div className="p-2 sm:p-6">
            {isLoadingMetrics ? (
              <div className="h-[250px] flex items-center justify-center text-[#646970] text-[13px]">Loading Live Chart Data from Google...</div>
            ) : metrics && metrics.chartData.length > 0 ? (
              <div className="h-[250px] sm:h-[280px] w-full  sm:ml-0">
                {/* 🚀 FIX: -ml-4 দিয়ে মোবাইলে চার্টটিকে একটু বামে সরিয়ে আনা হয়েছে */}
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8eaed" />
                    <XAxis 
                       dataKey="date" 
                       tick={{ fill: "#5f6368", fontSize: 10 }} 
                       tickLine={false} 
                       axisLine={{ stroke: "#e8eaed" }} 
                       dy={10} 
                       minTickGap={20} 
                    />
                    <YAxis 
                       yAxisId="left" 
                       tick={{ fill: "#5f6368", fontSize: 10 }} 
                       tickLine={false} 
                       axisLine={false} 
                       width={35} 
                       tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val} 
                    />
                    <Tooltip contentStyle={{ backgroundColor: "#3c4043", color: "#fff", borderRadius: "4px", fontSize: "12px", border: "none" }} itemStyle={{ color: "#fff" }} />
                    <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="#1a73e8" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    <Line yAxisId="left" type="monotone" dataKey="impressions" stroke="#d93025" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    <Line yAxisId="left" type="monotone" dataKey="conversions" stroke="#fbbc04" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex flex-col items-center justify-center text-[#646970] text-[13px] text-center p-4">
                <p>No campaign data found for the last 30 days.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 🚀 NEW SECTION: OPTIMIZATION SCORE & CAMPAIGNS TABLE */}
      {/* ==================================================================== */}
      {config.googleAdsConnected && metrics && !isLoadingMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          
          {/* Optimization Score Card */}
          <div className="bg-white border border-[#ccd0d4] rounded-[3px] shadow-sm flex flex-col">
             <div className="border-b border-[#ccd0d4] px-4 py-3 flex items-center justify-between bg-[#f8f9fa]">
                <div className="flex items-center gap-2">
                   <span className="text-[#5f6368]">💡</span>
                   <h3 className="text-[14px] font-semibold text-[#1d2327] m-0">Optimization score</h3>
                </div>
             </div>
             <div className="p-6 flex-1 flex flex-col justify-center items-center text-center">
                <h2 className="text-[42px] font-normal text-[#1a73e8] m-0 leading-none">{metrics.optimizationScore}</h2>
                <div className="w-[100px] h-[5px] bg-[#1a73e8] rounded-full mt-3 mb-5"></div>
                <p className="text-[13px] font-semibold text-[#1d2327] m-0 mb-1">Your optimization score</p>
                <p className="text-[11px] text-[#5f6368] m-0 leading-relaxed px-4">
                  Increase your score by applying the recommendations in your Google Ads account.
                </p>
             </div>
             <div className="border-t border-[#ccd0d4] px-4 py-3 text-[12px] font-semibold text-[#1a73e8] hover:underline cursor-pointer text-center bg-[#f8f9fa]">
                <a href={`https://ads.google.com/aw/recommendations?ocid=${config.googleAdsAccountId}`} target="_blank">View all recommendations &rarr;</a>
             </div>
          </div>

          {/* Campaigns Table Card */}
          <div className="md:col-span-2 bg-white border border-[#ccd0d4] rounded-[3px] shadow-sm flex flex-col overflow-hidden">
             <div className="border-b border-[#ccd0d4] px-4 py-3 flex items-center justify-between bg-[#f8f9fa]">
                <div className="flex items-center gap-2">
                   <span className="text-[#5f6368]">📊</span>
                   <h3 className="text-[14px] font-semibold text-[#1d2327] m-0">Campaigns</h3>
                </div>
             </div>
             
             <div className="p-4 border-b border-[#ccd0d4]">
                <p className="text-[13px] font-semibold text-[#1d2327] m-0">Summary of how your campaigns are performing</p>
             </div>

             <div className="overflow-x-auto flex-1 w-full">
               <table className="w-full text-left text-[12px] min-w-[500px]">
                 <thead className="bg-[#f1f3f4] text-[#5f6368] border-b border-[#ccd0d4]">
                   <tr>
                     <th className="py-2.5 px-4 font-semibold">Campaign Name</th>
                     <th className="py-2.5 px-4 font-semibold text-right">Cost</th>
                     <th className="py-2.5 px-4 font-semibold text-right">Clicks</th>
                     <th className="py-2.5 px-4 font-semibold text-right">Purchases</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-[#f0f0f0]">
                   {metrics.campaigns.length > 0 ? metrics.campaigns.map((camp) => (
                     <tr key={camp.id} className="hover:bg-[#f8f9fa] transition-colors">
                       <td className="py-3.5 px-4 flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${camp.status === 'ENABLED' ? 'bg-[#34a853]' : 'bg-[#9aa0a6]'}`}></div>
                          <a href={`https://ads.google.com/aw/campaigns?ocid=${config.googleAdsAccountId}`} target="_blank" className="text-[#1a73e8] hover:underline font-medium block truncate max-w-[150px] md:max-w-[250px]">{camp.name}</a>
                       </td>
                       <td className="py-3.5 px-4 text-right text-[#3c4043]">${camp.cost}</td>
                       <td className="py-3.5 px-4 text-right text-[#3c4043]">{camp.clicks.toLocaleString()}</td>
                       <td className="py-3.5 px-4 text-right text-[#3c4043]">{camp.conversions}</td>
                     </tr>
                   )) : (
                     <tr>
                       <td colSpan={4} className="py-10 text-center text-[#5f6368] italic">No active campaigns found in the last 30 days.</td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
             <div className="border-t border-[#ccd0d4] px-4 py-3 text-[12px] font-semibold text-[#1a73e8] hover:underline cursor-pointer text-center bg-[#f8f9fa]">
                <a href={`https://ads.google.com/aw/campaigns?ocid=${config.googleAdsAccountId}`} target="_blank">All campaigns &rarr;</a>
             </div>
          </div>

        </div>
      )}

    </div>
  );
}