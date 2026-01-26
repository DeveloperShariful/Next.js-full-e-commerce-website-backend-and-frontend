//app/(admin)/admin/settings/affiliate/reports/_components/reports-dashboard.tsx

"use client";

import { useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Legend 
} from 'recharts';
import { Calendar, Filter, Download } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock Data Structure matching "Solid Affiliate" Image 6 & 7
interface ReportStats {
  period: string;
  referrals: number;
  referralAmount: number;
  commissionAmount: number;
  netRevenue: number;
  signups: number;
  visits: number;
  conversionRate: number;
}

const MOCK_SUMMARY: ReportStats[] = [
  { period: "All Time", referrals: 124, referralAmount: 15420.00, commissionAmount: 1542.00, netRevenue: 13878.00, signups: 45, visits: 2300, conversionRate: 5.4 },
  { period: "This Year", referrals: 45, referralAmount: 5128.19, commissionAmount: 139.70, netRevenue: 4988.49, signups: 12, visits: 850, conversionRate: 5.2 },
  { period: "Last Year", referrals: 79, referralAmount: 10291.81, commissionAmount: 1402.30, netRevenue: 8889.51, signups: 33, visits: 1450, conversionRate: 5.5 },
  { period: "This Month", referrals: 8, referralAmount: 1250.00, commissionAmount: 125.00, netRevenue: 1125.00, signups: 2, visits: 17, conversionRate: 47.06 },
];

const MOCK_CHART_DAILY = [
  { date: "Jan 20", visits: 14, conversions: 2, revenue: 200 },
  { date: "Jan 21", visits: 25, conversions: 5, revenue: 500 },
  { date: "Jan 22", visits: 18, conversions: 3, revenue: 300 },
  { date: "Jan 23", visits: 30, conversions: 8, revenue: 800 },
  { date: "Jan 24", visits: 22, conversions: 4, revenue: 400 },
];

interface Props {
  topProducts?: any;
  trafficSources?: any;
  topAffiliates?: any;
  monthlyStats?: any;
}

export default function ReportsDashboard({ }: Props) {
  const [dateRange, setDateRange] = useState("This Month");
  const [activeTab, setActiveTab] = useState("Overview");

  const TABS = ["Overview", "Affiliates", "Referrals", "Payouts", "Visits", "Coupons"];

  return (
    <div className="space-y-6">
      
      {/* 1. TOP HEADER & FILTERS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
         <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">Affiliate Reports</h2>
         </div>
         <div className="flex gap-2">
            <div className="relative">
                <select 
                    className="appearance-none bg-gray-50 border border-gray-300 text-gray-700 py-2 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                >
                    <option>This Month</option>
                    <option>Last Month</option>
                    <option>This Year</option>
                    <option>All Time</option>
                </select>
                <Calendar className="w-4 h-4 text-gray-500 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                <Filter className="w-4 h-4" /> Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                <Download className="w-4 h-4" /> Export
            </button>
         </div>
      </div>

      {/* 2. TABS */}
      <div className="border-b border-gray-200">
         <nav className="-mb-px flex space-x-6 overflow-x-auto">
            {TABS.map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                        "whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors",
                        activeTab === tab
                            ? "border-black text-black"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    )}
                >
                    {tab}
                </button>
            ))}
         </nav>
      </div>

      {/* 3. SUMMARY DATA GRID (Matching Image 6 Table) */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b text-gray-500 uppercase text-xs font-semibold">
                    <tr>
                        <th className="px-6 py-4">Metric</th>
                        <th className="px-6 py-4">All Time</th>
                        <th className="px-6 py-4">This Year</th>
                        <th className="px-6 py-4">Last Year</th>
                        <th className="px-6 py-4 bg-purple-50 text-purple-900 border-b-purple-100">
                            {dateRange} <span className="text-[10px] bg-purple-200 px-1.5 py-0.5 rounded text-purple-800 ml-1">Current</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    <tr>
                        <td className="px-6 py-4 font-medium text-gray-900">Referrals</td>
                        {MOCK_SUMMARY.map((s, i) => <td key={i} className={cn("px-6 py-4", i === 3 && "bg-purple-50/30")}>{s.referrals}</td>)}
                    </tr>
                    <tr>
                        <td className="px-6 py-4 font-medium text-gray-900">Referral Amount</td>
                        {MOCK_SUMMARY.map((s, i) => <td key={i} className={cn("px-6 py-4 text-gray-600", i === 3 && "bg-purple-50/30")}>${s.referralAmount.toLocaleString()}</td>)}
                    </tr>
                    <tr>
                        <td className="px-6 py-4 font-medium text-gray-900">Commission Amount</td>
                        {MOCK_SUMMARY.map((s, i) => <td key={i} className={cn("px-6 py-4 text-gray-600", i === 3 && "bg-purple-50/30")}>${s.commissionAmount.toLocaleString()}</td>)}
                    </tr>
                    <tr>
                        <td className="px-6 py-4 font-medium text-gray-900">Net Revenue</td>
                        {MOCK_SUMMARY.map((s, i) => <td key={i} className={cn("px-6 py-4 font-bold text-green-600", i === 3 && "bg-purple-50/30")}>${s.netRevenue.toLocaleString()}</td>)}
                    </tr>
                    <tr className="bg-gray-50/50">
                        <td className="px-6 py-4 font-medium text-gray-900">Visits</td>
                        {MOCK_SUMMARY.map((s, i) => <td key={i} className={cn("px-6 py-4", i === 3 && "bg-purple-50/30")}>{s.visits}</td>)}
                    </tr>
                    <tr>
                        <td className="px-6 py-4 font-medium text-gray-900">Conversion Rate</td>
                        {MOCK_SUMMARY.map((s, i) => <td key={i} className={cn("px-6 py-4 text-blue-600", i === 3 && "bg-purple-50/30")}>{s.conversionRate}%</td>)}
                    </tr>
                </tbody>
            </table>
         </div>
      </div>

      {/* 4. CHARTS GRID (Matching Image 7) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Daily Revenue */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 mb-6 uppercase tracking-wider text-center">Affiliate Orders & Commissions (Daily)</h3>
            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MOCK_CHART_DAILY}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 11}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11}} />
                        <Tooltip />
                        <Legend wrapperStyle={{fontSize: '12px'}} />
                        <Bar dataKey="revenue" name="Order Amount" fill="#C4B5FD" radius={[4, 4, 0, 0]} barSize={30} />
                        <Bar dataKey="conversions" name="Commission" fill="#FDBA74" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Chart 2: Daily Visits */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 mb-6 uppercase tracking-wider text-center">Visits & Conversions (Daily)</h3>
            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MOCK_CHART_DAILY}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 11}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11}} />
                        <Tooltip />
                        <Legend wrapperStyle={{fontSize: '12px'}} />
                        <Area type="monotone" dataKey="visits" name="Total Visits" stroke="#FDE68A" fill="#FEF3C7" />
                        <Area type="monotone" dataKey="conversions" name="Converted" stroke="#93C5FD" fill="#BFDBFE" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Chart 3: Signups */}
        <div className="bg-white p-6 rounded-xl border shadow-sm lg:col-span-2">
             <h3 className="text-sm font-semibold text-gray-500 mb-6 uppercase tracking-wider text-center">Affiliate Signups (Monthly)</h3>
             <div className="h-[200px] w-full flex items-center justify-center border-2 border-dashed border-gray-100 rounded-lg">
                <p className="text-gray-400 text-sm">No new signups in this period</p>
             </div>
        </div>

      </div>
    </div>
  );
}