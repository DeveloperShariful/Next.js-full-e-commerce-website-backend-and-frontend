//File: app/(admin)/admin/settings/affiliate/mlm-configuration/page.tsx

import { db } from "@/lib/prisma";
import MLMForm from "./_components/mlm-form";
import { Network } from "lucide-react";

export const metadata = {
  title: "MLM Configuration | Admin",
};

export default async function MLMConfigurationPage() {
  // Fetch existing config
  const settings = await db.affiliateMLMConfig.findUnique({
    where: { id: "mlm_config" }
  });

  // Default if not exists
  const initialData = settings || {
    isEnabled: false,
    maxLevels: 3,
    levelRates: { "1": 10, "2": 5, "3": 2 }, // Default JSON
    commissionBasis: "SALES_AMOUNT"
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Network className="w-6 h-6 text-indigo-600" />
            Network (MLM) Settings
          </h2>
          <p className="text-sm text-gray-500">
            Configure multi-level commission structure. Determine how many levels deep commissions should flow.
          </p>
        </div>
      </div>
      
      <div className="h-px bg-gray-200" />

      <MLMForm initialData={initialData as any} />
    </div>
  );
}