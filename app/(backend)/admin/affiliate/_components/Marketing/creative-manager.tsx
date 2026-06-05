// File: app/(backend)/admin/affiliate/_components/Marketing/creative-manager.tsx

"use client";

import { useState, useTransition } from "react";
import { Edit, Trash2, Image as ImageIcon, Link as LinkIcon, Copy, Plus, FileText, Check, X, Loader2, Save, BarChart3, Info } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { deleteCreativeAction, upsertCreativeAction, trackCreativeUsageAction } from "@/app/actions/backend/affiliate/_services/marketing-assets-service";
import { MediaPicker } from "@/components/media/media-picker";

// ✅ FIXED: Replaced deleted Prisma Model type with our strictly defined JSON structure
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
  usageCount?: number; // Simulated count since DB table is gone
}

interface CreativeManagerProps {
  initialCreatives: CreativeData[];
}

export default function CreativeManager({ initialCreatives }: CreativeManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CreativeData | null>(null);
  const [isDeleting, startDelete] = useTransition();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: CreativeData) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this asset? Links using it will break.")) return;
    
    startDelete(async () => {
      const result = await deleteCreativeAction(id);
      if (result.success) {
        toast.success(result.message);
        window.location.reload(); // Refresh to get updated JSON
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success("Asset URL copied!");
      
      await trackCreativeUsageAction(id, "ADMIN_ACTION"); 

      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="font-sans text-[#1d2327]">
      
      {/* WP Admin Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-4">
        <div>
          <h1 className="text-[22px] font-normal text-[#1d2327] m-0 flex items-center gap-2">
             <ImageIcon className="w-5 h-5 text-[#50575e]" /> Marketing Assets
          </h1>
          <p className="text-[13px] text-[#50575e] m-0 mt-0.5">Banners and promotional links for your partners.</p>
        </div>
        <button 
            onClick={handleCreate} 
            className="flex items-center gap-1.5 border border-[#2271b1] bg-[#2271b1] text-white px-3 py-1 text-[13px] rounded-sm hover:bg-[#135e96] hover:border-[#135e96] transition-colors cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Add New Asset
        </button>
      </div>

      <div className="bg-white border border-[#c3c4c7] shadow-sm p-4 min-h-[400px]">
        {initialCreatives.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-[#f0f0f1] border border-dashed border-[#c3c4c7]">
            <Info className="h-8 w-8 text-[#8c8f94] mb-2" />
            <p className="text-[13px] text-[#50575e] font-semibold m-0">No creative assets found.</p>
            <p className="text-[12px] text-[#8c8f94] mt-1 m-0">Upload banners or files to help affiliates promote your brand.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {initialCreatives.map((item) => (
              <div key={item.id} className="group border border-[#c3c4c7] bg-white flex flex-col hover:border-[#8c8f94] transition-colors shadow-sm">
                
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
                    <div className="text-[#50575e] flex flex-col items-center">
                        <div className="p-2 bg-white border border-[#c3c4c7] rounded-sm shadow-sm mb-1"><LinkIcon className="w-4 h-4" /></div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Video Asset</span>
                    </div>
                  ) : (
                    <div className="text-[#50575e] flex flex-col items-center">
                        <FileText className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Document</span>
                    </div>
                  )}
                  
                  {/* Hover Actions WP Style */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-1.5 bg-white border border-[#c3c4c7] text-[#1d2327] hover:bg-[#f0f0f1] shadow-sm rounded-sm"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={isDeleting}
                      className="p-1.5 bg-white border border-[#c3c4c7] text-[#d63638] hover:bg-[#fcf0f1] hover:border-[#d63638]/30 shadow-sm rounded-sm"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-3 flex-1 flex flex-col gap-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-semibold text-[#2271b1] hover:underline cursor-pointer truncate text-[13px] m-0 flex-1" title={item.title} onClick={() => handleEdit(item)}>
                        {item.title}
                    </h3>
                    <span className={`text-[9px] px-1 py-0.5 border font-bold uppercase ${item.isActive ? 'bg-[#f0f6fc] text-[#00a32a] border-[#00a32a]/30' : 'bg-[#f0f0f1] text-[#50575e] border-[#c3c4c7]'}`}>
                        {item.isActive ? "Active" : "Draft"}
                    </span>
                  </div>
                  
                  <div className="text-[11px] text-[#50575e] flex items-center justify-between">
                    <span>{item.width && item.height ? `${item.width}x${item.height}px` : "Responsive"}</span>
                    <span className="flex items-center gap-1">
                        <BarChart3 className="w-3 h-3"/> {item.usageCount || 0} Uses
                    </span>
                  </div>

                  <div className="mt-auto pt-2 border-t border-[#f0f0f1]">
                    <button 
                        onClick={() => handleCopy(item.url, item.id)}
                        className="flex items-center justify-center gap-1.5 w-full text-[12px] font-semibold text-[#2c3338] bg-[#f0f0f1] border border-[#8c8f94] hover:bg-[#e6e6e6] py-1 rounded-sm transition-colors"
                    >
                        {copiedId === item.id ? <Check className="w-3 h-3 text-[#00a32a]" /> : <Copy className="w-3 h-3" />}
                        {copiedId === item.id ? "Copied" : "Copy URL"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <CreativeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} initialData={editingItem} />
      )}
    </div>
  );
}

// ============================================================================
// WP STYLE MODAL FORM
// ============================================================================

function CreativeModal({ isOpen, onClose, initialData }: any) {
  const [isPending, startTransition] = useTransition();
  
  const form = useForm({
    defaultValues: {
      title: initialData?.title || "",
      type: initialData?.type || "IMAGE",
      url: initialData?.url || "",
      targetUrl: initialData?.targetUrl || "",
      width: initialData?.width || undefined,
      height: initialData?.height || undefined,
      isActive: initialData?.isActive ?? true,
      description: initialData?.description || "",
      id: initialData?.id
    },
  });

  const onSubmit = (data: any) => {
    startTransition(async () => {
      const result = await upsertCreativeAction(data);
      if (result.success) {
        toast.success(result.message);
        onClose();
        window.location.reload(); 
      } else {
        toast.error(result.message);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-sans text-[#1d2327]">
      <div className="bg-[#f0f0f1] border border-[#c3c4c7] shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="px-4 py-3 border-b border-[#c3c4c7] flex justify-between items-center bg-white shrink-0">
          <h3 className="text-[14px] font-semibold text-[#1d2327] m-0">
            {initialData ? "Edit Asset" : "Add Marketing Asset"}
          </h3>
          <button onClick={onClose} className="text-[#50575e] hover:text-[#d63638] focus:outline-none"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 overflow-y-auto bg-white">
            <form id="creative-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              
              <div className="border border-[#c3c4c7] p-4 bg-[#f6f7f7]">
                  <MediaPicker 
                    label="Asset File (URL)"
                    value={form.watch("url")}
                    onChange={(url) => form.setValue("url", url, { shouldValidate: true })}
                    onRemove={() => form.setValue("url", "")}
                  />
                  {form.formState.errors.url && <p className="text-[#d63638] text-[11px] mt-1">File URL is Required</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Title</label>
                    <input
                      {...form.register("title", { required: true })}
                      className="w-full border border-[#8c8f94] rounded-sm px-2 py-1.5 text-[13px] focus:border-[#2271b1] outline-none"
                      placeholder="e.g. Summer Banner"
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Type</label>
                    <select {...form.register("type")} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1.5 text-[13px] bg-white focus:border-[#2271b1] outline-none">
                        <option value="IMAGE">Image</option>
                        <option value="VIDEO">Video</option>
                        <option value="DOCUMENT">Document</option>
                    </select>
                  </div>
              </div>

              <div>
                <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Target URL (Optional)</label>
                <input
                  {...form.register("targetUrl")}
                  placeholder="https://myshop.com/promo"
                  className="w-full border border-[#8c8f94] rounded-sm px-2 py-1.5 text-[13px] focus:border-[#2271b1] outline-none"
                />
                <p className="text-[11px] text-[#8c8f94] mt-1 m-0">Where should the user go when they click this banner?</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Width (px)</label>
                  <input type="number" {...form.register("width")} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1.5 text-[13px] focus:border-[#2271b1] outline-none" placeholder="e.g. 728"/>
                </div>
                <div>
                  <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Height (px)</label>
                  <input type="number" {...form.register("height")} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1.5 text-[13px] focus:border-[#2271b1] outline-none" placeholder="e.g. 90"/>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="isActive" className="w-4 h-4 rounded-sm border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]" {...form.register("isActive")} />
                <label htmlFor="isActive" className="text-[13px] font-semibold text-[#1d2327] cursor-pointer select-none">
                  Make Visible Immediately
                </label>
              </div>
            </form>
        </div>

        <div className="p-3 border-t border-[#c3c4c7] bg-[#f0f0f1] flex justify-end gap-2 shrink-0">
          <button type="button" onClick={onClose} className="px-3 py-1.5 border border-[#8c8f94] bg-[#f0f0f1] text-[#2c3338] text-[13px] rounded-sm hover:bg-[#e6e6e6]">Cancel</button>
          <button
            type="submit"
            form="creative-form"
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-1.5 border border-[#2271b1] bg-[#2271b1] text-white text-[13px] rounded-sm hover:bg-[#135e96] disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Asset
          </button>
        </div>
      </div>
    </div>
  );
}