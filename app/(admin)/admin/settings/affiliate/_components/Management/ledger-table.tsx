// File: app/(admin)/admin/settings/affiliate/_components/Management/ledger-table.tsx

"use client";

import { AffiliateLedger } from "@prisma/client";
import { ArrowUpRight, ArrowDownLeft, FileText, Search, Filter, Download, ArrowRightLeft } from "lucide-react";
import { format } from "date-fns";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { useState } from "react";

// Types
interface LedgerItem extends AffiliateLedger {
  affiliate: {
    slug: string;
    user: {
      name: string | null;
      email: string;
    };
  };
}

interface Props {
  data: LedgerItem[];
  totalEntries: number;
  currentPage: number;
  totalPages: number;
}

export default function LedgerTable({ data, totalEntries, currentPage, totalPages }: Props) {
  const { formatPrice } = useGlobalStore(); 
  const [searchTerm, setSearchTerm] = useState("");

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "COMMISSION":
      case "BONUS":
        return { bg: "bg-green-50 border-green-100", text: "text-green-700", icon: ArrowUpRight };
      case "PAYOUT":
      case "REFUND_DEDUCTION":
        return { bg: "bg-red-50 border-red-100", text: "text-red-700", icon: ArrowDownLeft };
      default:
        return { bg: "bg-gray-50 border-gray-100", text: "text-gray-700", icon: ArrowRightLeft };
    }
  };

  // Basic client-side search filtering (Real app should use server search for large data)
  const filteredData = data.filter(item => 
    item.affiliate.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.affiliate.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                    placeholder="Search transaction, affiliate..." 
                    className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-black/5 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 bg-white shadow-sm transition-colors">
                <Filter className="w-4 h-4" /> Filter
            </button>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs font-semibold">
                <tr>
                <th className="px-6 py-3">Transaction Type</th>
                <th className="px-6 py-3">Affiliate User</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3">Balance Snapshot</th>
                <th className="px-6 py-3 text-right">Date & Time</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {filteredData.length === 0 ? (
                <tr>
                    <td colSpan={5} className="p-16 text-center text-gray-500 flex flex-col items-center">
                    <FileText className="w-10 h-10 text-gray-300 mb-3" />
                    <p>No transactions found.</p>
                    </td>
                </tr>
                ) : (
                filteredData.map((item) => {
                    const style = getTypeStyles(item.type);
                    const Icon = style.icon;
                    const isCredit = item.type === "COMMISSION" || item.type === "BONUS";
                    
                    return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg border ${style.bg} ${style.text}`}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="font-bold text-gray-900 text-xs capitalize tracking-wide">
                                    {item.type.replace("_", " ").toLowerCase()}
                                </div>
                                <div className="text-[11px] text-gray-500 max-w-[200px] truncate leading-tight mt-0.5" title={item.description || ""}>
                                    {item.description || "System transaction"}
                                </div>
                            </div>
                        </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900 text-sm">{item.affiliate.user.name}</div>
                            <div className="text-xs text-gray-500 font-mono">@{item.affiliate.slug}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <span className={`font-mono font-bold text-sm ${style.text}`}>
                                {isCredit ? '+' : '-'}{formatPrice(Number(item.amount))}
                            </span>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex flex-col gap-1 text-[10px] text-gray-500 bg-gray-50 p-2 rounded border border-gray-100 w-fit min-w-[140px]">
                                <div className="flex justify-between w-full">
                                    <span>Before:</span> <span className="font-mono">{formatPrice(Number(item.balanceBefore))}</span>
                                </div>
                                <div className="flex justify-between w-full font-bold text-gray-700 border-t border-gray-200 pt-1 mt-0.5">
                                    <span>After:</span> <span className="font-mono">{formatPrice(Number(item.balanceAfter))}</span>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="text-xs font-medium text-gray-900">{format(new Date(item.createdAt), "dd MMM yyyy")}</div>
                            <div className="text-[10px] text-gray-400 font-mono">{format(new Date(item.createdAt), "hh:mm a")}</div>
                        </td>
                    </tr>
                    );
                })
                )}
            </tbody>
            </table>
        </div>
        
        {/* Footer / Pagination */}
        <div className="p-4 border-t bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
            <span>Showing {filteredData.length} of {totalEntries} records</span>
            <div className="flex gap-2">
                <button disabled={currentPage <= 1} className="px-3 py-1 bg-white border rounded hover:bg-gray-100 disabled:opacity-50 transition-colors">Previous</button>
                <button disabled={currentPage >= totalPages} className="px-3 py-1 bg-white border rounded hover:bg-gray-100 disabled:opacity-50 transition-colors">Next</button>
            </div>
        </div>
      </div>
    </div>
  );
}