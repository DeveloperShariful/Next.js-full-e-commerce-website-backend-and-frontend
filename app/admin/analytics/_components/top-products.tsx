"use client";

import { TopProduct } from "@/app/actions/admin/analytics";

interface TopProductsProps {
  products: TopProduct[];
  currency?: string;
}

export function TopProducts({ products, currency = "BDT" }: TopProductsProps) {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: currency, minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
      <h3 className="font-bold text-lg text-slate-800 mb-6">Top Selling Products</h3>
      <div className="space-y-6 flex-1">
         {products.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
               <p>No sales data in this period.</p>
            </div>
         ) : (
            products.map((product, i) => (
               <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3 overflow-hidden">
                     <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500 flex-shrink-0 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                        {i + 1}
                     </div>
                     <div className="truncate min-w-0">
                        <p className="text-sm font-bold text-slate-700 truncate group-hover:text-blue-600 transition" title={product.name}>{product.name}</p>
                        <p className="text-xs text-slate-400">{product.quantity} items sold</p>
                     </div>
                  </div>
                  <div className="text-sm font-bold text-slate-800 whitespace-nowrap ml-4">
                     {formatPrice(product.sales)}
                  </div>
               </div>
            ))
         )}
      </div>
      
      <div className="mt-8 pt-4 border-t border-slate-100">
         <button className="w-full py-2 bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-slate-100 transition">
            View Full Report
         </button>
      </div>
    </div>
  );
}