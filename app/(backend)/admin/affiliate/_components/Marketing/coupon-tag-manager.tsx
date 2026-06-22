// File: app/(backend)/admin/affiliate/_components/Marketing/coupon-tag-manager.tsx
"use client";

import { useState, useTransition } from "react";
import {
  Ticket, Plus, Loader2, X, Save,
  Percent, Edit, Check, AlertCircle, Trash2, Tag
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import {
  createAndLinkCouponAction,
  unlinkCouponAction,
  updateCouponAction,
  deleteTagAction,
} from "@/app/actions/backend/affiliate/_services/coupon-tag-service";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Coupon {
  id: string;
  code: string;
  value: number;
  type: "PERCENTAGE" | "FIXED_AMOUNT" | string;
  affiliateCommissionRate?: number | null;
  affiliate?: {
    id: string;
    slug?: string;
    user: { name: string | null; email?: string };
  } | null;
  usedCount: number;
}

interface TagOption {
  id: string;
  name: string;
}


interface CouponFormData {
  code: string;
  value: number;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  affiliateId: string;
  affiliateCommissionRate: number | string;
}

interface AffiliateOption {
  id: string;
  slug: string;
  user: { name: string | null; email: string };
}

interface Props {
  couponsData: Coupon[];
  tagsData: TagOption[];
  affiliates: AffiliateOption[];
}

type MainTab = "coupons" | "tags";
type CouponFilter = "ALL" | "ASSIGNED" | "UNASSIGNED";

// ── Main Component ────────────────────────────────────────────────────────────

export default function CouponTagManager({ couponsData, tagsData, affiliates }: Props) {
  const [activeTab, setActiveTab] = useState<MainTab>("coupons");
  const [coupons, setCoupons]     = useState<Coupon[]>(couponsData);
  const [tags, setTags]           = useState<TagOption[]>(tagsData);

  return (
    <div
      className="w-full space-y-4 animate-in fade-in duration-500 pb-20"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
    >
      {/* WP pipe-link main tabs */}
      <div className="flex items-center gap-0 text-[13px] pb-2 border-b border-[#c3c4c7]">
        <button
          onClick={() => setActiveTab("coupons")}
          className={cn(
            "flex items-center gap-1.5 py-1",
            activeTab === "coupons"
              ? "font-semibold text-[#1d2327]"
              : "text-[#2271b1] hover:text-[#135e96] hover:underline"
          )}
        >
          <Ticket className="w-3.5 h-3.5" /> Coupons ({coupons.length})
        </button>
        <span className="text-[#c3c4c7] px-2">|</span>
        <button
          onClick={() => setActiveTab("tags")}
          className={cn(
            "flex items-center gap-1.5 py-1",
            activeTab === "tags"
              ? "font-semibold text-[#1d2327]"
              : "text-[#2271b1] hover:text-[#135e96] hover:underline"
          )}
        >
          <Tag className="w-3.5 h-3.5" /> Tags ({tags.length})
        </button>
      </div>

      {activeTab === "coupons" && (
        <CouponsTab coupons={coupons} setCoupons={setCoupons} affiliates={affiliates} />
      )}
      {activeTab === "tags" && (
        <TagsTab tags={tags} setTags={setTags} />
      )}
    </div>
  );
}

// ── Coupons Tab ───────────────────────────────────────────────────────────────

function CouponsTab({
  coupons,
  setCoupons,
  affiliates,
}: {
  coupons: Coupon[];
  setCoupons: React.Dispatch<React.SetStateAction<Coupon[]>>;
  affiliates: AffiliateOption[];
}) {
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [filter, setFilter]               = useState<CouponFilter>("ALL");
  const [isDeleting, startDelete]         = useTransition();
  const { formatPrice } = useGlobalStore();

  const handleCreate = () => { setEditingCoupon(null); setIsModalOpen(true); };
  const handleEdit   = (c: Coupon) => { setEditingCoupon(c); setIsModalOpen(true); };

  const handleDelete = (id: string) => {
    if (!confirm("Delete / unlink this coupon?")) return;
    startDelete(async () => {
      const res = await unlinkCouponAction(id);
      if (res.success) {
        toast.success(res.message);
        setCoupons((prev) => prev.filter((c) => c.id !== id));
      } else {
        toast.error(res.message);
      }
    });
  };

  const FILTER_TABS: { key: CouponFilter; label: string }[] = [
    { key: "ALL",        label: "All"        },
    { key: "ASSIGNED",   label: "Assigned"   },
    { key: "UNASSIGNED", label: "Unassigned" },
  ];

  const countOf = (k: CouponFilter) => {
    if (k === "ASSIGNED")   return coupons.filter((c) => !!c.affiliate).length;
    if (k === "UNASSIGNED") return coupons.filter((c) => !c.affiliate).length;
    return coupons.length;
  };

  const filtered =
    filter === "ASSIGNED"   ? coupons.filter((c) => !!c.affiliate)  :
    filter === "UNASSIGNED" ? coupons.filter((c) => !c.affiliate)   : coupons;

  return (
    <div className="space-y-3">
      {/* Sub-toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex flex-wrap items-center text-[13px]">
          {FILTER_TABS.map((tab, idx) => (
            <span key={tab.key} className="flex items-center">
              {idx > 0 && <span className="text-[#c3c4c7] px-1.5">|</span>}
              <button
                onClick={() => setFilter(tab.key)}
                className={cn(
                  "py-1",
                  filter === tab.key
                    ? "font-semibold text-[#1d2327]"
                    : "text-[#2271b1] hover:text-[#135e96] hover:underline"
                )}
              >
                {tab.label} ({countOf(tab.key)})
              </button>
            </span>
          ))}
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-1.5 h-8 px-3 bg-[#2271b1] hover:bg-[#135e96] text-white text-[13px] rounded transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> New Coupon
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-dashed border-[#c3c4c7]">
          <Ticket className="w-10 h-10 text-[#c3c4c7] mb-3" />
          <p className="text-[13px] font-semibold text-[#1d2327] m-0">No coupons found.</p>
          <p className="text-[12px] text-[#8c8f94] mt-1">Create exclusive discount codes for your affiliate partners.</p>
          <button
            onClick={handleCreate}
            className="mt-4 flex items-center gap-1.5 h-8 px-3 bg-[#2271b1] hover:bg-[#135e96] text-white text-[13px] rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Create First Coupon
          </button>
        </div>
      ) : (
        <div className="bg-white border border-[#c3c4c7] overflow-x-auto">
          <table className="w-full border-collapse min-w-[560px]">
            <thead>
              <tr className="bg-[#f6f7f7] border-b border-[#c3c4c7]">
                <th className="text-left px-3 py-2.5 text-[12px] font-semibold text-[#1d2327]">Code</th>
                <th className="text-left px-3 py-2.5 text-[12px] font-semibold text-[#1d2327]">Discount</th>
                <th className="text-left px-3 py-2.5 text-[12px] font-semibold text-[#1d2327] hidden sm:table-cell">Commission Override</th>
                <th className="text-left px-3 py-2.5 text-[12px] font-semibold text-[#1d2327] hidden md:table-cell">Assigned To</th>
                <th className="text-center px-3 py-2.5 text-[12px] font-semibold text-[#1d2327] hidden sm:table-cell">Usage</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, idx) => (
                <tr
                  key={c.id}
                  className={cn(
                    "group border-b border-[#f0f0f1] last:border-b-0 hover:bg-[#eaecf0] transition-colors",
                    idx % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]"
                  )}
                >
                  <td className="px-3 py-2.5">
                    <span className="font-mono font-bold text-[13px] text-[#2271b1] bg-[#f0f6fc] px-2 py-0.5 border border-[#2271b1]/20 rounded">
                      {c.code}
                    </span>
                    <div className="flex items-center mt-1 text-[12px] sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(c)} className="text-[#2271b1] hover:underline flex items-center gap-1">
                        <Edit className="w-3 h-3" /> Edit
                      </button>
                      <span className="text-[#c3c4c7] px-1.5">|</span>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={isDeleting}
                        className="text-[#d63638] hover:underline flex items-center gap-1 disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-[13px] font-semibold text-[#1d2327]">
                      {c.type === "PERCENTAGE" ? `${c.value}%` : formatPrice(c.value)}
                    </span>
                    <span className="block text-[11px] text-[#8c8f94]">
                      {c.type === "PERCENTAGE" ? "Percentage" : "Fixed"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 hidden sm:table-cell">
                    {c.affiliateCommissionRate ? (
                      <span className="text-[11px] font-semibold bg-[#edfaef] text-[#00a32a] border border-[#00a32a]/30 px-1.5 py-0.5 rounded">
                        {c.affiliateCommissionRate}%
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#8c8f94]">Default</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 hidden md:table-cell">
                    {c.affiliate ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded bg-[#f0f6fc] border border-[#2271b1]/20 flex items-center justify-center text-[10px] font-bold text-[#2271b1] shrink-0">
                          {c.affiliate.user.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <div className="text-[12px] font-semibold text-[#1d2327]">{c.affiliate.user.name}</div>
                          {c.affiliate.slug && (
                            <div className="text-[11px] text-[#8c8f94]">/{c.affiliate.slug}</div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[12px] text-[#8c8f94] italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center hidden sm:table-cell">
                    <span className="text-[12px] text-[#50575e]">{c.usedCount}×</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-3 py-2 border-t border-[#f0f0f1] bg-[#f6f7f7] text-[12px] text-[#50575e]">
            {filtered.length} item{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}

      {isModalOpen && (
        <CouponModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => window.location.reload()}
          initialData={editingCoupon}
          affiliates={affiliates}
        />
      )}
    </div>
  );
}

// ── Tags Tab ──────────────────────────────────────────────────────────────────

function TagsTab({
  tags,
  setTags,
}: {
  tags: TagOption[];
  setTags: React.Dispatch<React.SetStateAction<TagOption[]>>;
}) {
  const [isDeleting, startDelete] = useTransition();

  const handleDelete = (tag: TagOption) => {
    if (!confirm(`Delete tag "${tag.name}"? It will be removed from all affiliates.`)) return;
    startDelete(async () => {
      const res = await deleteTagAction(tag.id);
      if (res.success) {
        toast.success(res.message);
        setTags((prev) => prev.filter((t) => t.id !== tag.id));
      } else {
        toast.error("Failed to delete tag.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Info notice */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-[#f0f6fc] border border-[#2271b1]/20 text-[12px] text-[#2271b1]">
        <Tag className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>Tags are created automatically when assigned to affiliates in the <strong>Partners</strong> section. Here you can view and delete existing tags.</span>
      </div>

      {tags.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-dashed border-[#c3c4c7]">
          <Tag className="w-10 h-10 text-[#c3c4c7] mb-3" />
          <p className="text-[13px] font-semibold text-[#1d2327] m-0">No tags found.</p>
          <p className="text-[12px] text-[#8c8f94] mt-1">Assign tags to affiliates in the Partners section to create them.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#c3c4c7]">
          <div className="px-3 py-2.5 border-b border-[#c3c4c7] bg-[#f6f7f7]">
            <span className="text-[12px] font-semibold text-[#1d2327]">{tags.length} tag{tags.length !== 1 ? "s" : ""} in use</span>
          </div>
          <div className="p-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="group flex items-center gap-1.5 bg-[#f0f6fc] border border-[#2271b1]/20 px-2.5 py-1 hover:border-[#d63638]/30 hover:bg-[#fcebec] transition-colors"
              >
                <Tag className="w-3 h-3 text-[#2271b1] group-hover:text-[#d63638] transition-colors shrink-0" />
                <span className="text-[12px] font-semibold text-[#1d2327]">{tag.name}</span>
                <button
                  onClick={() => handleDelete(tag)}
                  disabled={isDeleting}
                  title={`Delete "${tag.name}"`}
                  className="ml-1 text-[#8c8f94] hover:text-[#d63638] disabled:opacity-50 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Coupon Modal ──────────────────────────────────────────────────────────────

interface ModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Coupon | null;
  affiliates: AffiliateOption[];
}

function CouponModal({ onClose, onSuccess, initialData, affiliates }: ModalProps) {
  const [isPending, startTransition] = useTransition();
  const { symbol } = useGlobalStore();
  const currency = symbol || "$";

  const { register, handleSubmit, watch } = useForm<CouponFormData>({
    defaultValues: {
      code:                    initialData?.code || "",
      value:                   initialData?.value || 10,
      type:                    (initialData?.type as CouponFormData["type"]) || "PERCENTAGE",
      affiliateId:             initialData?.affiliate?.id || "",
      affiliateCommissionRate: initialData?.affiliateCommissionRate || "",
    },
  });

  const onSubmit = (data: CouponFormData) => {
    startTransition(async () => {
      const rate = data.affiliateCommissionRate ? Number(data.affiliateCommissionRate) : undefined;
      const res = initialData?.id
        ? await updateCouponAction(initialData.id, data.code, Number(data.value), data.type, data.affiliateId || undefined, rate)
        : await createAndLinkCouponAction(data.affiliateId || undefined, data.code, Number(data.value), data.type, rate);

      if (res.success) {
        toast.success(initialData ? "Coupon updated" : "Coupon created");
        onSuccess();
        onClose();
      } else {
        toast.error(res.message);
      }
    });
  };

  const watchedType        = watch("type");
  const watchedAffiliateId = watch("affiliateId");
  const selectedAffiliate  = affiliates.find((a) => a.id === watchedAffiliateId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div
        className="bg-white border border-[#c3c4c7] shadow-xl w-full max-w-md flex flex-col max-h-[90vh]"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
      >
        <div className="px-4 py-3 border-b border-[#c3c4c7] flex justify-between items-center bg-[#f6f7f7] shrink-0">
          <h3 className="text-[14px] font-semibold text-[#1d2327] m-0">
            {initialData ? "Edit Coupon" : "Create New Coupon"}
          </h3>
          <button onClick={onClose} className="p-1 text-[#50575e] hover:text-[#d63638] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <form id="coupon-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Coupon Code */}
            <div>
              <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Coupon Code</label>
              <div className="relative">
                <Ticket className="absolute left-2.5 top-2 w-3.5 h-3.5 text-[#8c8f94]" />
                <input
                  {...register("code", { required: true, minLength: 3 })}
                  placeholder="e.g. SUMMER2025"
                  className="w-full h-8 border border-[#c3c4c7] rounded pl-8 pr-3 text-[13px] font-mono uppercase outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]/20"
                />
              </div>
            </div>

            {/* Type + Value */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Type</label>
                <div className="relative">
                  <select
                    {...register("type")}
                    className="w-full h-8 border border-[#c3c4c7] rounded px-2 pr-7 text-[13px] bg-white outline-none focus:border-[#2271b1] appearance-none"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed ({currency})</option>
                  </select>
                  <div className="absolute right-2 top-2 pointer-events-none text-[#8c8f94]">
                    {watchedType === "PERCENTAGE"
                      ? <Percent className="w-3.5 h-3.5" />
                      : <span className="text-[12px] font-bold">{currency}</span>}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Value</label>
                <input
                  type="number"
                  step="0.01"
                  {...register("value", { required: true, min: 0, valueAsNumber: true })}
                  className="w-full h-8 border border-[#c3c4c7] rounded px-2 text-[13px] outline-none focus:border-[#2271b1]"
                />
              </div>
            </div>

            {/* Commission Override */}
            <div className="border border-[#c3c4c7] bg-[#f6f7f7] p-3">
              <label className="text-[13px] font-semibold text-[#1d2327] flex items-center gap-1.5 mb-1">
                <AlertCircle className="w-3.5 h-3.5 text-[#9a6700]" />
                Commission Override <span className="font-normal text-[#8c8f94]">(Optional)</span>
              </label>
              <input
                type="number"
                step="0.01"
                {...register("affiliateCommissionRate")}
                placeholder="Leave empty to use default rules"
                className="w-full h-8 border border-[#c3c4c7] rounded px-2 text-[13px] bg-white outline-none focus:border-[#2271b1]"
              />
              <p className="text-[11px] text-[#8c8f94] mt-1">If set, this rate applies instead of standard commission when coupon is used.</p>
            </div>

            {/* Affiliate Dropdown */}
            <div>
              <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">
                Assign to Affiliate <span className="font-normal text-[#8c8f94]">(Optional)</span>
              </label>
              <select
                {...register("affiliateId")}
                className="w-full h-8 border border-[#c3c4c7] rounded px-2 text-[13px] bg-white outline-none focus:border-[#2271b1] appearance-none"
              >
                <option value="">— Generic coupon (no affiliate) —</option>
                {affiliates.map((aff) => (
                  <option key={aff.id} value={aff.id}>
                    {aff.user.name || aff.user.email} · /{aff.slug}
                  </option>
                ))}
              </select>
              {selectedAffiliate ? (
                <div className="flex items-center gap-1.5 mt-1.5 text-[12px] font-medium text-[#00a32a] bg-[#edfaef] border border-[#00a32a]/30 px-2 py-1 rounded">
                  <Check className="w-3 h-3 shrink-0" />
                  Assigned to: {selectedAffiliate.user.name || selectedAffiliate.user.email}
                </div>
              ) : (
                <p className="text-[11px] text-[#8c8f94] mt-1">Leave unselected to create a generic coupon accessible by anyone.</p>
              )}
            </div>

          </form>
        </div>

        <div className="px-4 py-3 border-t border-[#c3c4c7] bg-[#f6f7f7] flex justify-end gap-2 shrink-0">
          <button type="button" onClick={onClose} className="h-8 px-3 border border-[#c3c4c7] bg-white text-[#1d2327] text-[13px] rounded hover:bg-[#f0f0f1] transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            form="coupon-form"
            disabled={isPending}
            className="h-8 px-4 bg-[#2271b1] hover:bg-[#135e96] text-white text-[13px] rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {initialData ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
