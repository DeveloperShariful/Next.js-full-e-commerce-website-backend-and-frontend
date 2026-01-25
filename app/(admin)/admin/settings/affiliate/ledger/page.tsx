//app/(admin)/admin/settings/affiliate/ledger/page.tsx

import { ledgerService } from "@/app/actions/admin/settings/affiliates/_services/ledger-service";
import LedgerTable from "@/app/(admin)/admin/settings/affiliate/_components/management/ledger/ledger-table";
import { ScrollText, FileSpreadsheet } from "lucide-react";

export const metadata = {
  title: "Financial Ledger | Affiliate Admin",
};

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const type = params.type || undefined;

  const { transactions, total, totalPages } = await ledgerService.getLedgerHistory(
    page,
    20,
    type
  );

  // Map Decimal to Number
  const formattedData = transactions.map(t => ({
    ...t,
    amount: t.amount, // Decimal passed as is, or .toNumber() if using simple-json
    balanceBefore: t.balanceBefore,
    balanceAfter: t.balanceAfter
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-slate-600" />
            Financial Ledger
          </h2>
          <p className="text-sm text-gray-500">
            Audit trail of all commissions, payouts, and balance adjustments.
          </p>
        </div>
        
        <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs rounded-lg hover:bg-gray-50 shadow-sm transition-colors">
          <FileSpreadsheet className="w-4 h-4" />
          Export CSV
        </button>
      </div>
      
      <div className="h-px bg-gray-200" />

      <LedgerTable 
        data={formattedData as any} 
        totalEntries={total}
        currentPage={page}
        totalPages={totalPages}
      />
    </div>
  );
}