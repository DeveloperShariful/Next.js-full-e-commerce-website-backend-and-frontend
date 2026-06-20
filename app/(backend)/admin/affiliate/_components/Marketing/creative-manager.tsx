// File: app/(backend)/admin/affiliate/_components/Marketing/creative-manager.tsx
"use client";

import { useState, useTransition } from "react";
import {
  Edit, Trash2, Image as ImageIcon, Link as LinkIcon,
  Copy, Plus, FileText, Check, X, Loader2, Save, BarChart3
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import {
  deleteCreativeAction,
  upsertCreativeAction,
  trackCreativeUsageAction,
} from "@/app/actions/backend/affiliate/_services/marketing-assets-service";
import MediaPickerModal from "@/app/(backend)/admin/media/_components/MediaPickerModal";
import { MediaSource } from "@prisma/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CreativeData {
  id: string;
  title: string;
  type: "IMAGE" | "VIDEO" | "DOCUMENT";
  url: string;
  targetUrl?: string | null;
  width?: number | null;
  height?: number | null;
  isActive: boolean;
  description?: string | null;
  usageCount?: number;
}

interface Props {
  initialCreatives: CreativeData[];
}

type FilterType = "ALL" | "IMAGE" | "VIDEO" | "DOCUMENT";

// ── Main Component ────────────────────────────────────────────────────────────

