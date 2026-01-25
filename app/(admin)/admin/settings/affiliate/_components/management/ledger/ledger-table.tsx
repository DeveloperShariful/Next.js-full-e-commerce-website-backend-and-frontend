//app/(admin)/admin/settings/affiliate/_components/management/ledger/ledger-table.tsx

"use client";

import { AffiliateLedger } from "@prisma/client";
import { ArrowUpRight, ArrowDownLeft, FileText, Search, Filter } from "lucide-react";
import { format } from "date-fns";

// Type with relation
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
  
  const getTypeStyles = (type: string) => {
    switch (type) {
      case "COMMISSION":
      case "BONUS":
        return { bg: "bg-green-50", text: "text-green-700", icon: ArrowUpRight };
      case "PAYOUT":
      case "REFUND_DEDUCTION":
        return { bg: "bg-red-50", text: "text-red-700", icon: ArrowDownLeft };
      default:
        return { bg: "bg-gray-50", text: "text-gray-700", icon: FileText };
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Filters (Visual Only for UI Demo) */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input 
            placeholder="Search by affiliate..." 
            className="pl-9 pr-4 py-2 w-full border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          <Filter className="w-4 h-4" /> Filter Type
        </button>
      </div>

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Transaction</th>
              <th className="px-6 py-3">Affiliate</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Balance Log</th>
              <th className="px-6 py-3 text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-gray-500">
                  No transactions recorded yet.
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const style = getTypeStyles(item.type);
                const Icon = style.icon;
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${style.bg} ${style.text}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 capitalize">
                            {item.type.replace("_", " ").toLowerCase()}
                          </div>
                          <div className="text-xs text-gray-500 max-w-[200px] truncate" title={item.description || ""}>
                            {item.description || "System transaction"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{item.affiliate.user.name}</div>
                      <div className="text-xs text-gray-500">/{item.affiliate.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-mono font-medium ${style.text}`}>
                        {item.type === 'PAYOUT' || item.type === 'REFUND_DEDUCTION' ? '-' : '+'}
                        ${Number(item.amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 space-y-1">
                      <div className="flex justify-between w-[120px]">
                        <span>Before:</span> <span className="font-mono">${Number(item.balanceBefore).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between w-[120px] font-medium text-gray-700">
                        <span>After:</span> <span className="font-mono">${Number(item.balanceAfter).toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-500 text-xs">
                      {format(new Date(item.createdAt), "dd MMM yyyy")}
                      <br/>
                      {format(new Date(item.createdAt), "HH:mm")}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        
        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 text-xs text-gray-500 flex justify-between">
            <span>Total Records: {totalEntries}</span>
            <span>Page {currentPage} of {totalPages}</span>
        </div>
      </div>
    </div>
  );
}