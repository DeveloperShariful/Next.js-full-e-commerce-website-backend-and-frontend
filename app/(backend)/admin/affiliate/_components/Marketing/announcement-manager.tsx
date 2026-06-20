// File: app/(backend)/admin/affiliate/_components/Marketing/announcement-manager.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { AnnouncementType } from "@prisma/client";
import {
  Plus, Trash2, Megaphone, Calendar, Users, Eye, EyeOff, Edit,
  CheckCircle, AlertTriangle, Info, Loader2, Clock, X, Save, Tag, Layers
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, isFuture } from "date-fns";
import {
  upsertAnnouncementAction,
  deleteAnnouncementAction,
  toggleAnnouncementStatusAction,
  getTargetingOptions,
} from "@/app/actions/backend/affiliate/_services/marketing-assets-service";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AnnouncementWithTargets {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  isActive: boolean;
  startsAt: string | Date;
  expiresAt?: string | Date | null;
  targetGroups?: { id: string; name: string }[];
  targetTiers?: { id: string; name: string }[];
  affiliateIds?: string[];
}

interface TargetOption {
  id: string;
  name: string;
}

interface Props {
  initialData: AnnouncementWithTargets[];
}

interface AnnouncementFormData {
  id?: string;
  title: string;
  content: string;
  type: AnnouncementType;
  isActive: boolean;
  startsAt: string;
  expiresAt?: string;
  targetType: "ALL" | "SEGMENTED";
  groupIds: string[];
  tierIds: string[];
  affiliateIds: string[];
}

type StatusFilter = "ALL" | "ACTIVE" | "DRAFT" | "SCHEDULED";

// ── Helpers ───────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: AnnouncementType }) {
  const map: Record<AnnouncementType, { icon: React.ReactNode; label: string; cls: string }> = {
    INFO:    { icon: <Info className="w-3 h-3" />,          label: "Info",    cls: "bg-[#f0f6fc] text-[#2271b1] border-[#2271b1]/30"  },
    WARNING: { icon: <AlertTriangle className="w-3 h-3" />, label: "Warning", cls: "bg-[#fcf0f1] text-[#d63638] border-[#d63638]/30"  },
    SUCCESS: { icon: <CheckCircle className="w-3 h-3" />,   label: "Success", cls: "bg-[#edfaef] text-[#00a32a] border-[#00a32a]/30"  },
  };
  const { icon, label, cls } = map[type] ?? map.INFO;
  return (
    <span className={cn("flex items-center gap-1 text-[11px] px-1.5 py-0.5 border font-semibold rounded", cls)}>
      {icon} {label}
    </span>
  );
}

function getRowStatus(item: AnnouncementWithTargets): { label: string; cls: string } {
  if (!item.isActive)               return { label: "Draft",     cls: "bg-[#f0f0f1] text-[#50575e] border-[#c3c4c7]" };
  if (isFuture(new Date(item.startsAt))) return { label: "Scheduled", cls: "bg-[#fcf9e8] text-[#9a6700] border-[#dba617]/30" };
  return                                   { label: "Active",    cls: "bg-[#edfaef] text-[#00a32a] border-[#00a32a]/30"  };
}