export default function CreativeManager({ initialCreatives }: Props) {
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [editingItem, setEditingItem]   = useState<CreativeData | null>(null);
  const [isDeleting, startDelete]       = useTransition();
  const [copiedId, setCopiedId]         = useState<string | null>(null);
  const [filter, setFilter]             = useState<FilterType>("ALL");

  const filtered = filter === "ALL"
    ? initialCreatives
    : initialCreatives.filter((c) => c.type === filter);

  const countOf = (t: FilterType) =>
    t === "ALL" ? initialCreatives.length : initialCreatives.filter((c) => c.type === t).length;

  const handleCreate = () => { setEditingItem(null); setIsModalOpen(true); };
  const handleEdit   = (item: CreativeData) => { setEditingItem(item); setIsModalOpen(true); };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this asset? Any links using it will break.")) return;
    startDelete(async () => {
      const res = await deleteCreativeAction(id);
      if (res.success) { toast.success(res.message); window.location.reload(); }
      else toast.error(res.message);
    });
  };

  const handleCopy = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      toast.success("URL copied!");
      await trackCreativeUsageAction(id, "ADMIN_ACTION");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const FILTER_TABS: { key: FilterType; label: string }[] = [
    { key: "ALL",      label: "All"       },
    { key: "IMAGE",    label: "Images"    },
    { key: "VIDEO",    label: "Videos"    },
    { key: "DOCUMENT", label: "Documents" },
  ];

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-500 pb-20">

      {/* Filter tabs + Add New — WP style */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-[#c3c4c7]">
        <div className="flex flex-wrap items-center gap-0 text-[13px]">
          {FILTER_TABS.map((tab, idx) => (
            <span key={tab.key} className="flex items-center">
              {idx > 0 && <span className="text-[#c3c4c7] px-2">|</span>}
              <button
                onClick={() => setFilter(tab.key)}
                className={cn(
                  "px-0 py-1",
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
          <Plus className="w-3.5 h-3.5" /> Add New Asset
        </button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-dashed border-[#c3c4c7]">
          <ImageIcon className="w-10 h-10 text-[#c3c4c7] mb-3" />
          <p className="text-[13px] font-semibold text-[#1d2327] m-0">No creative assets found.</p>
          <p className="text-[12px] text-[#8c8f94] mt-1">Upload banners or files to help affiliates promote your brand.</p>
          <button
            onClick={handleCreate}
            className="mt-4 flex items-center gap-1.5 h-8 px-3 bg-[#2271b1] hover:bg-[#135e96] text-white text-[13px] rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add First Asset
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="group border border-[#c3c4c7] bg-white flex flex-col hover:border-[#2271b1]/40 hover:shadow-sm transition-all"
            >
              {/* Preview */}
              <div className="aspect-video bg-[#f0f0f1] relative flex items-center justify-center overflow-hidden border-b border-[#c3c4c7]">
                {item.type === "IMAGE" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-contain p-2"
                    loading="lazy"
                  />
                ) : item.type === "VIDEO" ? (
                  <div className="flex flex-col items-center gap-1 text-[#50575e]">
                    <div className="p-2 bg-white border border-[#c3c4c7] shadow-sm">
                      <LinkIcon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold text-[#646970]">Video Asset</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-[#50575e]">
                    <FileText className="w-6 h-6" />
                    <span className="text-[10px] font-semibold text-[#646970]">Document</span>
                  </div>
                )}

                {/* Hover overlay — edit / delete */}
                <div className="absolute inset-0 bg-[#1d2327]/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    title="Edit"
                    className="p-1.5 bg-white border border-[#c3c4c7] text-[#1d2327] hover:bg-[#f0f0f1] shadow-sm"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={isDeleting}
                    title="Delete"
                    className="p-1.5 bg-white border border-[#d63638]/30 text-[#d63638] hover:bg-[#fcebec] shadow-sm disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card body */}
              <div className="p-3 flex-1 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="font-semibold text-[13px] text-[#2271b1] hover:underline text-left truncate flex-1"
                    title={item.title}
                  >
                    {item.title}
                  </button>
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 border font-semibold uppercase shrink-0 rounded",
                    item.isActive
                      ? "bg-[#edfaef] text-[#00a32a] border-[#00a32a]/30"
                      : "bg-[#f0f0f1] text-[#50575e] border-[#c3c4c7]"
                  )}>
                    {item.isActive ? "Active" : "Draft"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#50575e]">
                  <span>{item.width && item.height ? `${item.width}×${item.height}px` : "Responsive"}</span>
                  <span className="flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" /> {item.usageCount ?? 0} Uses
                  </span>
                </div>

                {/* Copy URL button */}
                <div className="mt-auto pt-2 border-t border-[#f0f0f1]">
                  <button
                    onClick={() => handleCopy(item.url, item.id)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 w-full h-7 text-[12px] font-medium border rounded transition-colors",
                      copiedId === item.id
                        ? "bg-[#edfaef] text-[#00a32a] border-[#00a32a]/30"
                        : "bg-[#f6f7f7] text-[#1d2327] border-[#c3c4c7] hover:bg-[#e8e8e8] hover:border-[#8c8f94]"
                    )}
                  >
                    {copiedId === item.id
                      ? <><Check className="w-3 h-3" /> Copied!</>
                      : <><Copy className="w-3 h-3" /> Copy URL</>}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <CreativeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialData={editingItem}
        />
      )}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function CreativeModal({
  isOpen,
  onClose,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialData: CreativeData | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [openPicker, setOpenPicker]   = useState(false);

  const form = useForm({
    defaultValues: {
      id:          initialData?.id,
      title:       initialData?.title       || "",
      type:        initialData?.type        || "IMAGE",
      url:         initialData?.url         || "",
      targetUrl:   initialData?.targetUrl   || "",
      width:       initialData?.width       ?? undefined,
      height:      initialData?.height      ?? undefined,
      isActive:    initialData?.isActive    ?? true,
      description: initialData?.description || "",
    },
  });

  const watchedUrl = form.watch("url");

  const onSubmit = (data: Parameters<typeof upsertCreativeAction>[0]) => {
    startTransition(async () => {
      const res = await upsertCreativeAction(data);
      if (res.success) { toast.success(res.message); onClose(); window.location.reload(); }
      else toast.error(res.message);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 font-sans text-[#1d2327]">
      <div className="bg-white border border-[#c3c4c7] shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-4 py-3 border-b border-[#c3c4c7] flex justify-between items-center bg-[#f6f7f7] shrink-0">
          <h3 className="text-[14px] font-semibold text-[#1d2327] m-0">
            {initialData ? "Edit Asset" : "Add Marketing Asset"}
          </h3>
          <button onClick={onClose} className="p-1 text-[#50575e] hover:text-[#d63638] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          <form id="creative-form" onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">

            {/* File picker */}
            <div className="border border-[#c3c4c7] p-3 bg-[#f6f7f7]">
              <label className="text-[13px] font-semibold text-[#1d2327] block mb-2">Asset File</label>
              {watchedUrl ? (
                <div className="flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={watchedUrl}
                    alt="preview"
                    className="w-20 h-20 object-cover border border-[#c3c4c7] bg-white shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-[#646970] truncate mb-2">{watchedUrl}</p>
                    <div className="flex items-center gap-2 text-[13px]">
                      <button type="button" onClick={() => setOpenPicker(true)} className="text-[#2271b1] hover:underline">Change</button>
                      <span className="text-[#c3c4c7]">|</span>
                      <button type="button" onClick={() => form.setValue("url", "")} className="text-[#d63638] hover:underline">Remove</button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setOpenPicker(true)}
                  className="flex items-center gap-2 h-8 px-3 bg-white border border-[#c3c4c7] text-[#2271b1] text-[13px] rounded hover:bg-[#f0f6fc] hover:border-[#2271b1] transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5" /> Select file from Media Library
                </button>
              )}
              <MediaPickerModal
                open={openPicker}
                onClose={() => setOpenPicker(false)}
                onSelect={(items) => {
                  if (items[0]) form.setValue("url", items[0].url, { shouldValidate: true });
                }}
                title="Select Asset File"
                source={MediaSource.AFFILIATE}
              />
            </div>

            {/* Title + Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Title</label>
                <input
                  {...form.register("title", { required: true })}
                  className="w-full h-8 border border-[#c3c4c7] rounded px-2 text-[13px] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]/20"
                  placeholder="e.g. Summer Banner"
                />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Type</label>
                <select
                  {...form.register("type")}
                  className="w-full h-8 border border-[#c3c4c7] rounded px-2 text-[13px] bg-white outline-none focus:border-[#2271b1]"
                >
                  <option value="IMAGE">Image</option>
                  <option value="VIDEO">Video</option>
                  <option value="DOCUMENT">Document</option>
                </select>
              </div>
            </div>

            {/* Target URL */}
            <div>
              <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Target URL <span className="font-normal text-[#8c8f94]">(Optional)</span></label>
              <input
                {...form.register("targetUrl")}
                placeholder="https://myshop.com/promo"
                className="w-full h-8 border border-[#c3c4c7] rounded px-2 text-[13px] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]/20"
              />
              <p className="text-[11px] text-[#8c8f94] mt-1">Where should the user go when clicking this banner?</p>
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Width (px)</label>
                <input
                  type="number"
                  {...form.register("width")}
                  placeholder="e.g. 728"
                  className="w-full h-8 border border-[#c3c4c7] rounded px-2 text-[13px] outline-none focus:border-[#2271b1]"
                />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Height (px)</label>
                <input
                  type="number"
                  {...form.register("height")}
                  placeholder="e.g. 90"
                  className="w-full h-8 border border-[#c3c4c7] rounded px-2 text-[13px] outline-none focus:border-[#2271b1]"
                />
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="creativeIsActive"
                {...form.register("isActive")}
                className="w-4 h-4 rounded border-[#c3c4c7] text-[#2271b1] focus:ring-[#2271b1] cursor-pointer"
              />
              <label htmlFor="creativeIsActive" className="text-[13px] text-[#1d2327] cursor-pointer select-none">
                Make visible to affiliates immediately
              </label>
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
            form="creative-form"
            disabled={isPending}
            className="h-8 px-4 bg-[#2271b1] hover:bg-[#135e96] text-white text-[13px] rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Asset
          </button>
        </div>
      </div>
    </div>
  );
}
