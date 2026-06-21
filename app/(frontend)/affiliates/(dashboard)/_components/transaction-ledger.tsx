// app/(frontend)/affiliates/_components/transaction-ledger.tsx

"use client";

import { format } from "date-fns";
import { ArrowUpRight, ArrowDownLeft, FileText, Download, RefreshCcw } from "lucide-react";
import { useGlobalStore } from "@/app/providers/global-store-provider";

interface LedgerItem {
  id: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string | null;
  referenceId: string | null;
  createdAt: string | Date;
}

interface Props {
  transactions: LedgerItem[]; 
}

export default function TransactionLedger({ transactions }: Props) {
  const { formatPrice, symbol } = useGlobalStore();

  // ✅ FIXED: Updated to match WalletTransaction Types
  const getTypeConfig = (type: string) => {
    switch (type) {
      case "AFFILIATE_COMMISSION":
        return { color: "text-[#00a32a]", bg: "bg-[#f0f6fc] border-[#00a32a]/20", icon: ArrowDownLeft, sign: "+" };
      case "AFFILIATE_PAYOUT":
      case "PAYOUT_DEDUCTION":
        return { color: "text-[#d63638]", bg: "bg-[#fcf0f1] border-[#d63638]/20", icon: ArrowUpRight, sign: "-" };
      case "ADJUSTMENT":
        return { color: "text-[#8a6d3b]", bg: "bg-[#fcf9e8] border-[#f0b849]/30", icon: RefreshCcw, sign: "±" };
      default:
        return { color: "text-[#50575e]", bg: "bg-[#f0f0f1] border-[#c3c4c7]", icon: FileText, sign: "" };
    }
  };

  const formatTypeName = (type: string) => {
    if (type === "AFFILIATE_COMMISSION") return "Commission";
    if (type === "AFFILIATE_PAYOUT") return "Payout Sent";
    if (type === "PAYOUT_DEDUCTION") return "Refund / Deduction";
    return type.replace("_", " ");
  };

  return (
    <div className="space-y-4 font-sans text-[#1d2327]">
      
      {/* Header WP WooCommerce Style */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 border border-[#c3c4c7] shadow-sm">
        <div>
            <h2 className="text-[18px] font-semibold text-[#1d2327] m-0">Transaction Ledger</h2>
            <p className="text-[13px] text-[#50575e] m-0">Detailed logs of all your income, deductions, and withdrawals.</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f0f0f1] border border-[#8c8f94] text-[#2c3338] text-[13px] font-semibold rounded-sm hover:bg-[#e6e6e6] transition-colors shadow-sm">
            <Download className="w-3.5 h-3.5" /> Download CSV
        </button>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-[#c3c4c7] shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead className="bg-[#f0f0f1] border-b border-[#c3c4c7] text-[#2c3338]">
              <tr>
                <th className="px-4 py-2 font-semibold border-r border-[#c3c4c7]/30">Transaction Type</th>
                <th className="px-4 py-2 font-semibold border-r border-[#c3c4c7]/30">Description & ID</th>
                <th className="px-4 py-2 font-semibold border-r border-[#c3c4c7]/30 text-right">Amount</th>
                <th className="px-4 py-2 font-semibold border-r border-[#c3c4c7]/30 text-right">Balance After</th>
                <th className="px-4 py-2 font-semibold text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f1]">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-[#50575e] bg-[#f6f7f7] italic">
                    <div className="flex flex-col items-center justify-center">
                        <FileText className="w-8 h-8 mb-2 text-[#c3c4c7]" />
                        No transactions found in your account yet.
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((item) => {
                  const config = getTypeConfig(item.type);
                  const Icon = config.icon;
                  
                  return (
                    <tr key={item.id} className="hover:bg-[#f6f7f7] transition-colors">
                      
                      {/* Type Column */}
                      <td className="px-4 py-3 border-r border-[#c3c4c7]/10">
                        <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-sm border ${config.bg} ${config.color}`}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <span className="font-semibold text-[13px] text-[#1d2327]">
                                {formatTypeName(item.type)}
                            </span>
                        </div>
                      </td>
                      
                      {/* Description Column */}
                      <td className="px-4 py-3 border-r border-[#c3c4c7]/10">
                        <div className="font-medium text-[#2271b1] truncate max-w-[250px]" title={item.description || ""}>
                          {item.description || "System adjustment"}
                        </div>
                        <div className="text-[11px] text-[#8c8f94] font-mono mt-0.5">
                          Ref: {item.referenceId || "N/A"}
                        </div>
                      </td>
                      
                      {/* Amount Column */}
                      <td className="px-4 py-3 text-right border-r border-[#c3c4c7]/10">
                        <span className={`font-mono font-bold text-[14px] ${config.color}`}>
                          {config.sign}{formatPrice(item.amount)}
                        </span>
                      </td>

                      {/* Balance Column */}
                      <td className="px-4 py-3 text-right border-r border-[#c3c4c7]/10">
                        <div className="inline-block text-right">
                            <span className="block font-mono text-[#1d2327] text-[13px] font-semibold">{formatPrice(item.balanceAfter)}</span>
                        </div>
                      </td>

                      {/* Date Column */}
                      <td className="px-4 py-3 text-right text-[#50575e]">
                        <div className="text-[12px] font-medium text-[#1d2327]">{format(new Date(item.createdAt), "MMM d, yyyy")}</div>
                        <div className="text-[11px] text-[#8c8f94] font-mono">{format(new Date(item.createdAt), "h:mm a")}</div>
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