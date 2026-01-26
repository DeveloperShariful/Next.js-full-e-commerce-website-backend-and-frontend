// File: app/(admin)/admin/settings/affiliate/users/page.tsx

import { accountService } from "@/app/actions/admin/settings/affiliates/_services/account-service";
import AffiliateUsersTable from "./_components/users-table";
import { AffiliateStatus } from "@prisma/client";

export const metadata = {
  title: "Manage Affiliates | Admin",
};

export default async function ManageAffiliatesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; search?: string }>;
}) {
  // 🔥 FIX: Await params
  const params = await searchParams;

  const page = Number(params.page) || 1;
  const status = params.status as AffiliateStatus | undefined;
  const search = params.search || "";

  const { affiliates, total, totalPages } = await accountService.getAffiliates(
    page, 
    20, 
    status, 
    search
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Manage Affiliates</h2>
          <p className="text-sm text-gray-500">
            Approve registrations, view profiles, and manage active partners.
          </p>
        </div>
      </div>
      
      <div className="h-px bg-gray-200" />

      <AffiliateUsersTable 
        data={affiliates} 
        totalEntries={total}
        totalPages={totalPages}
        currentPage={page}
        currentStatus={status}
      />
    </div>
  );
}