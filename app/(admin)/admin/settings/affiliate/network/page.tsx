//app/(admin)/admin/settings/affiliate/network/page.tsx

import { networkService } from "@/app/actions/admin/settings/affiliates/_services/network-service";
import NetworkTree from "../_components/features/network/network-tree";
import { Network } from "lucide-react";

export const metadata = {
  title: "MLM Network | Admin",
};

export default async function NetworkPage() {
  // Fetch Full Tree
  const treeData = await networkService.getMLMTree();

  // Calculate top-level stats
  const totalRoots = treeData.length;
  const totalNodes = treeData.reduce((acc, node) => acc + 1 + node.teamSize, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Network className="w-6 h-6 text-blue-600" />
            Network Geneology
          </h2>
          <p className="text-sm text-gray-500">
            Visual hierarchy of all affiliate teams and downlines.
          </p>
        </div>
        
        <div className="flex gap-4 text-sm">
          <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
            <span className="block text-xs font-semibold uppercase">Total Roots</span>
            <span className="text-lg font-bold">{totalRoots}</span>
          </div>
          <div className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-100">
            <span className="block text-xs font-semibold uppercase">Total Members</span>
            <span className="text-lg font-bold">{totalNodes}</span>
          </div>
        </div>
      </div>
      
      <div className="h-px bg-gray-200" />

      {/* Render the Visualization Tree */}
      <div className="min-h-[500px] bg-slate-50 rounded-xl border p-6 overflow-x-auto">
        <NetworkTree nodes={treeData} />
      </div>
    </div>
  );
}