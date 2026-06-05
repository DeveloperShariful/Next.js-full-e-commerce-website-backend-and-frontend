// File: app/(backend)/admin/affiliate/_components/analytics-dashboard.tsx

"use client";

import { useState } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  Users, ShoppingBag, Globe,
  DollarSign, Wallet, MousePointer, AlertCircle, ArrowUpRight 
} from "lucide-react";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { DashboardKPI, ChartDataPoint } from "@/app/actions/backend/affiliate/types";

interface Props {
  kpi: DashboardKPI;
  charts: ChartDataPoint[];
  topProducts?: { name: string; revenue: number; sales: number }[];
  trafficSources?: { source: string; visits: number }[];
  topAffiliates?: { name: string; earnings: number; slug: string }[];
  monthlyStats?: { month: string; revenue: number; commission: number }[];
}

// WooCommerce Style Colors
const COLORS = ['#2271b1', '#00a0d2', '#d63638', '#f0b849', '#72aee6'];

export default function AnalyticsDashboard({ 
  kpi, 
  charts, 
  topProducts = [], 
  trafficSources = [], 
  topAffiliates = [], 
}: Props) {
  const { formatPrice } = useGlobalStore();
  const [dateRange, setDateRange] = useState("Last 30 Days");

  return (
    <div className="space-y-6 text-[#1d2327] font-sans">
      
      {/* 1. WP STYLE KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* WP Metabox Style Card */}
        <div className="bg-white border border-[#c3c4c7] shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[13px] font-semibold text-[#50575e]">Total Revenue</h3>
            <DollarSign className="w-4 h-4 text-[#2271b1]" />
          </div>
          <p className="text-[24px] font-normal text-[#1d2327] leading-none mb-2">{formatPrice(kpi.revenue)}</p>
          <div className="text-[12px] text-[#00a32a] flex items-center gap-1">
             <ArrowUpRight className="w-3 h-3" /> {kpi.conversions} Orders
          </div>
        </div>

        <div className="bg-white border border-[#c3c4c7] shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[13px] font-semibold text-[#50575e]">Commission Paid</h3>
            <Wallet className="w-4 h-4 text-[#2271b1]" />
          </div>
          <p className="text-[24px] font-normal text-[#1d2327] leading-none mb-2">{formatPrice(kpi.commission)}</p>
          <div className="text-[12px] text-[#50575e]">
             <span className="text-[#d63638] font-semibold">{formatPrice(kpi.payoutsPending)}</span> pending
          </div>
        </div>

        <div className="bg-white border border-[#c3c4c7] shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[13px] font-semibold text-[#50575e]">Total Visits</h3>
            <MousePointer className="w-4 h-4 text-[#2271b1]" />
          </div>
          <p className="text-[24px] font-normal text-[#1d2327] leading-none mb-2">{kpi.clicks.toLocaleString()}</p>
          <div className="text-[12px] text-[#2271b1] font-semibold">
             {kpi.conversionRate.toFixed(2)}% Conv. Rate
          </div>
        </div>

        <div className="bg-white border border-[#c3c4c7] shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[13px] font-semibold text-[#50575e]">Active Partners</h3>
            <Users className="w-4 h-4 text-[#2271b1]" />
          </div>
          <p className="text-[24px] font-normal text-[#1d2327] leading-none mb-2">{kpi.activeAffiliates}</p>
          {kpi.pendingApprovals > 0 ? (
            <div className="text-[12px] text-[#d63638] font-semibold flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {kpi.pendingApprovals} pending apps
            </div>
          ) : (
            <p className="text-[12px] text-[#50575e]">All processed</p>
          )}
        </div>
      </div>

      {/* 2. MAIN TREND CHART (WP Metabox Style) */}
      <div className="bg-white border border-[#c3c4c7] shadow-sm">
        <div className="border-b border-[#c3c4c7] px-4 py-3 flex items-center justify-between bg-white">
          <h3 className="text-[14px] font-semibold text-[#1d2327] m-0">Performance Trend</h3>
          <select 
            className="text-[13px] border border-[#8c8f94] rounded-[3px] px-2 py-1 bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
              <option>This Year</option>
          </select>
        </div>
        <div className="p-4 h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={charts} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dcdcde" />
              <XAxis dataKey="date" axisLine={{ stroke: '#8c8f94' }} tickLine={false} tick={{fontSize: 12, fill: '#50575e'}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#50575e'}} tickFormatter={(val) => `${val}`} />
              <Tooltip contentStyle={{ border: '1px solid #c3c4c7', borderRadius: '3px', boxShadow: '0 1px 1px rgba(0,0,0,0.04)', fontSize: '13px' }} formatter={(value: any) => [formatPrice(value), ""]} />
              <Area type="monotone" dataKey="revenue" stroke="#2271b1" strokeWidth={2} fillOpacity={0.1} fill="#2271b1" name="Revenue" activeDot={{ r: 4 }} />
              <Area type="monotone" dataKey="commission" stroke="#00a32a" strokeWidth={2} fillOpacity={0.1} fill="#00a32a" name="Commission" activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. DETAILED REPORTS (WP List Table Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Affiliates Table */}
        <div className="bg-white border border-[#c3c4c7] shadow-sm">
            <div className="border-b border-[#c3c4c7] px-4 py-3 bg-white">
                <h3 className="text-[14px] font-semibold text-[#1d2327] m-0 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#50575e]" /> Top Performers
                </h3>
            </div>
            <table className="w-full text-[13px] text-left border-collapse">
                <thead className="bg-[#f0f0f1] border-b border-[#c3c4c7]">
                    <tr>
                        <th className="px-4 py-2 font-semibold text-[#2c3338]">Affiliate</th>
                        <th className="px-4 py-2 font-semibold text-[#2c3338] text-right">Earnings</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#c3c4c7]">
                    {topAffiliates.length === 0 ? (
                        <tr><td colSpan={2} className="p-4 text-center text-[#50575e] italic">No data available</td></tr>
                    ) : (
                        topAffiliates.map((aff, i) => (
                            <tr key={i} className="hover:bg-[#f6f7f7]">
                                <td className="px-4 py-2">
                                    <div className="flex items-center gap-2">
                                        <div className="font-semibold text-[#2271b1] hover:underline cursor-pointer">{aff.name}</div>
                                        <div className="text-[11px] text-[#50575e]">(@{aff.slug})</div>
                                    </div>
                                </td>
                                <td className="px-4 py-2 text-right font-medium text-[#1d2327]">
                                    {formatPrice(aff.earnings)}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>

        {/* Traffic Sources Pie Chart */}
        <div className="bg-white border border-[#c3c4c7] shadow-sm flex flex-col">
            <div className="border-b border-[#c3c4c7] px-4 py-3 bg-white">
                <h3 className="text-[14px] font-semibold text-[#1d2327] m-0 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#50575e]" /> Traffic Sources
                </h3>
            </div>
            <div className="flex-1 flex items-center justify-center min-h-[250px] p-4">
                {trafficSources.length === 0 ? (
                    <div className="text-[#50575e] text-[13px] italic">No traffic data recorded</div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={trafficSources}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={2}
                                dataKey="visits"
                                nameKey="source"
                                label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                                labelLine={true}
                                style={{ fontSize: '11px', fill: '#50575e' }}
                            >
                                {trafficSources.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ fontSize: '13px', borderRadius: '3px', border: '1px solid #c3c4c7' }}/>
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
      </div>

      {/* Top Products Table (WP Style) */}
      <div className="bg-white border border-[#c3c4c7] shadow-sm">
         <div className="border-b border-[#c3c4c7] px-4 py-3 bg-white">
            <h3 className="text-[14px] font-semibold text-[#1d2327] m-0 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#50575e]" /> Products Sold via Links
            </h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-[13px] text-left border-collapse">
                <thead className="bg-[#f0f0f1] border-b border-[#c3c4c7]">
                    <tr>
                        <th className="px-4 py-2 font-semibold text-[#2c3338]">Product Name</th>
                        <th className="px-4 py-2 font-semibold text-[#2c3338] text-center">Units Sold</th>
                        <th className="px-4 py-2 font-semibold text-[#2c3338] text-right">Revenue Generated</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0f1]">
                    {topProducts.length === 0 ? (
                        <tr><td colSpan={3} className="p-4 text-center text-[#50575e] italic">No sales recorded yet</td></tr>
                    ) : (
                        topProducts.map((prod, i) => (
                            <tr key={i} className="hover:bg-[#f6f7f7] transition-colors">
                                <td className="px-4 py-2 font-medium text-[#2271b1] hover:underline cursor-pointer">{prod.name}</td>
                                <td className="px-4 py-2 text-center text-[#1d2327]">
                                    {prod.sales}
                                </td>
                                <td className="px-4 py-2 text-right font-medium text-[#1d2327]">
                                    {formatPrice(prod.revenue)}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
         </div>
      </div>

    </div>
  );
}