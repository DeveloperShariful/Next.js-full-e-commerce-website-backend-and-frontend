"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, CreditCard } from "lucide-react";
import { formatTz } from "@/lib/store-time";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { OrderTransaction } from "../types";

interface OrderTransactionsMetaProps {
  transactions: OrderTransaction[];
  timezone?: string;
}

const txStatusBadge: Record<string, { bg: string; text: string }> = {
  SUCCESS:    { bg: "bg-[#edfaef]", text: "text-[#5b841b]"  },
  PAID:       { bg: "bg-[#edfaef]", text: "text-[#5b841b]"  },
  COMPLETED:  { bg: "bg-[#edfaef]", text: "text-[#5b841b]"  },
  PENDING:    { bg: "bg-[#fff8e5]", text: "text-[#996800]"  },
  PROCESSING: { bg: "bg-[#e9f0f8]", text: "text-[#2271b1]"  },
  FAILED:     { bg: "bg-[#fce8e8]", text: "text-[#d63638]"  },
  REFUNDED:   { bg: "bg-[#f0f0f1]", text: "text-[#646970]"  },
  VOIDED:     { bg: "bg-[#f0f0f1]", text: "text-[#646970]"  },
};

const txTypeLabel: Record<string, string> = {
  CHARGE:         "Charge",
  REFUND:         "Refund",
  CAPTURE:        "Capture",
  AUTHORIZATION:  "Authorization",
  VOID:           "Void",
};

export const OrderTransactionsMeta = ({ transactions, timezone = "UTC" }: OrderTransactionsMetaProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const { formatPrice } = useGlobalStore();

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] mb-5 rounded-[3px]">

      <div
        className="px-4 py-3 border-b border-[#c3c4c7] flex justify-between items-center cursor-pointer select-none hover:bg-[#f6f7f7] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-[14px] font-semibold text-[#1d2327] m-0 flex items-center gap-2">
          <CreditCard size={14} className="text-[#646970]" />
          Transactions
          {transactions.length > 0 && (
            <span className="bg-[#2271b1] text-white text-[11px] font-normal px-1.5 py-0.5 rounded-full">
              {transactions.length}
            </span>
          )}
        </h2>
        <button type="button" className="text-[#646970]">
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {isOpen && (
        <div className="p-4">
          {transactions.length === 0 ? (
            <p className="text-[13px] text-[#646970] m-0">No transactions found for this order.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] border-collapse">
                <thead>
                  <tr className="border-b border-[#c3c4c7]">
                    <th className="text-left text-[12px] text-[#646970] font-semibold py-1.5 pr-3">Date</th>
                    <th className="text-left text-[12px] text-[#646970] font-semibold py-1.5 pr-3">Gateway</th>
                    <th className="text-left text-[12px] text-[#646970] font-semibold py-1.5 pr-3">Type</th>
                    <th className="text-left text-[12px] text-[#646970] font-semibold py-1.5 pr-3">Transaction ID</th>
                    <th className="text-right text-[12px] text-[#646970] font-semibold py-1.5 pr-3">Amount</th>
                    <th className="text-center text-[12px] text-[#646970] font-semibold py-1.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const badge = txStatusBadge[tx.status.toUpperCase()] ?? {
                      bg: "bg-[#f0f0f1]",
                      text: "text-[#646970]",
                    };
                    return (
                      <tr key={tx.id} className="border-b border-[#e2e4e7] last:border-0 hover:bg-[#f6f7f7] transition-colors">
                        <td className="py-2 pr-3 text-[#646970] whitespace-nowrap">
                          {formatTz(new Date(tx.createdAt), timezone, "dd MMM yyyy")}
                        </td>
                        <td className="py-2 pr-3 font-medium text-[#1d2327] capitalize">
                          {tx.gateway}
                          {tx.paymentMethod && (
                            <span className="ml-1 text-[11px] text-[#646970] font-normal">
                              ({tx.paymentMethod})
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-[#3c434a]">
                          {txTypeLabel[tx.type] ?? tx.type}
                        </td>
                        <td className="py-2 pr-3">
                          <span className="font-mono text-[11px] text-[#646970] bg-[#f0f0f1] px-1.5 py-0.5 rounded">
                            {tx.transactionId}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-right font-semibold text-[#1d2327]">
                          {formatPrice(tx.amount)}
                        </td>
                        <td className="py-2 text-center">
                          <span
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-[3px] ${badge.bg} ${badge.text}`}
                          >
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
