// File: app/(admin)/admin/settings/affiliate/rules/page.tsx

import { ruleEngineService } from "@/app/actions/admin/settings/affiliate/_services/rule-engine-service";
import RuleList from "../_components/features/rules/rule-list";
import { Plus, Calculator } from "lucide-react";

export const metadata = {
  title: "Commission Rules | Admin",
};

/**
 * SERVER COMPONENT
 * Fetches dynamic commission rules sorted by priority.
 */
export default async function AffiliateRulesPage() {
  const rules = await ruleEngineService.getRules();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Dynamic Commission Rules</h2>
          <p className="text-sm text-gray-500">
            Set advanced logic (e.g., "New Customers get 20%") that overrides standard tier rates.
          </p>
        </div>
      </div>
      
      <div className="h-px bg-gray-200" />

      {/* Client Component for List & Drag-Drop */}
      <RuleList initialRules={rules} />
    </div>
  );
}