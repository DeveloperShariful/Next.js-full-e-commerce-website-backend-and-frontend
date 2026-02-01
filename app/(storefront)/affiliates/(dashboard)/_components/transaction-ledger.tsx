//app/(storefront)/affiliates/_components/transaction-ledger.tsx

"use client";

import { AffiliateLedger } from "@prisma/client";
import { format } from "date-fns";
import { ArrowUpRight, ArrowDownLeft, FileText, Download } from "lucide-react";
// ✅ IMPORT ADDED
import { useGlobalStore } from "@/app/providers/global-store-provider";

interface Props {
  // Prisma types might mismatch with serialized data, using 'any' for safety here or you can define a DTO
  transactions: any[]; 
}

export default function TransactionLedger({ transactions }: Props) {
  // ✅ GLOBAL STORE USAGE
  const { formatPrice, symbol } = useGlobalStore();
  const currency = symbol || "$";

  const getTypeConfig = (type: string) => {
    switch (type) {
      case "COMMISSION":
      case "BONUS":
        return { color: "text-green-600", bg: "bg-green-50", icon: ArrowDownLeft, sign: "+" };
      case "PAYOUT":
      case "REFUND_DEDUCTION":
        return { color: "text-red-600", bg: "bg-red-50", icon: ArrowUpRight, sign: "-" };
      default:
        return { color: "text-gray-600", bg: "bg-gray-50", icon: FileText, sign: "" };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
            <h2 className="text-lg font-bold text-gray-900">Transaction History</h2>
            <p className="text-sm text-gray-500">Detailed logs of all income and withdrawals.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
            <Download className="w-4 h-4" /> Export Statement
        </button>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Transaction Type</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-right">Balance</th>
                <th className="px-6 py-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400 flex flex-col items-center">
                    <FileText className="w-10 h-10 mb-2 opacity-20" />
                    No transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((item) => {
                  const config = getTypeConfig(item.type);
                  const Icon = config.icon;
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg border border-transparent ${config.bg} ${config.color}`}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-xs text-gray-700 uppercase tracking-wide">
                                {item.type.replace("_", " ")}
                            </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 truncate max-w-[250px]" title={item.description || ""}>
                          {item.description || "System adjustment"}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                          ID: {item.referenceId || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-mono font-bold text-sm ${config.color}`}>
                          {config.sign}{formatPrice(item.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-block text-right">
                            <span className="block font-mono text-gray-700 text-sm font-medium">{formatPrice(item.balanceAfter)}</span>
                            <span className="block text-[10px] text-gray-400">Post Balance</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500">
                        <div className="text-xs font-medium text-gray-900">{format(new Date(item.createdAt), "MMM d, yyyy")}</div>
                        <div className="text-[10px] text-gray-400">{format(new Date(item.createdAt), "h:mm a")}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}