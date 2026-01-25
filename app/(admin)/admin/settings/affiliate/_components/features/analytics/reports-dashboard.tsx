//app/(admin)/admin/settings/affiliate/_components/features/analytics/reports-dashboard.tsx

"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, ShoppingBag, Globe, Users } from "lucide-react";

interface Props {
  topProducts: { name: string; revenue: number; sales: number }[];
  trafficSources: { source: string; visits: number }[];
  topAffiliates: { name: string; earnings: number; avatar: string | null }[];
  monthlyStats: { month: string; revenue: number; commission: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ReportsDashboard({ topProducts, trafficSources, topAffiliates, monthlyStats }: Props) {
  return (
    <div className="space-y-6">
      
      {/* Row 1: Monthly Trends (Bar Chart) */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Revenue vs Commission (6 Months)
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyStats}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} tickFormatter={(val) => `$${val}`} />
              <Tooltip 
                cursor={{ fill: '#f3f4f6' }}
                formatter={(value: any) => [`$${Number(value).toFixed(2)}`, ""]}
              />
              <Legend />
              <Bar dataKey="revenue" name="Total Revenue" fill="#2271b1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="commission" name="Commission Paid" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Traffic & Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Traffic Sources (Pie Chart) */}
        <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-purple-600" />
            Traffic Sources
          </h3>
          <div className="h-[300px] w-full flex-1">
            {trafficSources.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trafficSources}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="visits"
                    nameKey="source"
                  >
                    {trafficSources.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                No traffic data available.
              </div>
            )}
          </div>
        </div>

        {/* Top Products (List) */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-orange-600" />
            Top Affiliate Products
          </h3>
          <div className="overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-2">Product</th>
                  <th className="px-4 py-2 text-right">Sales</th>
                  <th className="px-4 py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topProducts.map((p, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-[200px]">{p.name}</td>
                    <td className="px-4 py-3 text-right">{p.sales}</td>
                    <td className="px-4 py-3 text-right font-mono text-green-600">${p.revenue.toLocaleString()}</td>
                  </tr>
                ))}
                {topProducts.length === 0 && (
                  <tr><td colSpan={3} className="p-4 text-center text-gray-400">No sales data.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 3: Top Performers */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          Top Performing Partners
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {topAffiliates.map((aff, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg border flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold mb-3 overflow-hidden">
                {aff.avatar ? <img src={aff.avatar} alt="" className="w-full h-full object-cover" /> : aff.name.charAt(0)}
              </div>
              <h4 className="font-medium text-gray-900 text-sm truncate w-full">{aff.name}</h4>
              <p className="text-xs text-green-600 font-bold mt-1">${aff.earnings.toLocaleString()} Earned</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}