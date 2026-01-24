// File: app/(admin)/admin/settings/affiliate/tiers/page.tsx

import { tierService } from "@/app/actions/admin/settings/affiliate/_services/tier-service";
import TierList from "../_components/features/tiers/tier-list";
import { Plus } from "lucide-react";

export const metadata = {
  title: "Affiliate Tiers | Admin",
};

/**
 * SERVER COMPONENT
 * Fetches all affiliate tiers and renders the list view.
 */
export default async function AffiliateTiersPage() {
  const tiers = await tierService.getAllTiers();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Commission Tiers</h2>
          <p className="text-sm text-gray-500">
            Define levels (Silver, Gold) and their specific commission rates.
          </p>
        </div>
      </div>
      
      <div className="h-px bg-gray-200" />

      {/* Pass data to Client Component */}
      <TierList initialTiers={tiers} />
    </div>
  );
}