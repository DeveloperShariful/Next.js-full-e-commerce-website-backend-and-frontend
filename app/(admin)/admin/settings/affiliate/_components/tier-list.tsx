// File: app/(admin)/admin/settings/affiliate/_components/tier-list.tsx

"use client";

import { useState, useTransition } from "react";
import { AffiliateTier } from "@prisma/client";
import { Edit, Trash2, Users, Trophy, Plus, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import TierModal from "./tier-modal";
import { deleteTierAction } from "@/app/actions/admin/settings/affiliates/mutations/manage-tiers";
import { useGlobalStore } from "@/app/providers/global-store-provider";

interface TierWithCount extends AffiliateTier {
  _count?: { affiliates: number };
}

interface Props {
  initialTiers: TierWithCount[];
}

export default function TierList({ initialTiers }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<TierWithCount | null>(null);
  const [isDeleting, startDelete] = useTransition();
  
  // ✅ Ultra Update: Dynamic Currency from Global Store
  const { formatPrice, symbol } = useGlobalStore();

  const handleCreate = () => {
    setEditingTier(null);
    setIsModalOpen(true);
  };

  const handleEdit = (tier: TierWithCount) => {
    setEditingTier(tier);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure? This action cannot be undone and may affect active affiliates.")) return;
    
    startDelete(async () => {
      const result = await deleteTierAction(id);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    });
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-gray-900">Commission Tiers</h3>
            <p className="text-xs text-gray-500">Define levels and auto-upgrade rules.</p>
          </div>
          <button
            onClick={handleCreate}
            className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-all shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Tier
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">Rank Name</th>
                <th className="px-6 py-3">Commission Rate</th>
                <th className="px-6 py-3">Upgrade Requirements</th>
                <th className="px-6 py-3 text-center">Members</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {initialTiers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <Trophy className="h-10 w-10 text-gray-300" />
                        <p>No tiers defined. Create your first rank (e.g. Silver).</p>
                    </div>
                  </td>
                </tr>
              ) : (
                initialTiers.map((tier) => (
                  <tr key={tier.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full shadow-sm flex items-center justify-center text-white font-bold text-xs" 
                          style={{ backgroundColor: tier.color || "#ccc" }} 
                        >
                            {tier.name.charAt(0)}
                        </div>
                        <div>
                            <span className="font-semibold text-gray-900 block">{tier.name}</span>
                            {tier.isDefault && <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 rounded">Default</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                        {tier.commissionType === "FIXED" ? symbol : ""}
                        {Number(tier.commissionRate)}
                        {tier.commissionType === "PERCENTAGE" ? "%" : ""}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs text-gray-600">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-3 h-3 text-gray-400"/>
                            <span>Sales &gt; {formatPrice(tier.minSalesAmount)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="w-3 h-3 text-gray-400"/>
                            <span>Count &gt; {tier.minSalesCount} orders</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 text-gray-700 bg-gray-100 px-3 py-1 rounded-full text-xs font-medium">
                        <Users className="w-3 h-3" />
                        {tier._count?.affiliates || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(tier)} className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-md transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(tier.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reusing Modal Component */}
      {isModalOpen && (
        <TierModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} initialData={editingTier} />
      )}
    </>
  );
}