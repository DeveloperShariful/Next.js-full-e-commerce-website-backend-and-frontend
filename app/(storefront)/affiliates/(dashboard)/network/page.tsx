//app/(storefront)/affiliates/network/page.tsx

import { networkService } from "@/app/actions/storefront/affiliates/_services/network-service";
import NetworkTree from "./_components/network-tree";
import { Network, UserCheck, Users, ShieldCheck } from "lucide-react";
import { db } from "@/lib/prisma";
import { requireUser } from "@/app/actions/storefront/affiliates/auth-helper";

export const metadata = {
  title: "My Network | Team",
};

export default async function NetworkPage() {
  const userId = await requireUser();
  const affiliate = await db.affiliateAccount.findUnique({ 
      where: { userId },
      select: { id: true }
  });

  if (!affiliate) return null;

  const [sponsor, tree, stats] = await Promise.all([
    networkService.getSponsor(affiliate.id),
    networkService.getNetworkTree(affiliate.id),
    networkService.getNetworkStats(affiliate.id)
  ]);

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Network className="w-6 h-6 text-indigo-600" />
          My Network
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Visualize your team hierarchy and track downline performance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Sponsor Card (Upline) */}
        <div className="bg-white border rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-full">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Sponsor</p>
            {sponsor ? (
              <div className="mt-1">
                <p className="font-semibold text-gray-900">{sponsor.user.name}</p>
                <p className="text-xs text-gray-500">{sponsor.user.email}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-1 italic">You have no upline (Root Node)</p>
            )}
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-white border rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Direct Recruits</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.directRecruits}</p>
          </div>
        </div>

        {/* Total Network Card */}
        <div className="bg-white border rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-full">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Network Volume</p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              Level 1 Earnings: <span className="text-green-600 font-bold">$0.00</span>
            </p>
            <p className="text-[10px] text-gray-400">(Coming in Reports)</p>
          </div>
        </div>
      </div>

      {/* Interactive Tree View */}
      <div className="bg-white border rounded-xl shadow-sm min-h-[400px] overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-medium text-gray-900">Organization Chart</h3>
        </div>
        <div className="p-6">
           <NetworkTree nodes={tree} />
        </div>
      </div>

    </div>
  );
}