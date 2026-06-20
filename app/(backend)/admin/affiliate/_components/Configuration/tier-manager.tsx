// File: app/(backend)/admin/affiliate/_components/Configuration/tier-manager.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { AffiliateTier, CommissionType } from "@prisma/client";
import { Edit, Trash2, Users, Trophy, Plus, TrendingUp, X, Loader2, Save, Percent } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { deleteTierAction, upsertTierAction } from "@/app/actions/backend/affiliate/_services/tier-service";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TierWithCount extends AffiliateTier {
  _count?: { affiliates: number };
}

interface TierManagerProps {
  initialTiers: TierWithCount[];
}

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

// ── Main Component ────────────────────────────────────────────────────────────

export default function TierManager({ initialTiers }: TierManagerProps) {
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [editingTier, setEditingTier]   = useState<TierWithCount | null>(null);
  const [isDeleting, startDelete]       = useTransition();
  const { formatPrice, symbol }         = useGlobalStore();

  const handleCreate = () => { setEditingTier(null); setIsModalOpen(true); };
  const handleEdit   = (tier: TierWithCount) => { setEditingTier(tier); setIsModalOpen(true); };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this tier? Active affiliates in this tier may be affected.")) return;
    startDelete(async () => {
      const res = await deleteTierAction(id);
      if (res.success) { toast.success(res.message); window.location.reload(); }
      else toast.error(res.message);
    });
  };

  return (
    <div
      className="w-full space-y-4 animate-in fade-in duration-500 pb-20"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
    >
      {/* WP Toolbar */}
      <div className="flex items-center justify-between pb-2 border-b border-[#c3c4c7]">
        <span className="text-[13px] text-[#50575e]">
          {initialTiers.length} tier{initialTiers.length !== 1 ? "s" : ""} defined
        </span>
        <button
          onClick={handleCreate}
          className="flex items-center gap-1.5 h-8 px-3 bg-[#2271b1] hover:bg-[#135e96] text-white text-[13px] rounded transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Tier
        </button>
      </div>

      {/* WP Widefat Table */}
      {initialTiers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-dashed border-[#c3c4c7]">
          <Trophy className="w-10 h-10 text-[#c3c4c7] mb-3" />
          <p className="text-[13px] font-semibold text-[#1d2327] m-0">No tiers defined.</p>
          <p className="text-[12px] text-[#8c8f94] mt-1">Create your first rank (e.g. Silver, Gold, Platinum).</p>
          <button
            onClick={handleCreate}
            className="mt-4 flex items-center gap-1.5 h-8 px-3 bg-[#2271b1] hover:bg-[#135e96] text-white text-[13px] rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add First Tier
          </button>
        </div>
      ) : (
        <div className="bg-white border border-[#c3c4c7] overflow-x-auto">
          <table className="w-full border-collapse min-w-[540px]">
            <thead>
              <tr className="bg-[#f6f7f7] border-b border-[#c3c4c7]">
                <th className="text-left px-3 py-2.5 text-[12px] font-semibold text-[#1d2327]">Rank Name</th>
                <th className="text-left px-3 py-2.5 text-[12px] font-semibold text-[#1d2327]">Commission</th>
                <th className="text-left px-3 py-2.5 text-[12px] font-semibold text-[#1d2327] hidden md:table-cell">Requirements</th>
                <th className="text-center px-3 py-2.5 text-[12px] font-semibold text-[#1d2327] hidden sm:table-cell">Members</th>
              </tr>
            </thead>
            <tbody>
              {initialTiers.map((tier, idx) => (
                <tr
                  key={tier.id}
                  className={cn(
                    "group border-b border-[#f0f0f1] last:border-b-0 hover:bg-[#eaecf0] transition-colors",
                    idx % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]"
                  )}
                >
                  {/* Rank Name */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded flex items-center justify-center text-white font-bold text-[11px] shrink-0 border border-black/10"
                        style={{ backgroundColor: tier.color || "#2271b1" }}
                      >
                        {tier.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEdit(tier)}
                            className="font-semibold text-[13px] text-[#2271b1] hover:underline text-left"
                          >
                            {tier.name}
                          </button>
                          {tier.isDefault && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-[#f0f6fc] text-[#2271b1] border border-[#2271b1]/20 rounded font-semibold">
                              Default
                            </span>
                          )}
                        </div>
                        {/* Row actions */}
                        <div className="flex items-center mt-0.5 text-[12px] sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(tier)} className="text-[#2271b1] hover:underline flex items-center gap-1">
                            <Edit className="w-3 h-3" /> Edit
                          </button>
                          <span className="text-[#c3c4c7] px-1.5">|</span>
                          <button
                            onClick={() => handleDelete(tier.id)}
                            disabled={isDeleting}
                            className="text-[#d63638] hover:underline flex items-center gap-1 disabled:opacity-50"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Commission */}
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1 text-[12px] font-semibold bg-[#edfaef] text-[#00a32a] border border-[#00a32a]/30 px-2 py-0.5 rounded">
                      {tier.commissionType === "FIXED" ? symbol : <Percent className="w-2.5 h-2.5" />}
                      {Number(tier.commissionRate)}
                      {tier.commissionType === "PERCENTAGE" ? "%" : ""}
                    </span>
                    <span className="block text-[11px] text-[#8c8f94] mt-0.5">
                      {tier.commissionType === "PERCENTAGE" ? "Percentage" : "Fixed"}
                    </span>
                  </td>

                  {/* Requirements */}
                  <td className="px-3 py-2.5 hidden md:table-cell">
                    <div className="space-y-1 text-[12px] text-[#50575e]">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3 text-[#8c8f94] shrink-0" />
                        <span>Sales ≥ {formatPrice(Number(tier.minSalesAmount))}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-[#8c8f94] shrink-0" />
                        <span>Orders ≥ {tier.minSalesCount}</span>
                      </div>
                    </div>
                  </td>

                  {/* Members */}
                  <td className="px-3 py-2.5 text-center hidden sm:table-cell">
                    <a
                      href={`/admin/affiliate?view=partners&search=${tier.name}`}
                      className="inline-flex items-center gap-1 text-[12px] text-[#2271b1] hover:underline"
                    >
                      <Users className="w-3 h-3" />
                      {tier._count?.affiliates ?? 0}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-[#f0f0f1] bg-[#f6f7f7] text-[12px] text-[#50575e]">
            {initialTiers.length} tier{initialTiers.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}

      {isModalOpen && (
        <TierModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialData={editingTier}
        />
      )}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function TierModal({ isOpen, onClose, initialData }: ModalProps) {
  const { symbol } = useGlobalStore();
  const currency = symbol || "$";
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    defaultValues: {
      name:           "",
      commissionRate: 10,
      commissionType: "PERCENTAGE",
      minSalesAmount: 0,
      minSalesCount:  0,
      color:          "#2271b1",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        id:             initialData.id,
        name:           initialData.name,
        commissionRate: Number(initialData.commissionRate),
        commissionType: initialData.commissionType,
        minSalesAmount: Number(initialData.minSalesAmount),
        minSalesCount:  initialData.minSalesCount,
        color:          initialData.color || "#2271b1",
      });
    } else {
      form.reset({
        name:           "",
        commissionRate: 10,
        commissionType: "PERCENTAGE",
        minSalesAmount: 0,
        minSalesCount:  0,
        color:          "#2271b1",
      });
    }
  }, [initialData, form, isOpen]);

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const res = await upsertTierAction(data);
      if (res.success) { toast.success(res.message); onClose(); window.location.reload(); }
      else toast.error(res.message);
    });
  };

  if (!isOpen) return null;

  const watchedColor = form.watch("color");
  const watchedName  = form.watch("name");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div
        className="bg-white border border-[#c3c4c7] shadow-xl w-full max-w-md flex flex-col max-h-[90vh]"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#c3c4c7] flex justify-between items-center bg-[#f6f7f7] shrink-0">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border border-black/10 flex items-center justify-center text-white text-[10px] font-bold shrink-0"
              style={{ backgroundColor: watchedColor || "#2271b1" }}
            >
              {watchedName?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <h3 className="text-[14px] font-semibold text-[#1d2327] m-0">
              {initialData ? "Edit Tier" : "Add New Tier"}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-[#50575e] hover:text-[#d63638] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          <form id="tier-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* Name + Color */}
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-3">
                <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Tier Name</label>
                <input
                  {...form.register("name", { required: true })}
                  placeholder="e.g. Gold Partner"
                  className="w-full h-8 border border-[#c3c4c7] rounded px-2 text-[13px] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]/20"
                />
                {form.formState.errors.name && (
                  <p className="text-[11px] text-[#d63638] mt-0.5">Name is required</p>
                )}
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Color</label>
                <input
                  type="color"
                  {...form.register("color")}
                  className="w-full h-8 p-0.5 border border-[#c3c4c7] rounded cursor-pointer bg-white"
                />
              </div>
            </div>

            {/* Commission Rate + Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Commission Rate</label>
                <input
                  type="number"
                  step="0.01"
                  {...form.register("commissionRate", { required: true, min: 0, valueAsNumber: true })}
                  className="w-full h-8 border border-[#c3c4c7] rounded px-2 text-[13px] outline-none focus:border-[#2271b1]"
                />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Type</label>
                <select
                  {...form.register("commissionType")}
                  className="w-full h-8 border border-[#c3c4c7] rounded px-2 text-[13px] bg-white outline-none focus:border-[#2271b1]"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed ({currency})</option>
                </select>
              </div>
            </div>

            {/* Entry Requirements */}
            <div className="border border-[#c3c4c7] bg-[#f6f7f7]">
              <div className="px-3 py-2 border-b border-[#c3c4c7] flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#50575e]" />
                <span className="text-[13px] font-semibold text-[#1d2327]">Auto-upgrade Requirements</span>
              </div>
              <div className="p-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">
                    Min. Sales Amount ({currency})
                  </label>
                  <input
                    type="number"
                    {...form.register("minSalesAmount", { valueAsNumber: true })}
                    className="w-full h-8 border border-[#c3c4c7] rounded px-2 text-[13px] bg-white outline-none focus:border-[#2271b1]"
                  />
                </div>
                <div>
                  <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">
                    Min. Sales Count
                  </label>
                  <input
                    type="number"
                    {...form.register("minSalesCount", { valueAsNumber: true })}
                    className="w-full h-8 border border-[#c3c4c7] rounded px-2 text-[13px] bg-white outline-none focus:border-[#2271b1]"
                  />
                </div>
              </div>
              <p className="px-3 pb-3 text-[11px] text-[#8c8f94]">
                Affiliates are auto-promoted when they reach both targets.
              </p>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#c3c4c7] bg-[#f6f7f7] flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-3 border border-[#c3c4c7] bg-white text-[#1d2327] text-[13px] rounded hover:bg-[#f0f0f1] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="tier-form"
            disabled={isPending}
            className="h-8 px-4 bg-[#2271b1] hover:bg-[#135e96] text-white text-[13px] rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {initialData ? "Update" : "Create Tier"}
          </button>
        </div>
      </div>
    </div>
  );
}
