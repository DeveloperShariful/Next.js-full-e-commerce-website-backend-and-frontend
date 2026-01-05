//app/(admin)/admin/analytics/_components/product-insights-widget.tsx

"use client";

import { useState } from "react";
import { TopProductMetric, InventoryHealthMetric, CategoryPerformanceMetric } from "@/app/actions/admin/analytics/types";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { AlertTriangle, TrendingUp, Package, Layers } from "lucide-react";

interface ProductInsightsProps {
  topProducts: TopProductMetric[];
  inventory: InventoryHealthMetric[];
  categories: CategoryPerformanceMetric[];
}

export function ProductInsightsWidget({ topProducts, inventory, categories }: ProductInsightsProps) {
  const [activeTab, setActiveTab] = useState<"products" | "inventory" | "categories">("products");
  const { formatPrice } = useGlobalStore();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[400px]">
      
      {/* Header Tabs */}
      <div className="flex border-b border-slate-100">
        <button
          onClick={() => setActiveTab("products")}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
            activeTab === "products" ? "bg-white text-blue-600 border-b-2 border-blue-600" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
          }`}
        >
          <TrendingUp size={14} /> Top Sellers
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
            activeTab === "categories" ? "bg-white text-purple-600 border-b-2 border-purple-600" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
          }`}
        >
          <Layers size={14} /> Categories
        </button>
        <button
          onClick={() => setActiveTab("inventory")}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
            activeTab === "inventory" ? "bg-white text-orange-600 border-b-2 border-orange-600" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
          }`}
        >
          <AlertTriangle size={14} /> Low Stock
          {inventory.length > 0 && (
            <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full text-[10px]">{inventory.length}</span>
          )}
        </button>
      </div>

      {/* Content Area */}
      <div className="p-0 flex-1 overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-slate-200">
        
        {/* --- TAB: TOP PRODUCTS --- */}
        {activeTab === "products" && (
          <div className="divide-y divide-slate-50">
            {topProducts.length === 0 ? (
               <EmptyState text="No sales data available." />
            ) : (
              topProducts.map((product, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                      #{i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700 line-clamp-1" title={product.name}>{product.name}</p>
                      <p className="text-xs text-slate-400">{product.quantitySold} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800">{formatPrice(product.revenue)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- TAB: CATEGORIES --- */}
        {activeTab === "categories" && (
          <div className="p-4 space-y-4">
             {categories.length === 0 ? (
               <EmptyState text="No category data available." />
             ) : (
                categories.map((cat, i) => (
                   <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                         <span className="font-bold text-slate-700">{cat.name}</span>
                         <span className="text-slate-500">{formatPrice(cat.revenue)} ({cat.percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                         <div 
                           className="bg-purple-500 h-2 rounded-full" 
                           style={{ width: `${cat.percentage}%` }}
                         ></div>
                      </div>
                   </div>
                ))
             )}
          </div>
        )}

        {/* --- TAB: INVENTORY ALERTS --- */}
        {activeTab === "inventory" && (
          <div className="divide-y divide-slate-50">
            {inventory.length === 0 ? (
               <div className="p-8 text-center">
                  <Package size={32} className="mx-auto text-emerald-300 mb-2"/>
                  <p className="text-sm text-slate-500">Inventory looks healthy!</p>
               </div>
            ) : (
              inventory.map((item, i) => (
                <div key={i} className="p-4 flex items-center gap-4 hover:bg-orange-50/30 transition">
                  <div className="w-10 h-10 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                    {item.image ? (
                       <img src={item.image} alt="" className="w-full h-full object-cover"/>
                    ) : (
                       <Package className="w-full h-full p-2 text-slate-300"/>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate">{item.name}</p>
                    <p className="text-xs text-slate-400">SKU: {item.sku || "N/A"}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-bold ${
                    item.stock === 0 ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                  }`}>
                    {item.stock} left
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
      
      <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
        <button className="text-xs font-bold text-blue-600 hover:underline">
           View All Reports
        </button>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
   return (
      <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-xs">
         <p>{text}</p>
      </div>
   );
}