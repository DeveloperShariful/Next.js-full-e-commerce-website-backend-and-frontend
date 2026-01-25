//app/(admin)/admin/settings/affiliate/contests/page.tsx

import { contestService } from "@/app/actions/admin/settings/affiliates/_services/contest-service";
import ContestList from "../_components/features/contests/contest-list";
import { Trophy } from "lucide-react";

export const metadata = {
  title: "Sales Contests | Affiliate Admin",
};

export default async function ContestsPage() {
  const contests = await contestService.getContests();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-600" />
            Gamification & Contests
          </h2>
          <p className="text-sm text-gray-500">
            Run sales competitions to boost affiliate performance.
          </p>
        </div>
      </div>
      
      <div className="h-px bg-gray-200" />

      {/* Render Client List */}
      <ContestList initialContests={contests} />
    </div>
  );
}