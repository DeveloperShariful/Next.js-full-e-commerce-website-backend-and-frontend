// File: app/(admin)/admin/settings/affiliate/_components/main-overview.tsx

"use client";

import { DashboardKPI, ChartDataPoint } from "@/app/actions/admin/settings/affiliates/types";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Users, MousePointer, Wallet, AlertCircle } from "lucide-react";
import { useGlobalStore } from "@/app/providers/global-store-provider";

interface Props {
  kpi: DashboardKPI;
  charts: ChartDataPoint[];
}

export default function MainOverview({ kpi, charts }: Props) {
  const { formatPrice, currency } = useGlobalStore();

  return (
    <div className="space-y-6">
      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Revenue Card */}
        <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Revenue</h3>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatPrice(kpi.revenue)}</p>
          <div className="flex items-center gap-2 mt-2">
             <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                {kpi.conversions} Orders
             </span>
             <span className="text-xs text-gray-400">generated via links</span>
          </div>
        </div>

        {/* Commission Card */}
        <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Commission Paid</h3>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatPrice(kpi.commission)}</p>
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
             <span className="text-orange-600 font-medium">{formatPrice(kpi.payoutsPending)}</span> pending approval
          </div>
        </div>

        {/* Clicks Card */}
        <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Visits</h3>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <MousePointer className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{kpi.clicks.toLocaleString()}</p>
          <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
             <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.min(kpi.conversionRate, 100)}%` }}></div>
          </div>
          <p className="text-xs text-indigo-600 font-medium mt-1 text-right">{kpi.conversionRate.toFixed(2)}% Conversion</p>
        </div>

        {/* Affiliates Status Card */}
        <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Partners</h3>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{kpi.activeAffiliates}</p>
          {kpi.pendingApprovals > 0 ? (
            <div className="mt-2 flex items-center gap-2 text-xs text-orange-700 font-bold bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 animate-pulse">
              <AlertCircle className="w-3 h-3" />
              {kpi.pendingApprovals} Waiting Review
            </div>
          ) : (
            <p className="mt-2 text-xs text-gray-400">All applications processed</p>
          )}
        </div>
      </div>

      {/* CHART SECTION */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Performance Trend</h3>
            <select className="text-xs border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                <option>Last 30 Days</option>
                <option>This Year</option>
            </select>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={charts} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2271b1" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#2271b1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#9ca3af'}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#9ca3af'}} tickFormatter={(val) => `${val}`} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: any) => [formatPrice(value), ""]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#2271b1" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
              <Area type="monotone" dataKey="commission" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorComm)" name="Commission" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}