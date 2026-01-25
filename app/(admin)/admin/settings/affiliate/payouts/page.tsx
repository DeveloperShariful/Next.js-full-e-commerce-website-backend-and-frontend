// File: app/(admin)/admin/settings/affiliate/payouts/page.tsx

import { payoutService } from "@/app/actions/admin/settings/affiliates/_services/payout-service";
import PayoutsTable from "../_components/management/payouts/payouts-table";
import { PayoutStatus } from "@prisma/client";

export const metadata = {
  title: "Affiliate Payouts | Admin",
};

export default async function ManagePayoutsPage({
  searchParams,
}: {
  // 🔥 FIX 1: Type কে Promise বানানো হয়েছে
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  // 🔥 FIX 2: প্যারামগুলোকে আনর‍্যাপ (unwrap) করা হয়েছে
  const params = await searchParams;
  
  const page = Number(params.page) || 1;
  const status = params.status as PayoutStatus | undefined;

  // Fetch Payouts
  const { items, total, totalPages } = await payoutService.getPayouts(
    page,
    20,
    status
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Payout Requests</h2>
          <p className="text-sm text-gray-500">
            Process withdrawals, mark as paid, or reject invalid requests.
          </p>
        </div>
      </div>
      
      <div className="h-px bg-gray-200" />

      <PayoutsTable 
        data={items}
        totalEntries={total}
        totalPages={totalPages}
        currentPage={page}
        currentStatus={status}
      />
    </div>
  );
}