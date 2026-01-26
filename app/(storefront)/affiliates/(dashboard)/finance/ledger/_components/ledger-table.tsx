//app/(storefront)/affiliates/finance/_components/ledger-table.tsx

import { AffiliateLedger } from "@prisma/client";
import { format } from "date-fns";
import { ArrowUpRight, ArrowDownLeft, FileText } from "lucide-react";

interface Props {
  data: AffiliateLedger[];
  currencySymbol: string; // ✅ New Prop
}

export default function LedgerTable({ data, currencySymbol }: Props) {
  
  const getTypeConfig = (type: string) => {
    switch (type) {
      case "COMMISSION":
      case "BONUS":
        return { color: "text-green-600", icon: ArrowDownLeft, sign: "+" };
      case "PAYOUT":
      case "REFUND_DEDUCTION":
        return { color: "text-red-600", icon: ArrowUpRight, sign: "-" };
      default:
        return { color: "text-gray-600", icon: FileText, sign: "" };
    }
  };

  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Description</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3 text-right">Amount</th>
              <th className="px-6 py-3 text-right">Balance</th>
              <th className="px-6 py-3 text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No transaction history available.
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const config = getTypeConfig(item.type);
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 truncate max-w-[200px]" title={item.description || ""}>
                        {item.description || "System adjustment"}
                      </div>
                      <div className="text-xs text-gray-400 font-mono mt-0.5">
                        REF: {item.referenceId || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs font-medium text-gray-600 capitalize">
                        {item.type.replace("_", " ").toLowerCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-mono font-medium ${config.color}`}>
                        {/* ✅ DYNAMIC CURRENCY */}
                        {config.sign}{currencySymbol}{item.amount.toNumber().toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-600">
                      {/* ✅ DYNAMIC CURRENCY */}
                      {currencySymbol}{item.balanceAfter.toNumber().toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-500 text-xs">
                      {format(new Date(item.createdAt), "MMM d, HH:mm")}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}