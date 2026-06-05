// File: app/(backend)/admin/affiliate/_components/Management/ledger-table.tsx

"use client";

import { ArrowUpRight, ArrowDownLeft, FileText, Search, Filter, Download, ArrowRightLeft } from "lucide-react";
import { format } from "date-fns";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { useState } from "react";

// ✅ FIXED: Replaced deleted AffiliateLedger Prisma type with Custom Interface mapped from WalletTransaction
interface LedgerItem {
  id: string;
  affiliateId: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string | null;
  referenceId: string | null;
  createdAt: Date | string;
  affiliate: {
    slug: string;
    user: {
      name: string | null;
      email: string;
    };
  } | null;
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

  // ✅ FIXED: Support for WalletTransaction Types
  const getTypeStyles = (type: string) => {
    switch (type) {
      case "AFFILIATE_COMMISSION":
      case "MLM_BONUS":
        return { bg: "bg-[#f0f6fc] border-[#2271b1]/30", text: "text-[#2271b1]", icon: ArrowUpRight };
      case "AFFILIATE_PAYOUT":
      case "PAYOUT_DEDUCTION":
        return { bg: "bg-[#fcf0f1] border-[#d63638]/30", text: "text-[#d63638]", icon: ArrowDownLeft };
      case "ADJUSTMENT":
        return { bg: "bg-[#fcf9e8] border-[#f0b849]/30", text: "text-[#8a6d3b]", icon: ArrowRightLeft };
      default:
        return { bg: "bg-[#f0f0f1] border-[#c3c4c7]", text: "text-[#50575e]", icon: ArrowRightLeft };
    }
  };

  const formatTypeName = (type: string) => {
    if (type === "AFFILIATE_COMMISSION") return "Commission";
    if (type === "MLM_BONUS") return "MLM Bonus";
    if (type === "AFFILIATE_PAYOUT") return "Payout Sent";
    if (type === "PAYOUT_DEDUCTION") return "Refund Deduction";
    return type.replace("_", " ").toLowerCase();
  };

