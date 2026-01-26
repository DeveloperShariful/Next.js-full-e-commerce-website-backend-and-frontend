//app/(storefront)/affiliates/finance/ledger/page.tsx

import { financeService } from "@/app/actions/storefront/affiliates/_services/finance-service";
// ✅ পাথ আপডেট: প্যারেন্ট ফোল্ডারের কম্পোনেন্ট থেকে ইম্পোর্ট
import LedgerTable from "./_components/ledger-table"; 
import { ScrollText, Download } from "lucide-react";
import { db } from "@/lib/prisma";
import { requireUser } from "@/app/actions/storefront/affiliates/auth-helper";

export const metadata = {
  title: "Transaction Ledger | Finance",
};

export default async function LedgerPage() {
  const userId = await requireUser();
  
  // 1. Parallel Data Fetching (User & Settings)
  const [affiliate, settings] = await Promise.all([
    db.affiliateAccount.findUnique({ 
        where: { userId },
        select: { id: true }
    }),
    db.storeSettings.findUnique({ where: { id: "settings" } })
  ]);

  if (!affiliate) return null;

  // 2. Get Dynamic Currency
  const currency = settings?.currencySymbol || "$";

  // 3. Fetch Transactions
  const ledger = await financeService.getLedger(affiliate.id, 100); 

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

      {/* ✅ Pass Dynamic Currency */}
      <LedgerTable data={ledger} currencySymbol={currency} />
    </div>
  );
}