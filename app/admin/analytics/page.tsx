// app/admin/analytics/page.tsx

"use client";

import { useState, useEffect } from "react";
import { getAnalyticsData, AnalyticsData } from "@/app/actions/analytics";
import { 
  BarChart3, Calendar, TrendingUp, ShoppingBag, 
  CreditCard, Undo2, Loader2, ArrowUpRight 
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar 
} from "recharts";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  const fetchData = async () => {
    setLoading(true);
    const res = await getAnalyticsData(period);
    if (res.success && res.data) {
      setData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency', currency: 'BDT', minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading && !data) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#F0F0F1]">
        <Loader2 className="animate-spin text-blue-600 mb-2" size={40}/>
        <p className="text-slate-500 font-medium">Crunching the numbers...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1920px] mx-auto min-h-screen bg-[#F0F0F1] font-sans text-slate-800">
      
      {/* HEADER & FILTERS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="text-blue-600" /> Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">Overview of your store performance.</p>
        </div>
        
        <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex">
           {[
             { label: "Last 7 Days", val: "7d" },
             { label: "Last 30 Days", val: "30d" },
             { label: "Last 90 Days", val: "90d" },
             { label: "This Year", val: "year" },
           ].map((p) => (
             <button
               key={p.val}
               onClick={() => setPeriod(p.val)}
               className={`px-4 py-1.5 text-xs font-bold rounded-md transition ${
                 period === p.val 
                   ? "bg-slate-900 text-white shadow-md" 
                   : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
               }`}
             >
               {p.label}
             </button>
           ))}
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
         {/* Total Sales */}
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Sales</p>
                  <h3 className="text-2xl font-bold text-slate-800">{formatPrice(data?.summary.revenue || 0)}</h3>
               </div>
               <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition">
                  <TrendingUp size={20}/>
               </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-green-600 font-bold">
               <ArrowUpRight size={14} className="mr-1"/> +12.5% <span className="text-slate-400 font-normal ml-1">vs last period</span>
            </div>
         </div>

         {/* Orders */}
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Orders</p>
                  <h3 className="text-2xl font-bold text-slate-800">{data?.summary.orders || 0}</h3>
               </div>
               <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition">
                  <ShoppingBag size={20}/>
               </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-slate-400">
               Avg. items per order: <strong className="text-slate-600 ml-1">1.2</strong>
            </div>
         </div>

         {/* AOV */}
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Avg. Order Value</p>
                  <h3 className="text-2xl font-bold text-slate-800">{formatPrice(data?.summary.aov || 0)}</h3>
               </div>
               <div className="p-2 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition">
                  <CreditCard size={20}/>
               </div>
            </div>
         </div>

         {/* Returns */}
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Refunded</p>
                  <h3 className="text-2xl font-bold text-slate-800">{formatPrice(data?.summary.refunded || 0)}</h3>
               </div>
               <div className="p-2 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-600 group-hover:text-white transition">
                  <Undo2 size={20}/>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* MAIN CHART */}
         <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-lg text-slate-800 mb-6">Sales Overview</h3>
            <div className="h-[350px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.chartData}>
                     <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                           <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                     <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 12, fill: '#64748b'}} 
                        dy={10}
                     />
                     <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 12, fill: '#64748b'}} 
                        tickFormatter={(value) => `৳${value}`}
                     />
                     <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => formatPrice(value)}
                     />
                     <Area 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="#2563eb" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorSales)" 
                     />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* TOP PRODUCTS */}
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-lg text-slate-800 mb-6">Top Selling Products</h3>
            <div className="space-y-6">
               {data?.topProducts.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-10">No sales data yet.</p>
               ) : (
                  data?.topProducts.map((product, i) => (
                     <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3 overflow-hidden">
                           <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500 flex-shrink-0">
                              {i + 1}
                           </div>
                           <div className="truncate">
                              <p className="text-sm font-bold text-slate-700 truncate group-hover:text-blue-600 transition" title={product.name}>{product.name}</p>
                              <p className="text-xs text-slate-400">{product.quantity} sold</p>
                           </div>
                        </div>
                        <div className="text-sm font-bold text-slate-800 whitespace-nowrap">
                           {formatPrice(product.sales)}
                        </div>
                     </div>
                  ))
               )}
            </div>
            
            {/* View Report Button */}
            <div className="mt-8 pt-4 border-t border-slate-100">
               <button className="w-full py-2 bg-slate-50 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-100 transition">
                  View Full Report
               </button>
            </div>
         </div>

      </div>
    </div>
  );
}