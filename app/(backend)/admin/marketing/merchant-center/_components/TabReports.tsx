//app/(backend)/admin/marketing/merchant-center/_components/TabReports.tsx

"use client";

import { useEffect, useState } from "react";
import { fetchGmcReportsData, GmcReportData } from "@/app/actions/backend/merchant-center/gmc-reports.actions";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";

export default function TabReports() {
  const [activeSubTab, setActiveSubTab] = useState<"programs" | "products">("programs");
  const [reportData, setReportData] = useState<GmcReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetchGmcReportsData().then((res) => {
      if (res.success && res.data) {
        setReportData(res.data);
      }
      setIsLoading(false);
    });
  }, []);

  const currentMonth = new Date().toLocaleString('en-US', { month: 'short' });
  const currentYear = new Date().getFullYear();

  return (
    <div className=" animate-in fade-in duration-300">
      
      {/* 🚀 SUB-TABS */}
      <div className="flex border-b border-[#ccd0d4] mb-6 overflow-x-auto whitespace-nowrap">
        <button 
          onClick={() => setActiveSubTab("programs")}
          className={`px-4 py-2 text-[13px] font-semibold border-b-2 transition-colors ${activeSubTab === "programs" ? "border-[#2271b1] text-[#1d2327]" : "border-transparent text-[#50575e] hover:text-[#2271b1]"}`}
        >
          Programs
        </button>
        <div className="w-[1px] h-4 bg-[#ccd0d4] my-auto mx-2"></div>
        <button 
          onClick={() => setActiveSubTab("products")}
          className={`px-4 py-2 text-[13px] font-semibold border-b-2 transition-colors ${activeSubTab === "products" ? "border-[#2271b1] text-[#1d2327]" : "border-transparent text-[#50575e] hover:text-[#2271b1]"}`}
        >
          Products
        </button>
      </div>

      {/* 🚀 RESPONSIVE FILTERS */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-auto">
          <label className="block text-[12px] text-[#646970] mb-1">Date range:</label>
          <select className="w-full border border-[#8c8f94] rounded-[3px] px-3 py-1.5 text-[13px] bg-white min-w-[250px] focus:outline-none focus:border-[#2271b1] cursor-pointer">
            <option>Last 30 days (Auto Synced)</option>
            <option>Month to date ({currentMonth} 1 - {new Date().getDate()}, {currentYear})</option>
          </select>
        </div>
        <div className="w-full sm:w-auto">
          <label className="block text-[12px] text-[#646970] mb-1">Show:</label>
          <select className="w-full border border-[#8c8f94] rounded-[3px] px-3 py-1.5 text-[13px] bg-white min-w-[200px] focus:outline-none focus:border-[#2271b1] cursor-pointer">
            <option>{activeSubTab === "programs" ? "All Google programs" : "All Products"}</option>
          </select>
        </div>
      </div>

      {/* 🚀 RESPONSIVE DATA BOXES & CHART */}
      <div className="bg-white border border-[#ccd0d4] rounded-[3px] overflow-hidden mb-6 shadow-sm">
        
        {/* Metric Boxes - Fixed for Mobile (Column to Row) */}
        <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-[#ccd0d4] border-b border-[#ccd0d4]">
          <div className="flex-1 p-6 relative">
             <p className="text-[14px] font-semibold text-[#1d2327] m-0 mb-3">Clicks</p>
             <p className="text-[28px] font-normal text-[#1d2327] m-0">{isLoading ? "..." : reportData?.totalClicks.toLocaleString()}</p>
             {!isLoading && reportData && reportData.totalClicks > 0 && (
               <span className="absolute bottom-6 right-6 bg-[#e6f4ea] text-[#137333] text-[11px] font-bold px-1.5 py-0.5 rounded-[3px]">Active</span>
             )}
          </div>
          <div className="flex-1 p-6 relative">
             <p className="text-[14px] font-semibold text-[#1d2327] m-0 mb-3">Impressions</p>
             <p className="text-[28px] font-normal text-[#1d2327] m-0">{isLoading ? "..." : reportData?.totalImpressions.toLocaleString()}</p>
             {!isLoading && reportData && reportData.totalImpressions > 0 && (
               <span className="absolute bottom-6 right-6 bg-[#e6f4ea] text-[#137333] text-[11px] font-bold px-1.5 py-0.5 rounded-[3px]">Active</span>
             )}
          </div>
        </div>

        {/* Line Chart */}
        <div className="p-0">
          <div className="px-6 py-3 border-b border-[#ccd0d4] flex items-center justify-between bg-[#f8f9fa]">
            <h3 className="text-[14px] font-semibold text-[#1d2327] m-0">Clicks & Impressions Overview</h3>
          </div>
          
          <div className="p-2 sm:p-6">
            {isLoading ? (
              <div className="h-[250px] flex items-center justify-center text-[#646970] text-[13px]">
                Loading Live Chart Data from Google...
              </div>
            ) : reportData && reportData.chartData.length > 0 ? (
              <div className="h-[250px] sm:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8eaed" />
                    <XAxis dataKey="date" tick={{ fill: "#5f6368", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#e8eaed" }} dy={10} />
                    <YAxis tick={{ fill: "#5f6368", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val} />
                    <Tooltip contentStyle={{ backgroundColor: "#3c4043", color: "#fff", borderRadius: "4px", fontSize: "12px", border: "none" }} itemStyle={{ color: "#fff" }} />
                    <Line type="monotone" dataKey="clicks" name="Clicks" stroke="#00887a" strokeWidth={2} dot={{ r: 3, fill: "#00887a", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="impressions" name="Impressions" stroke="#a0c2e8" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-[#646970] text-[13px] text-center p-4">
                No organic performance data found for the last 30 days.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🚀 TAB 1: PROGRAMS VIEW */}
      {activeSubTab === "programs" && (
        <div className="bg-white border border-[#ccd0d4] rounded-[3px] shadow-sm animate-in fade-in duration-300">
           <div className="px-6 py-4 border-b border-[#ccd0d4]">
             <h3 className="text-[14px] font-semibold text-[#1d2327] m-0">Programs</h3>
           </div>
           <div className="overflow-x-auto w-full">
             <table className="w-full text-left text-[13px] min-w-[500px]">
               <thead className="bg-[#f8f9fa] border-b border-[#ccd0d4]">
                 <tr>
                   <th className="py-3 px-6 font-semibold text-[#1d2327]">Program</th>
                   <th className="py-3 px-6 font-semibold text-[#1d2327] text-right">Clicks</th>
                   <th className="py-3 px-6 font-semibold text-[#1d2327] text-right">Impressions</th>
                 </tr>
               </thead>
               <tbody>
                 {isLoading ? (
                   <tr><td colSpan={3} className="py-8 text-center text-[#646970]">Loading...</td></tr>
                 ) : (
                   <tr className="hover:bg-[#f8f9fa] transition-colors border-b border-[#f0f0f0] last:border-0">
                     <td className="py-4 px-6 text-[#1d2327]">Product Feed (Organic Listings)</td>
                     <td className="py-4 px-6 text-[#3c4043] text-right">{reportData?.totalClicks.toLocaleString()}</td>
                     <td className="py-4 px-6 text-[#3c4043] text-right">{reportData?.totalImpressions.toLocaleString()}</td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {/* 🚀 TAB 2: PRODUCTS VIEW */}
      {activeSubTab === "products" && (
        <div className="bg-white border border-[#ccd0d4] rounded-[3px] shadow-sm animate-in fade-in duration-300">
           <div className="px-6 py-4 border-b border-[#ccd0d4]">
             <h3 className="text-[14px] font-semibold text-[#1d2327] m-0">Products Performance</h3>
           </div>
           <div className="overflow-x-auto w-full">
             <table className="w-full text-left text-[13px] min-w-[600px]">
               <thead className="bg-[#f8f9fa] border-b border-[#ccd0d4]">
                 <tr>
                   <th className="py-3 px-6 font-semibold text-[#1d2327]">Product Title (ID)</th>
                   <th className="py-3 px-6 font-semibold text-[#1d2327] text-right">Clicks</th>
                   <th className="py-3 px-6 font-semibold text-[#1d2327] text-right">Impressions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-[#f0f0f0]">
                 {isLoading ? (
                   <tr><td colSpan={3} className="py-8 text-center text-[#646970]">Loading...</td></tr>
                 ) : reportData && reportData.productData.length > 0 ? (
                   reportData.productData.map((prod, index) => (
                     <tr key={index} className="hover:bg-[#f8f9fa] transition-colors">
                       <td className="py-4 px-6">
                         <p className="text-[#1d2327] m-0 truncate max-w-[250px] sm:max-w-[400px]" title={prod.title}>{prod.title}</p>
                         <p className="text-[11px] text-[#646970] m-0 mt-0.5">ID: {prod.id}</p>
                       </td>
                       <td className="py-4 px-6 text-[#3c4043] text-right">{prod.clicks.toLocaleString()}</td>
                       <td className="py-4 px-6 text-[#3c4043] text-right">{prod.impressions.toLocaleString()}</td>
                     </tr>
                   ))
                 ) : (
                   <tr><td colSpan={3} className="py-8 text-center text-[#646970] p-4">No product clicks found in the last 30 days.</td></tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>
      )}

    </div>
  );
}