//app/(admin)/admin/analytics/_components/brand-reputation-widget.tsx

"use client";

import { useState } from "react";
import { ReviewSummary, BrandPerformanceMetric } from "@/app/actions/admin/analytics/types";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { Star, MessageSquareWarning, Award, Briefcase } from "lucide-react";

interface BrandReputationProps {
  reviews: ReviewSummary;
  brands: BrandPerformanceMetric[];
}

export function BrandReputationWidget({ reviews, brands }: BrandReputationProps) {
  const [activeTab, setActiveTab] = useState<"reputation" | "brands">("reputation");
  const { formatPrice } = useGlobalStore();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      
      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        <button
          onClick={() => setActiveTab("reputation")}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
            activeTab === "reputation" ? "bg-white text-yellow-600 border-b-2 border-yellow-600" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
          }`}
        >
          <Star size={14} /> Reputation
        </button>
        <button
          onClick={() => setActiveTab("brands")}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
            activeTab === "brands" ? "bg-white text-slate-800 border-b-2 border-slate-800" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
          }`}
        >
          <Briefcase size={14} /> Brand Perf.
        </button>
      </div>

      <div className="p-6 flex-1 overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-slate-200">
        
        {/* --- TAB: REPUTATION --- */}
        {activeTab === "reputation" && (
          <div className="space-y-8">
             {/* 1. Overview */}
             <div className="flex items-center gap-6">
                <div className="text-center">
                   <div className="text-4xl font-black text-slate-800">{reviews.averageRating.toFixed(1)}</div>
                   <div className="flex items-center justify-center gap-0.5 text-yellow-400 my-1">
                      {[...Array(5)].map((_, i) => (
                         <Star key={i} size={12} fill={i < Math.round(reviews.averageRating) ? "currentColor" : "none"} />
                      ))}
                   </div>
                   <p className="text-[10px] text-slate-400 uppercase tracking-wide">{reviews.totalReviews} Reviews</p>
                </div>
                
                {/* Star Bars */}
                <div className="flex-1 space-y-1.5">
                   {reviews.ratingDistribution.map((item) => (
                      <div key={item.star} className="flex items-center gap-2 text-xs">
                         <span className="w-3 font-bold text-slate-500">{item.star}</span>
                         <Star size={10} className="text-slate-300"/>
                         <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-yellow-400 rounded-full" 
                              style={{ width: `${(item.count / reviews.totalReviews) * 100}%` }}
                            ></div>
                         </div>
                         <span className="text-[10px] text-slate-400 w-6 text-right">{item.count}</span>
                      </div>
                   ))}
                </div>
             </div>

             {/* 2. Negative Reviews Alert */}
             <div>
                <h4 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
                   <MessageSquareWarning size={16} className="text-red-500"/>
                   Needs Attention
                </h4>
                <div className="space-y-3">
                   {reviews.recentNegativeReviews.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No recent negative reviews. Keep it up!</p>
                   ) : (
                      reviews.recentNegativeReviews.map((rev, i) => (
                         <div key={i} className="bg-red-50 border border-red-100 p-3 rounded-lg">
                            <div className="flex justify-between items-start mb-1">
                               <span className="text-xs font-bold text-red-800">{rev.productName}</span>
                               <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-red-100 text-red-600 font-bold">
                                  {rev.rating} ★
                               </span>
                            </div>
                            <p className="text-xs text-red-700 line-clamp-2">"{rev.comment}"</p>
                            <div className="mt-2 flex justify-between items-center">
                               <span className="text-[10px] text-red-400">- {rev.author}</span>
                               <button className="text-[10px] font-bold text-red-600 underline hover:text-red-800">
                                  Reply
                               </button>
                            </div>
                         </div>
                      ))
                   )}
                </div>
             </div>
          </div>
        )}

        {/* --- TAB: BRANDS --- */}
        {activeTab === "brands" && (
          <div className="space-y-4">
             {brands.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">No brand data available.</div>
             ) : (
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="text-[10px] text-slate-400 border-b border-slate-100 uppercase tracking-wider">
                         <th className="pb-2 font-semibold">Brand</th>
                         <th className="pb-2 font-semibold text-right">Revenue</th>
                         <th className="pb-2 font-semibold text-right">Profit (Est)</th>
                      </tr>
                   </thead>
                   <tbody className="text-xs">
                      {brands.map((brand, i) => (
                         <tr key={i} className="group hover:bg-slate-50 transition">
                            <td className="py-3 font-bold text-slate-700 group-hover:text-blue-600 transition">
                               {brand.name}
                               <span className="block text-[10px] text-slate-400 font-normal">{brand.orders} Orders</span>
                            </td>
                            <td className="py-3 text-right font-medium text-slate-600">
                               {formatPrice(brand.revenue)}
                            </td>
                            <td className="py-3 text-right font-bold text-emerald-600">
                               {formatPrice(brand.profitEstimate)}
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             )}
          </div>
        )}

      </div>
    </div>
  );
}