  // Basic client-side search filtering (Real app should use server search for large data)
  const filteredData = data.filter(item => {
    if (!item.affiliate) return false;
    return (
      item.affiliate.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.affiliate.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-4 font-sans text-[#1d2327]">
      
      {/* WP Admin Top Bar */}
      <div className="bg-white border border-[#c3c4c7] shadow-sm flex flex-col sm:flex-row justify-between items-center p-3">
        <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-1.5 h-4 w-4 text-[#8c8f94]" />
                <input 
                    placeholder="Search transaction, affiliate..." 
                    className="pl-8 pr-2 py-1 w-full border border-[#8c8f94] rounded-sm text-[13px] outline-none focus:ring-1 focus:ring-[#2271b1] focus:border-[#2271b1]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1 border border-[#8c8f94] bg-[#f0f0f1] text-[#2c3338] hover:bg-[#e6e6e6] rounded-sm text-[13px] transition-colors">
                <Filter className="w-3.5 h-3.5" /> Filter
            </button>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1 mt-2 sm:mt-0 bg-[#2271b1] border border-[#2271b1] hover:bg-[#135e96] hover:border-[#135e96] text-white text-[13px] rounded-sm transition-colors shadow-sm whitespace-nowrap">
            <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* WP List Table */}
      <div className="bg-white border border-[#c3c4c7] shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left text-[13px] border-collapse">
            <thead className="bg-[#f0f0f1] border-b border-[#c3c4c7] text-[#2c3338]">
                <tr>
                <th className="px-4 py-2 font-semibold border-r border-[#c3c4c7]/30">Transaction Type</th>
                <th className="px-4 py-2 font-semibold border-r border-[#c3c4c7]/30">Affiliate User</th>
                <th className="px-4 py-2 font-semibold border-r border-[#c3c4c7]/30 text-right">Amount</th>
                <th className="px-4 py-2 font-semibold border-r border-[#c3c4c7]/30">Balance Snapshot</th>
                <th className="px-4 py-2 font-semibold text-right">Date & Time</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f1]">
                {filteredData.length === 0 ? (
                <tr>
                    <td colSpan={5} className="p-12 text-center text-[#50575e] bg-[#f6f7f7] italic">
                        <div className="flex flex-col items-center justify-center">
                            <FileText className="w-8 h-8 text-[#c3c4c7] mb-2" />
                            No transactions found.
                        </div>
                    </td>
                </tr>
                ) : (
                filteredData.map((item) => {
                    const style = getTypeStyles(item.type);
                    const Icon = style.icon;
                    const isCredit = item.type === "AFFILIATE_COMMISSION" || item.type === "MLM_BONUS" || item.type === "ADJUSTMENT";
                    
                    return (
                    <tr key={item.id} className="hover:bg-[#f6f7f7] transition-colors group">
                        <td className="px-4 py-3 border-r border-[#c3c4c7]/10">
                        <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-sm border ${style.bg} ${style.text}`}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="font-semibold text-[#1d2327] capitalize">
                                    {formatTypeName(item.type)}
                                </div>
                                <div className="text-[11px] text-[#50575e] max-w-[200px] truncate mt-0.5 italic" title={item.description || ""}>
                                    {item.description || "System transaction"}
                                </div>
                            </div>
                        </div>
                        </td>
                        <td className="px-4 py-3 border-r border-[#c3c4c7]/10">
                            <div className="font-semibold text-[#2271b1] hover:underline cursor-pointer">{item.affiliate?.user?.name || "Unknown"}</div>
                            <div className="text-[11px] text-[#50575e] font-mono">@{item.affiliate?.slug || "unknown"}</div>
                        </td>
                        <td className="px-4 py-3 text-right border-r border-[#c3c4c7]/10">
                            <span className={`font-mono font-bold text-[14px] ${style.text}`}>
                                {isCredit ? '+' : '-'}{formatPrice(Number(item.amount))}
                            </span>
                        </td>
                        <td className="px-4 py-3 border-r border-[#c3c4c7]/10">
                            <div className="flex flex-col text-[11px] text-[#50575e] bg-[#f0f0f1] p-1.5 rounded-sm border border-[#c3c4c7] w-fit min-w-[140px]">
                                <div className="flex justify-between w-full">
                                    <span>Before:</span> <span className="font-mono">{formatPrice(Number(item.balanceBefore))}</span>
                                </div>
                                <div className="flex justify-between w-full font-bold text-[#1d2327] border-t border-[#c3c4c7]/50 pt-1 mt-0.5">
                                    <span>After:</span> <span className="font-mono">{formatPrice(Number(item.balanceAfter))}</span>
                                </div>
                            </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                            <div className="text-[12px] font-medium text-[#1d2327]">{format(new Date(item.createdAt), "Y/m/d")}</div>
                            <div className="text-[11px] text-[#8c8f94] font-mono">{format(new Date(item.createdAt), "g:i a")}</div>
                        </td>
                    </tr>
                    );
                })
                )}
            </tbody>
            </table>
        </div>
        
        {/* WP Pagination Footer */}
        <div className="p-3 border-t border-[#c3c4c7] bg-[#f0f0f1] text-[13px] text-[#50575e] flex justify-between items-center">
            <span>{filteredData.length} items</span>
            <div className="flex gap-1">
                <button 
                  disabled={currentPage <= 1} 
                  className="px-2 py-1 bg-white border border-[#8c8f94] rounded-sm hover:bg-[#e6e6e6] text-[#2c3338] disabled:opacity-50 transition-colors"
                >
                  « Prev
                </button>
                <button 
                  disabled={currentPage >= totalPages} 
                  className="px-2 py-1 bg-white border border-[#8c8f94] rounded-sm hover:bg-[#e6e6e6] text-[#2c3338] disabled:opacity-50 transition-colors"
                >
                  Next »
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}