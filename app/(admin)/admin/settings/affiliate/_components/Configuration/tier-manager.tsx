// File: app/(admin)/admin/settings/affiliate/_components/Configuration/tier-manager.tsx

"use client";

import { useState, useTransition, useEffect } from "react";
import { AffiliateTier, CommissionType } from "@prisma/client";
import { Edit, Trash2, Users, Trophy, Plus, TrendingUp, X, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { deleteTierAction, upsertTierAction } from "@/app/actions/admin/settings/affiliate/_services/tier-service";

// ============================================================================
// PART 1: MAIN COMPONENT (LIST VIEW)
// ============================================================================

interface TierWithCount extends AffiliateTier {
  _count?: { affiliates: number };
}

interface TierManagerProps {
  initialTiers: TierWithCount[];
}

export default function TierManager({ initialTiers }: TierManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<TierWithCount | null>(null);
  const [isDeleting, startDelete] = useTransition();
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
                      <a href={`/admin/settings/affiliate?view=partners&search=${tier.name}`}
                       className="inline-flex items-center gap-1.5 text-gray-700 bg-gray-100 px-3 py-1 rounded-full text-xs font-medium">
                        <Users className="w-3 h-3" />
                        {tier._count?.affiliates || 0}
                      </a>
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

// ============================================================================
// PART 2: MODAL COMPONENT (MERGED)
// ============================================================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: AffiliateTier | null;
}

interface FormValues {
  id?: string;
  name: string;
  commissionRate: number;
  commissionType: CommissionType;
  minSalesAmount: number;
  minSalesCount: number;
  color: string;
}

function TierModal({ isOpen, onClose, initialData }: ModalProps) {
  const { symbol } = useGlobalStore(); 
  const currency = symbol || "";
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    defaultValues: {
      name: "",
      commissionRate: 10,
      commissionType: "PERCENTAGE",
      minSalesAmount: 0,
      minSalesCount: 0,
      color: "#2271b1",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        id: initialData.id,
        name: initialData.name,
        commissionRate: Number(initialData.commissionRate),
        commissionType: initialData.commissionType,
        minSalesAmount: Number(initialData.minSalesAmount),
        minSalesCount: initialData.minSalesCount,
        color: initialData.color || "#2271b1",
      });
    } else {
      form.reset({
        name: "",
        commissionRate: 10,
        commissionType: "PERCENTAGE",
        minSalesAmount: 0,
        minSalesCount: 0,
        color: "#2271b1",
      });
    }
  }, [initialData, form, isOpen]);

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = await upsertTierAction(data);
      if (result.success) {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {initialData ? "Edit Tier" : "Create New Tier"}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
          
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-3 space-y-2">
              <label className="text-sm font-medium text-gray-700">Tier Name</label>
              <input
                {...form.register("name", { required: "Name is required" })}
                placeholder="e.g. Gold Partner"
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none"
              />
              {form.formState.errors.name && <p className="text-red-500 text-xs">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Color</label>
              <input
                type="color"
                {...form.register("color")}
                className="w-full h-[38px] p-1 border rounded-md cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Commission Rate</label>
              <input
                type="number"
                step="0.01"
                {...form.register("commissionRate", { min: 0, required: true })}
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Type</label>
              <select
                {...form.register("commissionType")}
                className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-black/5 outline-none"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount ({currency})</option>
              </select>
            </div>
          </div>

          <div className="h-px bg-gray-100 my-2" />
          
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Entry Requirements</h4>
            <p className="text-xs text-gray-400">Affiliates are auto-promoted when they hit these targets.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Min. Sales Amount ({currency})</label>
              <input
                type="number"
                {...form.register("minSalesAmount")}
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Min. Sales Count</label>
              <input
                type="number"
                {...form.register("minSalesCount")}
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {initialData ? "Update Tier" : "Create Tier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}