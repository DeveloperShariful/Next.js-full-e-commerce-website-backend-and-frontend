//app/(storefront)/affiliates/_components/payout-manager.tsx

"use client";

import { useState } from "react";
import { CreditCard, Clock, CheckCircle, AlertCircle, History, Building2, Wallet } from "lucide-react";
import { format } from "date-fns";
import { PayoutMethod } from "@prisma/client";
import PayoutRequestModal from "./payout-request-modal"; // Will be provided in next batch

interface Props {
  data: {
    wallet: {
      balance: number;
      totalEarnings: number;
      pendingPayouts: number;
      config: { minimumPayout: number; payoutMethods: string[] };
      paymentDetails: any;
    };
    history: any[];
  };
  userId: string;
  currency: string;
}

export default function PayoutManager({ data, userId, currency }: Props) {
  const { wallet, history } = data;
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      
      {/* 1. Wallet Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Balance Card (Dark Theme) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="relative z-10">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Available Balance</p>
                  <h2 className="text-5xl font-bold mt-3 tracking-tight">{currency}{wallet.balance.toFixed(2)}</h2>
               </div>
               <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
                  <Wallet className="w-6 h-6 text-white" />
               </div>
            </div>
            
            <div className="mt-8 flex items-center gap-6 text-sm">
              <span className="flex items-center gap-2 text-gray-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <Clock className="w-4 h-4 text-orange-400" /> Pending: {currency}{wallet.pendingPayouts.toFixed(2)}
              </span>
              <span className="flex items-center gap-2 text-gray-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <CheckCircle className="w-4 h-4 text-green-400" /> Lifetime: {currency}{wallet.totalEarnings.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Background Decor */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />
        </div>

        {/* Action & Info Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center gap-6">
          <div>
             <h3 className="font-bold text-gray-900 flex items-center gap-2">
               <AlertCircle className="w-5 h-5 text-blue-600" /> Withdrawal Rules
             </h3>
             <ul className="mt-3 space-y-2 text-sm text-gray-600">
               <li className="flex items-start gap-2">
                 <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 shrink-0" />
                 Minimum withdrawal is <span className="font-bold text-gray-900">{currency}{wallet.config.minimumPayout}</span>
               </li>
               <li className="flex items-start gap-2">
                 <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 shrink-0" />
                 Processing takes 1-3 business days.
               </li>
               <li className="flex items-start gap-2">
                 <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 shrink-0" />
                 Payments sent via {wallet.config.payoutMethods.join(", ").toLowerCase().replace(/_/g, " ")}.
               </li>
             </ul>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            disabled={wallet.balance < wallet.config.minimumPayout}
            className="w-full bg-black text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex justify-center items-center gap-2"
          >
            Request Payout
          </button>
        </div>
      </div>

      {/* 2. History Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
          <History className="w-5 h-5 text-gray-500" />
          <h3 className="font-bold text-gray-900">Withdrawal History</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Date Requested</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Reference ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400 flex flex-col items-center">
                    <History className="w-8 h-8 mb-2 opacity-20" />
                    No withdrawal history found.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 font-medium">
                      {format(new Date(item.createdAt), "MMM d, yyyy")}
                      <div className="text-[10px] text-gray-400 font-normal">{format(new Date(item.createdAt), "h:mm a")}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-700 capitalize">
                        {item.method === 'BANK_TRANSFER' ? <Building2 className="w-4 h-4 text-gray-400"/> : <CreditCard className="w-4 h-4 text-gray-400"/>}
                        {item.method.replace("_", " ").toLowerCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-gray-900">
                      {currency}{item.amount.toNumber().toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs text-gray-500">
                      {item.transactionId || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Integration */}
      <PayoutRequestModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        userId={userId}
        balance={wallet.balance}
        config={wallet.config}
        currency={currency}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-50 text-yellow-700 border-yellow-100",
    PROCESSING: "bg-blue-50 text-blue-700 border-blue-100",
    COMPLETED: "bg-green-50 text-green-700 border-green-100",
    FAILED: "bg-red-50 text-red-700 border-red-100",
    CANCELLED: "bg-gray-50 text-gray-600 border-gray-200",
  };
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${styles[status] || styles.PENDING}`}>
      {status}
    </span>
  );
}