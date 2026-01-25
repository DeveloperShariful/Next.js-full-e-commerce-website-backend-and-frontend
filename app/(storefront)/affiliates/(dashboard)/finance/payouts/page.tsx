//app/(storefront)/affiliates/(dashboard)/finance/payouts/page.tsx

import { financeService } from "@/app/actions/storefront/affiliates/_services/finance-service";
import PayoutTrigger from "./_components/payout-trigger"; 
import { CreditCard, History, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { db } from "@/lib/prisma";
import { format } from "date-fns";
// ✅ আপডেট করা ইম্পোর্ট পাথ
import { requireUser } from "@/app/actions/storefront/affiliates/auth-helper";

export const metadata = {
  title: "Payouts | Finance",
};

export default async function PayoutsPage() {
  // ✅ ডাইনামিক ইউজার চেকিং
  const userId = await requireUser();
  
  const affiliate = await db.affiliateAccount.findUnique({ 
      where: { userId },
      select: { id: true }
  });

  if (!affiliate) return null;

  const [wallet, history] = await Promise.all([
    financeService.getWalletData(affiliate.id),
    financeService.getPayoutHistory(affiliate.id)
  ]);

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-green-600" />
          Payouts & Withdrawals
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your earnings and request withdrawals.
        </p>
      </div>

      {/* Stats & Action Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Balance Card */}
        <div className="md:col-span-2 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white shadow-lg flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-sm text-gray-400 font-medium">Available Balance</p>
            <h2 className="text-4xl font-bold mt-2 tracking-tight">${wallet.balance.toFixed(2)}</h2>
            <div className="mt-6 flex items-center gap-4 text-sm text-gray-300">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> Pending: ${wallet.pendingPayouts.toFixed(2)}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Paid: ${(wallet.totalEarnings - wallet.balance).toFixed(2)}
              </span>
            </div>
          </div>
          
          {/* Action: Using the Client Component Here */}
          <div className="mt-6 pt-6 border-t border-white/10 relative z-10">
             <PayoutTrigger 
               userId={userId} 
               balance={wallet.balance} 
               config={wallet.config} 
             />
          </div>

          {/* Decor */}
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex flex-col justify-center">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> Payout Rules
          </h3>
          <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
            <li>Minimum withdrawal is <b>${wallet.config.minimumPayout}</b>.</li>
            <li>Processing time is <b>1-3 business days</b>.</li>
            <li>Ensure payment details are set in Settings.</li>
          </ul>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
          <History className="w-4 h-4 text-gray-500" />
          <h3 className="font-medium text-gray-900">Withdrawal History</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Method</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Transaction ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No withdrawal history found.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-600">
                      {format(new Date(item.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 capitalize">
                      {item.method.replace("_", " ").toLowerCase()}
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-gray-900">
                      ${item.amount.toNumber().toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
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
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    PROCESSING: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
    FAILED: "bg-red-100 text-red-700",
    CANCELLED: "bg-gray-100 text-gray-600",
  };
  
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.PENDING}`}>
      {status}
    </span>
  );
}