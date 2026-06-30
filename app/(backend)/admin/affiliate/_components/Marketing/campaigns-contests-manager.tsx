// File: app/(backend)/admin/affiliate/_components/Marketing/campaigns-contests-manager.tsx
"use client";

import { useState, useTransition } from "react";
import { isAfter, isBefore } from "date-fns";
import { formatTz } from "@/lib/store-time";
import {
  Megaphone, Trophy, Plus, Trash2, Edit, Calendar,
  MousePointer, Percent, TrendingUp, Users, Medal,
  Loader2, Save, X
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { cn } from "@/lib/utils";
import {
  deleteCampaignAction,
  deleteContestAction,
  upsertContestAction,
} from "@/app/actions/backend/affiliate/_services/engagement-service";

// ── Types ────────────────────────────────────────────────────────────────────

interface CampaignItem {
  id: string;
  name: string;
  clicks: number;
  conversions?: number;
  revenue: number;
  createdAt?: Date | string;
  affiliate: {
    slug: string;
    user: { name: string | null; image: string | null };
  };
}

interface AffiliateContestData {
  id: string;
  title: string;
  description?: string;
  startDate: string | Date;
  endDate: string | Date;
  criteria: "sales_amount" | "referral_count";
  isActive: boolean;
  prizes: {
    firstPlace: string;
    secondPlace?: string;
    thirdPlace?: string;
  };
}

interface ContestFormData {
  id?: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  criteria: "sales_amount" | "referral_count";
  isActive: boolean;
  prizes: { firstPlace: string; secondPlace?: string; thirdPlace?: string };
}

interface Props {
  campaignsData: { campaigns: CampaignItem[]; total: number };
  contestsData: AffiliateContestData[];
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CampaignsContestsManager({ campaignsData, contestsData }: Props) {
  const [activeTab, setActiveTab] = useState<"campaigns" | "contests">("campaigns");

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-500 pb-20">

      {/* WooCommerce pipe-link sub-tabs */}
      <div className="flex flex-wrap items-center gap-0 text-[13px] pb-2 border-b border-[#c3c4c7]">
        <button
          onClick={() => setActiveTab("campaigns")}
          className={cn(
            "flex items-center gap-1.5 px-0 py-1",
            activeTab === "campaigns"
              ? "font-semibold text-[#1d2327]"
              : "text-[#2271b1] hover:text-[#135e96] hover:underline"
          )}
        >
          <Megaphone className="w-3.5 h-3.5" />
          Campaigns ({campaignsData.total})
        </button>
        <span className="text-[#c3c4c7] px-2">|</span>
        <button
          onClick={() => setActiveTab("contests")}
          className={cn(
            "flex items-center gap-1.5 px-0 py-1",
            activeTab === "contests"
              ? "font-semibold text-[#1d2327]"
              : "text-[#2271b1] hover:text-[#135e96] hover:underline"
          )}
        >
          <Trophy className="w-3.5 h-3.5" />
          Sales Contests ({contestsData.length})
        </button>
      </div>

      {activeTab === "campaigns" ? (
        <CampaignsTab data={campaignsData.campaigns} totalEntries={campaignsData.total} />
      ) : (
        <ContestsTab initialContests={contestsData} />
      )}
    </div>
  );
}

// ── Campaigns Tab ─────────────────────────────────────────────────────────────

function CampaignsTab({ data, totalEntries }: { data: CampaignItem[]; totalEntries: number }) {
  const [isPending, startTransition] = useTransition();
  const { formatPrice, timezone } = useGlobalStore();

  const handleDelete = (id: string) => {
    if (!confirm("Delete this campaign?")) return;
    startTransition(async () => {
      const res = await deleteCampaignAction(id);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  return (
    <div className="bg-white border border-[#c3c4c7] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] text-left border-collapse">
          <thead>
            <tr className="border-b border-[#c3c4c7]">
              <th className="px-3 py-2 text-[13px] font-semibold text-[#1d2327] bg-[#f6f7f7]">Campaign</th>
              <th className="px-3 py-2 text-[13px] font-semibold text-[#1d2327] bg-[#f6f7f7]">Created By</th>
              <th className="px-3 py-2 text-[13px] font-semibold text-[#1d2327] bg-[#f6f7f7] text-right">Traffic</th>
              <th className="px-3 py-2 text-[13px] font-semibold text-[#1d2327] bg-[#f6f7f7] text-right">Sales</th>
              <th className="px-3 py-2 text-[13px] font-semibold text-[#1d2327] bg-[#f6f7f7] text-right">Revenue</th>
              <th className="px-3 py-2 text-[13px] font-semibold text-[#1d2327] bg-[#f6f7f7] text-center w-16">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-[#646970]">
                    <Megaphone className="w-10 h-10 text-[#c3c4c7]" />
                    <p className="text-[13px]">No active campaigns found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr
                  key={item.id}
                  className={cn(
                    "border-b border-[#f0f0f1] hover:bg-[#eaecf0] transition-colors group",
                    idx % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]"
                  )}
                >
                  {/* Campaign name */}
                  <td className="px-3 py-3">
                    <div className="font-semibold text-[#1d2327]">{item.name}</div>
                    {item.createdAt && (
                      <div className="text-[11px] text-[#50575e] flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {formatTz(new Date(item.createdAt), timezone, "MMM d, yyyy")}
                      </div>
                    )}
                  </td>

                  {/* Affiliate */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[#f0f0f1] border border-[#c3c4c7] overflow-hidden flex items-center justify-center text-[10px] font-bold text-[#646970] shrink-0">
                        {item.affiliate.user.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.affiliate.user.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          item.affiliate.user.name?.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="text-[12px] font-medium text-[#1d2327]">{item.affiliate.user.name}</div>
                        <div className="text-[10px] text-[#50575e] font-mono">/{item.affiliate.slug}</div>
                      </div>
                    </div>
                  </td>

                  {/* Traffic */}
                  <td className="px-3 py-3 text-right">
                    <span className="inline-flex items-center gap-1 text-[12px] text-[#50575e] bg-[#f0f0f1] border border-[#c3c4c7] px-2 py-0.5 rounded">
                      <MousePointer className="w-3 h-3" />
                      {item.clicks.toLocaleString()}
                    </span>
                  </td>

                  {/* Sales */}
                  <td className="px-3 py-3 text-right">
                    <span className="inline-flex items-center gap-1 text-[12px] text-[#50575e]">
                      <Percent className="w-3 h-3" />
                      {item.conversions ?? 0}
                    </span>
                  </td>

                  {/* Revenue */}
                  <td className="px-3 py-3 text-right">
                    <span className="inline-flex items-center font-mono text-[12px] font-semibold px-2 py-0.5 bg-[#edfaef] text-[#00a32a] border border-[#00a32a]/30 rounded">
                      {formatPrice(item.revenue)}
                    </span>
                  </td>

                  {/* Delete */}
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={isPending}
                      title="Delete Campaign"
                      className="p-1.5 text-[#646970] hover:text-[#d63638] hover:bg-[#fcebec] rounded transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer count */}
      <div className="border-t border-[#c3c4c7] px-4 py-3 bg-white">
        <span className="text-[13px] text-[#646970]">
          Showing <span className="font-semibold text-[#1d2327]">{data.length}</span> of{" "}
          <span className="font-semibold text-[#1d2327]">{totalEntries}</span> campaigns
        </span>
      </div>
    </div>
  );
}

// ── Contests Tab ──────────────────────────────────────────────────────────────

function ContestsTab({ initialContests }: { initialContests: AffiliateContestData[] }) {
  const { symbol, timezone } = useGlobalStore();
  const currency = symbol || " ";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AffiliateContestData | null>(null);
  const [isDeleting, startDelete] = useTransition();

  const handleCreate = () => { setEditingItem(null); setIsModalOpen(true); };
  const handleEdit   = (item: AffiliateContestData) => { setEditingItem(item); setIsModalOpen(true); };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure? This will hide the leaderboard.")) return;
    startDelete(async () => {
      const res = await deleteContestAction(id);
      if (res.success) { toast.success(res.message); window.location.reload(); }
      else toast.error(res.message);
    });
  };

  const getStatus = (start: Date, end: Date, isActive: boolean) => {
    if (!isActive) return { label: "Disabled", color: "bg-[#f0f0f1] text-[#50575e] border-[#c3c4c7]" };
    const now = new Date();
    if (isAfter(now, end))   return { label: "Ended",    color: "bg-[#fcebec] text-[#d63638] border-[#d63638]/30" };
    if (isBefore(now, start)) return { label: "Upcoming", color: "bg-[#f0f6fc] text-[#2271b1] border-[#2271b1]/30" };
    return { label: "Live Now", color: "bg-[#edfaef] text-[#00a32a] border-[#00a32a]/30" };
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex justify-end">
        <button
          onClick={handleCreate}
          className="flex items-center gap-1.5 h-8 px-3 bg-[#2271b1] hover:bg-[#135e96] text-white text-[13px] rounded transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add New Contest
        </button>
      </div>

      {/* List */}
      <div className="bg-white border border-[#c3c4c7] overflow-hidden">
        {initialContests.length === 0 ? (
          <div className="py-16 text-center">
            <div className="flex flex-col items-center gap-2 text-[#646970]">
              <Trophy className="w-10 h-10 text-[#c3c4c7]" />
              <p className="text-[13px]">No active contests found.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#f0f0f1]">
            {initialContests.map((contest, idx) => {
              const status = getStatus(new Date(contest.startDate), new Date(contest.endDate), contest.isActive);
              return (
                <div
                  key={contest.id}
                  className={cn(
                    "group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-[#eaecf0] transition-colors",
                    idx % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="p-2.5 bg-[#fcf9e8] text-[#9a6700] border border-[#dba617]/30 rounded shrink-0">
                      <Trophy className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-[14px] text-[#1d2327]">{contest.title}</span>
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-semibold border", status.color)}>
                          {status.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#50575e]">
                        <span className="flex items-center gap-1 bg-[#f0f0f1] px-1.5 py-0.5 rounded border border-[#c3c4c7]">
                          <Calendar className="w-3 h-3" />
                          {formatTz(new Date(contest.startDate), timezone, "MMM d")} – {formatTz(new Date(contest.endDate), timezone, "MMM d, yyyy")}
                        </span>
                        <span className="flex items-center gap-1 bg-[#f0f0f1] px-1.5 py-0.5 rounded border border-[#c3c4c7]">
                          {contest.criteria === "sales_amount"
                            ? <TrendingUp className="w-3 h-3" />
                            : <Users className="w-3 h-3" />}
                          {contest.criteria === "sales_amount" ? "Highest Revenue" : "Referral Count"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Medal className="w-3 h-3 text-[#9a6700]" />
                        <span className="text-[11px] font-semibold text-[#9a6700]">1st:</span>
                        <span className="text-[12px] font-semibold text-[#1d2327] bg-[#fcf9e8] px-1.5 py-0.5 rounded border border-[#dba617]/30">
                          {contest.prizes?.firstPlace || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Row actions — WP pipe-link style */}
                  <div className="flex items-center gap-1 self-end sm:self-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => handleEdit(contest)}
                      className="text-[#2271b1] hover:underline text-[12px] px-2 py-1"
                    >
                      Edit
                    </button>
                    <span className="text-[#c3c4c7]">|</span>
                    <button
                      onClick={() => handleDelete(contest.id)}
                      disabled={isDeleting}
                      className="text-[#d63638] hover:underline text-[12px] px-2 py-1 disabled:opacity-50"
                    >
                      Trash
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isModalOpen && (
        <ContestModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialData={editingItem}
          currency={currency}
        />
      )}
    </div>
  );
}

// ── Contest Modal ─────────────────────────────────────────────────────────────

function ContestModal({
  isOpen,
  onClose,
  initialData,
  currency,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialData: AffiliateContestData | null;
  currency: string;
}) {
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit } = useForm<ContestFormData>({
    defaultValues: {
      id:          initialData?.id,
      title:       initialData?.title || "",
      description: initialData?.description || "",
      startDate:   initialData?.startDate ? new Date(initialData.startDate).toISOString().split("T")[0] : "",
      endDate:     initialData?.endDate   ? new Date(initialData.endDate).toISOString().split("T")[0]   : "",
      criteria:    initialData?.criteria  || "sales_amount",
      isActive:    initialData?.isActive  ?? true,
      prizes: {
        firstPlace:  initialData?.prizes?.firstPlace  || "",
        secondPlace: initialData?.prizes?.secondPlace || "",
        thirdPlace:  initialData?.prizes?.thirdPlace  || "",
      },
    },
  });

  const onSubmit = (data: ContestFormData) => {
    startTransition(async () => {
      const res = await upsertContestAction(data);
      if (res.success) { toast.success(res.message); onClose(); window.location.reload(); }
      else toast.error(res.message);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 font-sans text-[#1d2327]">
      <div className="bg-white border border-[#c3c4c7] shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-4 py-3 border-b border-[#c3c4c7] flex justify-between items-center bg-[#f6f7f7] shrink-0">
          <h3 className="text-[14px] font-semibold text-[#1d2327] m-0">
            {initialData ? "Edit Contest" : "Create Contest"}
          </h3>
          <button onClick={onClose} className="p-1 text-[#50575e] hover:text-[#d63638] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          <form id="contest-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            <div>
              <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Title</label>
              <input
                {...register("title", { required: true })}
                className="w-full h-8 border border-[#c3c4c7] rounded px-2 text-[13px] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]/20 outline-none"
                placeholder="e.g. October Sales Challenge"
              />
            </div>

            <div className="border border-[#c3c4c7] p-3 bg-[#f6f7f7] grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-semibold text-[#50575e] block mb-1">Start Date</label>
                <input type="date" {...register("startDate", { required: true })}
                  className="w-full h-8 border border-[#c3c4c7] rounded px-2 text-[13px] bg-white outline-none focus:border-[#2271b1]" />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-[#50575e] block mb-1">End Date</label>
                <input type="date" {...register("endDate", { required: true })}
                  className="w-full h-8 border border-[#c3c4c7] rounded px-2 text-[13px] bg-white outline-none focus:border-[#2271b1]" />
              </div>
            </div>

            <div>
              <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Winning Criteria</label>
              <select {...register("criteria")}
                className="w-full h-8 border border-[#c3c4c7] rounded px-2 text-[13px] bg-white outline-none focus:border-[#2271b1]">
                <option value="sales_amount">Highest Total Revenue ({currency})</option>
                <option value="referral_count">Most Sales (Count)</option>
              </select>
            </div>

            <div className="border border-[#dba617]/40 p-4 bg-[#fcf9e8] rounded">
              <h4 className="text-[13px] font-semibold text-[#9a6700] m-0 mb-3 flex items-center gap-1.5">
                <Trophy className="w-4 h-4" /> Prizes
              </h4>
              <div className="space-y-2">
                {(["firstPlace", "secondPlace", "thirdPlace"] as const).map((place, i) => (
                  <div key={place} className="flex items-center gap-2">
                    <span className="text-lg shrink-0">{["🥇","🥈","🥉"][i]}</span>
                    <input
                      {...register(`prizes.${place}`, place === "firstPlace" ? { required: true } : {})}
                      className="flex-1 h-8 border border-[#c3c4c7] rounded px-2 text-[13px] bg-white outline-none focus:border-[#2271b1]"
                      placeholder={i === 0 ? "1st Place Reward" : `${i + 1}${["st","nd","rd"][i]} Place (Optional)`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" {...register("isActive")}
                className="w-4 h-4 rounded border-[#c3c4c7] text-[#2271b1] focus:ring-[#2271b1] cursor-pointer" />
              <label htmlFor="isActive" className="text-[13px] text-[#1d2327] cursor-pointer select-none">
                Contest is Live and visible to affiliates
              </label>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#c3c4c7] bg-[#f6f7f7] flex justify-end gap-2 shrink-0">
          <button type="button" onClick={onClose}
            className="h-8 px-3 border border-[#c3c4c7] bg-white text-[#1d2327] text-[13px] rounded hover:bg-[#f0f0f1] transition-colors">
            Cancel
          </button>
          <button type="submit" form="contest-form" disabled={isPending}
            className="h-8 px-4 bg-[#2271b1] hover:bg-[#135e96] text-white text-[13px] rounded transition-colors disabled:opacity-50 flex items-center gap-1.5">
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Contest
          </button>
        </div>
      </div>
    </div>
  );
}
