//app/(storefront)/affiliates/finance/ledger/page.tsx

import { financeService } from "@/app/actions/storefront/affiliates/_services/finance-service";
import LedgerTable from "../_components/ledger-table";
import { ScrollText, Download } from "lucide-react";
import { db } from "@/lib/prisma";
// ✅ আপডেট করা ইম্পোর্ট পাথ
import { requireUser } from "@/app/actions/storefront/affiliates/auth-helper";

export const metadata = {
  title: "Transaction Ledger | Finance",
};

export default async function LedgerPage() {
  // ✅ ডাইনামিক ইউজার চেকিং
  const userId = await requireUser();
  
  const affiliate = await db.affiliateAccount.findUnique({ 
      where: { userId },
      select: { id: true }
  });

  if (!affiliate) return null;

  const ledger = await financeService.getLedger(affiliate.id, 100); // Last 100 transactions

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-purple-600" />
            Transaction Ledger
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Detailed record of every commission, payout, and adjustment.
          </p>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <LedgerTable data={ledger} />
    </div>
  );
}