function getFilteredItems(items: AnnouncementWithTargets[], filter: StatusFilter) {
  if (filter === "ALL")       return items;
  if (filter === "ACTIVE")    return items.filter((i) => i.isActive && !isFuture(new Date(i.startsAt)));
  if (filter === "DRAFT")     return items.filter((i) => !i.isActive);
  if (filter === "SCHEDULED") return items.filter((i) => i.isActive && isFuture(new Date(i.startsAt)));
  return items;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AnnouncementManager({ initialData }: Props) {
  const [items, setItems]         = useState<AnnouncementWithTargets[]>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AnnouncementWithTargets | null>(null);
  const [filter, setFilter]       = useState<StatusFilter>("ALL");
  const [availableTags, setAvailableTags]   = useState<TargetOption[]>([]);
  const [availableTiers, setAvailableTiers] = useState<TargetOption[]>([]);

  useEffect(() => {
    getTargetingOptions().then((data) => {
      setAvailableTags(data.groups);
      setAvailableTiers(data.tiers);
    });
  }, []);

  const handleEdit   = (item: AnnouncementWithTargets) => { setEditingItem(item); setIsModalOpen(true); };
  const handleCreate = () => { setEditingItem(null); setIsModalOpen(true); };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    const res = await deleteAnnouncementAction(id);
    if (res.success) toast.success(res.message);
    else { toast.error(res.message); window.location.reload(); }
  };

  const handleToggle = async (id: string, current: boolean) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, isActive: !current } : i)));
    const res = await toggleAnnouncementStatusAction(id, !current);
    if (res.success) toast.success(res.message);
    else {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, isActive: current } : i)));
      toast.error("Failed");
    }
  };

  const FILTER_TABS: { key: StatusFilter; label: string }[] = [
    { key: "ALL",       label: "All"       },
    { key: "ACTIVE",    label: "Active"    },
    { key: "SCHEDULED", label: "Scheduled" },
    { key: "DRAFT",     label: "Draft"     },
  ];

  const countOf = (k: StatusFilter) => getFilteredItems(items, k).length;
  const filtered = getFilteredItems(items, filter);

  return (
    <div
      className="w-full space-y-4 animate-in fade-in duration-500 pb-20"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
    >
      {/* WP Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-[#c3c4c7]">
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
          <Plus className="w-3.5 h-3.5" /> Add New
        </button>
      </div>

      {/* WP Widefat Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-dashed border-[#c3c4c7]">
          <Megaphone className="w-10 h-10 text-[#c3c4c7] mb-3" />
          <p className="text-[13px] font-semibold text-[#1d2327] m-0">No announcements found.</p>
          <p className="text-[12px] text-[#8c8f94] mt-1">Create announcements to keep affiliates informed.</p>
          <button
            onClick={handleCreate}
            className="mt-4 flex items-center gap-1.5 h-8 px-3 bg-[#2271b1] hover:bg-[#135e96] text-white text-[13px] rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Create First Announcement
          </button>
        </div>
      ) : (
        <div className="bg-white border border-[#c3c4c7] overflow-x-auto">
          <table className="w-full border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-[#f6f7f7] border-b border-[#c3c4c7]">
                <th className="text-left px-3 py-2.5 text-[12px] font-semibold text-[#1d2327]">Title</th>
                <th className="text-left px-3 py-2.5 text-[12px] font-semibold text-[#1d2327] hidden sm:table-cell">Type</th>
                <th className="text-left px-3 py-2.5 text-[12px] font-semibold text-[#1d2327] hidden md:table-cell">Audience</th>
                <th className="text-left px-3 py-2.5 text-[12px] font-semibold text-[#1d2327] hidden lg:table-cell">Published</th>
                <th className="text-left px-3 py-2.5 text-[12px] font-semibold text-[#1d2327] hidden lg:table-cell">Expires</th>
                <th className="text-center px-3 py-2.5 text-[12px] font-semibold text-[#1d2327]">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => {
                const status = getRowStatus(item);
                const hasTags  = (item.targetGroups?.length ?? 0) > 0;
                const hasTiers = (item.targetTiers?.length ?? 0) > 0;

                return (
                  <tr
                    key={item.id}
                    className={cn(
                      "group border-b border-[#f0f0f1] last:border-b-0 hover:bg-[#eaecf0] transition-colors",
                      idx % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]"
                    )}
                  >
                    {/* Title + row actions */}
                    <td className="px-3 py-2.5 max-w-[240px]">
                      <button
                        onClick={() => handleEdit(item)}
                        className="font-semibold text-[13px] text-[#2271b1] hover:underline text-left block truncate w-full"
                        title={item.title}
                      >
                        {item.title}
                      </button>
                      <p className="text-[11px] text-[#50575e] mt-0.5 line-clamp-1">{item.content}</p>
                      {/* Row actions */}
                      <div className="flex items-center mt-1 text-[12px] sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(item)} className="text-[#2271b1] hover:underline">Edit</button>
                        <span className="text-[#c3c4c7] px-1.5">|</span>
                        <button
                          onClick={() => handleToggle(item.id, item.isActive)}
                          className="text-[#2271b1] hover:underline flex items-center gap-1"
                        >
                          {item.isActive ? <><EyeOff className="w-3 h-3" /> Unpublish</> : <><Eye className="w-3 h-3" /> Publish</>}
                        </button>
                        <span className="text-[#c3c4c7] px-1.5">|</span>
                        <button onClick={() => handleDelete(item.id)} className="text-[#d63638] hover:underline">Delete</button>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-3 py-2.5 hidden sm:table-cell">
                      <TypeBadge type={item.type} />
                    </td>

                    {/* Audience */}
                    <td className="px-3 py-2.5 hidden md:table-cell">
                      {hasTags || hasTiers ? (
                        <div className="flex flex-wrap gap-1">
                          {item.targetGroups?.slice(0, 2).map((g) => (
                            <span key={g.id} className="flex items-center gap-0.5 text-[11px] bg-[#f0f6fc] text-[#2271b1] px-1.5 py-0.5 border border-[#2271b1]/20 rounded">
                              <Tag className="w-2.5 h-2.5" /> {g.name}
                            </span>
                          ))}
                          {item.targetTiers?.slice(0, 1).map((t) => (
                            <span key={t.id} className="flex items-center gap-0.5 text-[11px] bg-[#fcf9e8] text-[#9a6700] px-1.5 py-0.5 border border-[#dba617]/30 rounded">
                              <Layers className="w-2.5 h-2.5" /> {t.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="flex items-center gap-1 text-[12px] text-[#50575e]">
                          <Users className="w-3 h-3" /> All
                        </span>
                      )}
                    </td>

                    {/* Published */}
                    <td className="px-3 py-2.5 hidden lg:table-cell">
                      <span className="flex items-center gap-1 text-[12px] text-[#50575e]">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(item.startsAt), "MMM d, yyyy")}
                      </span>
                    </td>

                    {/* Expires */}
                    <td className="px-3 py-2.5 hidden lg:table-cell text-[12px] text-[#50575e]">
                      {item.expiresAt
                        ? <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(item.expiresAt), "MMM d, yyyy")}</span>
                        : "—"}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn("text-[11px] px-2 py-0.5 border font-semibold rounded", status.cls)}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footer count */}
          <div className="px-3 py-2 border-t border-[#f0f0f1] bg-[#f6f7f7] text-[12px] text-[#50575e]">
            {filtered.length} item{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}

      {isModalOpen && (
        <AnnouncementFormModal
          initialData={editingItem}
          tags={availableTags}
          tiers={availableTiers}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

interface ModalProps {
  initialData: AnnouncementWithTargets | null;
  tags: TargetOption[];
  tiers: TargetOption[];
  onClose: () => void;
  onSuccess: () => void;
}

function AnnouncementFormModal({ initialData, tags, tiers, onClose, onSuccess }: ModalProps) {
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, watch, setValue } = useForm<AnnouncementFormData>({
    defaultValues: {
      id:          initialData?.id,
      title:       initialData?.title   || "",
      content:     initialData?.content || "",
      type:        initialData?.type    || "INFO",
      isActive:    initialData?.isActive ?? true,
      startsAt:    initialData?.startsAt
        ? new Date(initialData.startsAt).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      expiresAt:   initialData?.expiresAt
        ? new Date(initialData.expiresAt).toISOString().split("T")[0]
        : "",
      targetType:  (initialData?.targetGroups?.length ?? 0) > 0 || (initialData?.targetTiers?.length ?? 0) > 0 ? "SEGMENTED" : "ALL",
      groupIds:    initialData?.targetGroups?.map((g) => g.id) || [],
      tierIds:     initialData?.targetTiers?.map((t) => t.id)  || [],
      affiliateIds: [],
    },
  });

  const targetType     = watch("targetType");
  const watchedGroupIds = watch("groupIds");
  const watchedTierIds  = watch("tierIds");

  const toggleSelection = (field: "groupIds" | "tierIds", id: string) => {
    const current = field === "groupIds" ? watchedGroupIds : watchedTierIds;
    const next = current.includes(id) ? current.filter((i) => i !== id) : [...current, id];
    setValue(field, next);
  };

  const onSubmit = (data: AnnouncementFormData) => {
    startTransition(async () => {
      const res = await upsertAnnouncementAction({
        ...data,
        startsAt: new Date(data.startsAt),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      });
      if (res.success) { toast.success(initialData ? "Updated" : "Published"); onSuccess(); }
      else toast.error(res.message);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div
        className="bg-white border border-[#c3c4c7] shadow-xl w-full max-w-xl flex flex-col max-h-[90vh]"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#c3c4c7] flex justify-between items-center bg-[#f6f7f7] shrink-0">
          <h3 className="text-[14px] font-semibold text-[#1d2327] m-0">
            {initialData ? "Edit Announcement" : "New Announcement"}
          </h3>
          <button onClick={onClose} className="p-1 text-[#50575e] hover:text-[#d63638] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          <form id="announcement-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Title */}
            <div>
              <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Title</label>
              <input
                {...register("title", { required: true })}
                placeholder="Announcement headline..."
                className="w-full h-8 border border-[#c3c4c7] rounded px-2 text-[13px] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]/20"
              />
            </div>

            {/* Type + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Notice Type</label>
                <select
                  {...register("type")}
                  className="w-full h-8 border border-[#c3c4c7] rounded px-2 text-[13px] bg-white outline-none focus:border-[#2271b1]"
                >
                  <option value="INFO">Info</option>
                  <option value="WARNING">Warning</option>
                  <option value="SUCCESS">Success</option>
                </select>
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Status</label>
                <select
                  {...register("isActive", { setValueAs: (v) => v === "true" })}
                  className="w-full h-8 border border-[#c3c4c7] rounded px-2 text-[13px] bg-white outline-none focus:border-[#2271b1]"
                >
                  <option value="true">Active (Published)</option>
                  <option value="false">Draft (Hidden)</option>
                </select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Publish Date</label>
                <input
                  type="date"
                  {...register("startsAt")}
                  className="w-full h-8 border border-[#c3c4c7] rounded px-2 text-[13px] bg-white outline-none focus:border-[#2271b1]"
                />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">
                  Expires <span className="font-normal text-[#8c8f94]">(Optional)</span>
                </label>
                <input
                  type="date"
                  {...register("expiresAt")}
                  className="w-full h-8 border border-[#c3c4c7] rounded px-2 text-[13px] bg-white outline-none focus:border-[#2271b1]"
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Message</label>
              <textarea
                {...register("content", { required: true })}
                rows={4}
                className="w-full border border-[#c3c4c7] rounded px-2 py-1.5 text-[13px] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]/20 resize-none"
                placeholder="Write your announcement message..."
              />
            </div>

            {/* Target Audience */}
            <div className="border border-[#c3c4c7] bg-[#f6f7f7]">
              <div className="px-3 py-2 border-b border-[#c3c4c7] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#50575e]" />
                <span className="text-[13px] font-semibold text-[#1d2327]">Target Audience</span>
              </div>
              <div className="p-3 space-y-3">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-[13px] cursor-pointer">
                    <input type="radio" value="ALL" {...register("targetType")} className="text-[#2271b1] focus:ring-[#2271b1]" />
                    All Affiliates
                  </label>
                  <label className="flex items-center gap-2 text-[13px] cursor-pointer">
                    <input type="radio" value="SEGMENTED" {...register("targetType")} className="text-[#2271b1] focus:ring-[#2271b1]" />
                    Specific Tags / Tiers
                  </label>
                </div>

                {targetType === "SEGMENTED" && (
                  <div className="space-y-3 pt-2 border-t border-[#e0e0e0]">
                    {/* Tags */}
                    <div>
                      <p className="text-[11px] font-semibold text-[#50575e] uppercase tracking-wide mb-1.5">By Tags</p>
                      <div className="flex flex-wrap gap-1.5">
                        {tags.length === 0
                          ? <span className="text-[11px] text-[#8c8f94] italic">No tags available</span>
                          : tags.map((g) => (
                            <button
                              key={g.id} type="button"
                              onClick={() => toggleSelection("groupIds", g.id)}
                              className={cn(
                                "flex items-center gap-1 text-[11px] px-2 py-1 border transition-colors rounded",
                                watchedGroupIds.includes(g.id)
                                  ? "bg-[#f0f6fc] text-[#2271b1] border-[#2271b1]"
                                  : "bg-white text-[#50575e] border-[#c3c4c7] hover:border-[#8c8f94]"
                              )}
                            >
                              <Tag className="w-3 h-3" /> {g.name}
                            </button>
                          ))}
                      </div>
                    </div>
                    {/* Tiers */}
                    <div>
                      <p className="text-[11px] font-semibold text-[#50575e] uppercase tracking-wide mb-1.5">By Tier</p>
                      <div className="flex flex-wrap gap-1.5">
                        {tiers.length === 0
                          ? <span className="text-[11px] text-[#8c8f94] italic">No tiers available</span>
                          : tiers.map((t) => (
                            <button
                              key={t.id} type="button"
                              onClick={() => toggleSelection("tierIds", t.id)}
                              className={cn(
                                "flex items-center gap-1 text-[11px] px-2 py-1 border transition-colors rounded",
                                watchedTierIds.includes(t.id)
                                  ? "bg-[#fcf9e8] text-[#9a6700] border-[#dba617]"
                                  : "bg-white text-[#50575e] border-[#c3c4c7] hover:border-[#8c8f94]"
                              )}
                            >
                              <Layers className="w-3 h-3" /> {t.name}
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
            form="announcement-form"
            disabled={isPending}
            className="h-8 px-4 bg-[#2271b1] hover:bg-[#135e96] text-white text-[13px] rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {initialData ? "Update" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
