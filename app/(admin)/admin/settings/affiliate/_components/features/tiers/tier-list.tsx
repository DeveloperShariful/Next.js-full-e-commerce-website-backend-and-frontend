// File: app/(admin)/admin/settings/affiliate/_components/features/tiers/tier-list.tsx

"use client";

import { useState, useTransition } from "react";
import { AffiliateTier } from "@prisma/client"; // Prisma Type
import { Edit, Trash2, Users, Trophy, Plus, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import TierModal from "./tier-modal";
import { deleteTierAction } from "@/app/actions/admin/settings/affiliates/mutations/manage-tiers";

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

  const handleCreate = () => {
    setEditingTier(null);
    setIsModalOpen(true);
  };

  const handleEdit = (tier: TierWithCount) => {
    setEditingTier(tier);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    
    startDelete(async () => {
      const result = await deleteTierAction(id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {/* Header Actions */}
        <div className="p-4 border-b bg-gray-50 flex justify-end">
          <button
            onClick={handleCreate}
            className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-all"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Tier
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-3">Tier Name</th>
                <th className="px-6 py-3">Commission</th>
                <th className="px-6 py-3">Requirements</th>
                <th className="px-6 py-3 text-center">Affiliates</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {initialTiers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Trophy className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                    <p>No tiers found. Create your first level.</p>
                  </td>
                </tr>
              ) : (
                initialTiers.map((tier) => (
                  <tr key={tier.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full shadow-sm" 
                          style={{ backgroundColor: tier.color || "#ccc" }} 
                        />
                        <span className="font-medium text-gray-900">{tier.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {Number(tier.commissionRate)}
                        {tier.commissionType === "PERCENTAGE" ? "%" : " Fixed"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {Number(tier.minSalesAmount) > 0 
                        ? `$${Number(tier.minSalesAmount)} Sales` 
                        : "No Min. Amount"}
                      <span className="mx-2 text-gray-300">|</span>
                      {tier.minSalesCount} Orders
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1 text-gray-500 bg-gray-100 px-2 py-1 rounded-md text-xs">
                        <Users className="w-3 h-3" />
                        {tier._count?.affiliates || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(tier)}
                          className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md transition-all"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tier.id)}
                          disabled={isDeleting}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all disabled:opacity-50"
                          title="Delete"
                        >
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

      {/* Modal Form */}
      {isModalOpen && (
        <TierModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          initialData={editingTier} 
        />
      )}
    </>
  );
}