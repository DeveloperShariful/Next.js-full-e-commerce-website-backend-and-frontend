//File: app/(admin)/admin/settings/affiliate/groups/page.tsx

import { db } from "@/lib/prisma";
import GroupManager from "./_components/group-manager";
import { Users } from "lucide-react";

export const metadata = {
  title: "Affiliate Groups | Admin",
};

export default async function AffiliateGroupsPage() {
  const groups = await db.affiliateGroup.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { affiliates: true }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Affiliate Groups
          </h2>
          <p className="text-sm text-gray-500">
            Segment affiliates into VIPs, Influencers, or Standard groups to apply specific rates.
          </p>
        </div>
      </div>
      
      <div className="h-px bg-gray-200" />

      <GroupManager initialGroups={groups} />
    </div>
  );
}