//app/(admin)/admin/settings/affiliate/_components/Analytics/reports-dashboard.tsx

"use client";

import { useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { Calendar, Filter, Download, TrendingUp, Users, ShoppingBag, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobalStore } from "@/app/providers/global-store-provider";

// Data Types passed from Server
interface Props {
  topProducts: { name: string; revenue: number; sales: number }[];
  trafficSources: { source: string; visits: number }[];
  topAffiliates: { name: string; earnings: number; slug: string }[];
  monthlyStats: { month: string; revenue: number; commission: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ReportsDashboard({ topProducts, trafficSources, topAffiliates, monthlyStats }: Props) {
  const { formatPrice } = useGlobalStore();
  const [dateRange, setDateRange] = useState("Last 6 Months");

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      
      {/* 1. TOP HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
         <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <TrendingUp className="w-5 h-5" />
            </div>
            <div>
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Advanced Analytics</h2>
                <p className="text-xs text-gray-500">Deep dive into performance metrics.</p>
            </div>
         </div>
         <div className="flex gap-2">
            <div className="relative">
                <select 
                    className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-3 pr-8 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-black/5 cursor-pointer"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                >
                    <option>Last 6 Months</option>
                    <option>This Year</option>
                    <option>All Time</option>
                </select>
                <Calendar className="w-3 h-3 text-gray-500 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50">
                <Download className="w-3 h-3" /> Export PDF
            </button>
         </div>
      </div>

      {/* 2. MAIN CHART (Monthly Revenue vs Commission) */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider flex items-center gap-2">
            Revenue vs Commission Trend
        </h3>
        <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#6b7280'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#6b7280'}} tickFormatter={(val) => `${val}`} />
                    <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        // 🔥 FIX 1: Type change to 'any' to handle recharts ValueType
                        formatter={(value: any) => [formatPrice(Number(value)), ""]}
                    />
                    <Legend wrapperStyle={{paddingTop: '20px'}} iconType="circle" />
                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" name="Total Revenue" />
                    <Area type="monotone" dataKey="commission" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorComm)" name="Commission Paid" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 3. TOP AFFILIATES */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" /> Top Performers
                </h3>
            </div>
            <div className="p-2">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase">
                        <tr>
                            <th className="px-4 py-3 rounded-l-lg">Affiliate</th>
                            <th className="px-4 py-3 text-right rounded-r-lg">Earnings</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {topAffiliates.length === 0 ? (
                            <tr><td colSpan={2} className="p-6 text-center text-gray-400 text-xs">No data available</td></tr>
                        ) : (
                            topAffiliates.map((aff, i) => (
                                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                                                i === 0 ? "bg-yellow-400" : i === 1 ? "bg-gray-400" : i === 2 ? "bg-orange-400" : "bg-blue-100 text-blue-600"
                                            }`}>
                                                {i + 1}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">{aff.name}</div>
                                                <div className="text-[10px] text-gray-400">@{aff.slug}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-green-600">
                                        {formatPrice(aff.earnings)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* 4. TRAFFIC SOURCES */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4 text-pink-500" /> Traffic Sources
                </h3>
            </div>
            <div className="flex-1 flex items-center justify-center min-h-[300px] p-4">
                {trafficSources.length === 0 ? (
                    <div className="text-gray-400 text-xs">No traffic data recorded</div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={trafficSources}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="visits"
                                nameKey="source"
                                // 🔥 FIX 2: Added fallback (percent || 0) to avoid 'undefined' error
                                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                labelLine={false}
                            >
                                {trafficSources.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>

      </div>

      {/* 5. TOP PRODUCTS */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
         <div className="p-5 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-orange-500" /> Products Sold via Links
            </h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase">
                    <tr>
                        <th className="px-6 py-3">Product Name</th>
                        <th className="px-6 py-3 text-center">Units Sold</th>
                        <th className="px-6 py-3 text-right">Revenue Generated</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {topProducts.length === 0 ? (
                        <tr><td colSpan={3} className="p-8 text-center text-gray-400 text-xs">No sales recorded yet</td></tr>
                    ) : (
                        topProducts.map((prod, i) => (
                            <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900">{prod.name}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">{prod.sales}</span>
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-gray-700">
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