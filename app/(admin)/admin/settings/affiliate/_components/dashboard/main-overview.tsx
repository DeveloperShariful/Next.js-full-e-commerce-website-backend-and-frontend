//app/(admin)/admin/settings/affiliate/_components/dashboard/main-overview.tsx

"use client";

import { DashboardKPI, ChartDataPoint } from "@/app/actions/admin/settings/affiliates/types";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Users, MousePointer, TrendingUp, AlertCircle, Wallet } from "lucide-react";

interface Props {
  kpi: DashboardKPI;
  charts: ChartDataPoint[];
}

export default function MainOverview({ kpi, charts }: Props) {
  return (
    <div className="space-y-6">
      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <div className="p-4 bg-white border rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold">${kpi.revenue.toFixed(2)}</p>
          <span className="text-xs text-green-600 font-medium">From {kpi.conversions} Orders</span>
        </div>

        {/* Commission Card */}
        <div className="p-4 bg-white border rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Commission Paid</h3>
            <Wallet className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold">${kpi.commission.toFixed(2)}</p>
          <span className="text-xs text-gray-400">Pending: ${kpi.payoutsPending.toFixed(2)}</span>
        </div>

        {/* Clicks Card */}
        <div className="p-4 bg-white border rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Visits</h3>
            <MousePointer className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold">{kpi.clicks}</p>
          <span className="text-xs text-blue-600 font-medium pb-1 border-b border-dashed border-blue-200">
            {kpi.conversionRate.toFixed(1)}% Conversion Rate
          </span>
        </div>

        {/* Affiliates Status Card */}
        <div className="p-4 bg-white border rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Active Partners</h3>
            <Users className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold">{kpi.activeAffiliates}</p>
          {kpi.pendingApprovals > 0 && (
            <div className="mt-1 flex items-center gap-1 text-xs text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded w-fit">
              <AlertCircle className="w-3 h-3" />
              {kpi.pendingApprovals} Pending Approval
            </div>
          )}
        </div>
      </div>

      {/* CHART SECTION */}
      <div className="bg-white border rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-6">Performance Trend</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={charts}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2271b1" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#2271b1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} tickFormatter={(val) => `$${val}`} />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#2271b1" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
              <Area type="monotone" dataKey="commission" stroke="#10b981" fill="none" strokeWidth={2} name="Commission" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}