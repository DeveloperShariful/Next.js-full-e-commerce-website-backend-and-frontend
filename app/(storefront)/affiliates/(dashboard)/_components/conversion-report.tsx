//app/(storefront)/affiliates/_components/conversion-report.tsx

"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ShoppingBag, DollarSign, Search, Filter, ArrowRight, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  conversions: any[];
  currency: string;
}

export default function ConversionReport({ conversions, currency }: Props) {
  const [search, setSearch] = useState("");

  const filtered = conversions.filter(c => 
    c.order?.orderNumber.toLowerCase().includes(search.toLowerCase()) || 
    c.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Sales Report</h2>
                <p className="text-xs text-gray-500">Track orders generated from your links.</p>
            </div>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                    placeholder="Search Order #..." 
                    className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                <Filter className="w-4 h-4" /> Filter
            </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Order Details</th>
                <th className="px-6 py-4 text-right">Order Value</th>
                <th className="px-6 py-4 text-right">Commission</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-16 text-center text-gray-400 flex flex-col items-center">
                    <ShoppingBag className="w-12 h-12 mb-3 opacity-20" />
                    <p>No conversions found.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      {item.order ? (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-xs">
                                #{item.order.orderNumber.slice(-2)}
                            </div>
                            <div>
                                <div className="font-bold text-gray-900 flex items-center gap-2">
                                    #{item.order.orderNumber}
                                    <ExternalLinkIcon />
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                    <User className="w-3 h-3" /> Customer Purchase
                                </div>
                            </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Deleted Order</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-gray-600 font-medium">
                        {currency}{item.order?.total ? Number(item.order.total).toFixed(2) : "0.00"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2.5 py-1 rounded-md font-bold text-sm border border-green-100 shadow-sm">
                        + {currency}{Number(item.commissionAmount).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4 text-right text-gray-500 text-xs">
                      {format(new Date(item.createdAt), "MMM d, yyyy")}
                      <div className="text-[10px] text-gray-400">{format(new Date(item.createdAt), "h:mm a")}</div>
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

function StatusBadge({ status }: { status: string }) {
    const styles: any = {
        PAID: "bg-green-100 text-green-700 border-green-200",
        APPROVED: "bg-blue-100 text-blue-700 border-blue-200",
        PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
        REJECTED: "bg-red-50 text-red-700 border-red-200"
    };
    return (
        <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", styles[status] || styles.PENDING)}>
            {status}
        </span>
    );
}

const ExternalLinkIcon = () => (
    <svg className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
);