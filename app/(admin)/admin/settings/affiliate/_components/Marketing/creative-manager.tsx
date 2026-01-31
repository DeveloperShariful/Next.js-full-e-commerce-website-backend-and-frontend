// File: app/(admin)/admin/settings/affiliate/_components/Marketing/creative-manager.tsx

"use client";

import { useState, useTransition, useEffect } from "react";
import { AffiliateCreative, MediaType } from "@prisma/client";
import { Edit, Trash2, Image as ImageIcon, Link as LinkIcon, Copy, Plus, ExternalLink, FileText, Check, X, Loader2, Save, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { deleteCreativeAction, upsertCreativeAction, trackCreativeUsageAction } from "@/app/actions/admin/settings/affiliate/_services/marketing-assets-service";
import { MediaPicker } from "@/components/media/media-picker";

interface CreativeWithStats extends Omit<AffiliateCreative, 'usageCount'> {
  _count?: { usages: number };
  usageCount?: number | null; 
}

interface CreativeManagerProps {
  initialCreatives: CreativeWithStats[];
}

export default function CreativeManager({ initialCreatives }: CreativeManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CreativeWithStats | null>(null);
  const [isDeleting, startDelete] = useTransition();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: CreativeWithStats) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this asset? Links using it will break.")) return;
    
    startDelete(async () => {
      const result = await deleteCreativeAction(id);
      if (result.success) {
        toast.success(result.message);
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
    <>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
          <div>
             <h3 className="font-semibold text-gray-900 text-sm">Marketing Assets</h3>
             <p className="text-[11px] text-gray-500">Banners and links for your partners.</p>
          </div>
          <button
            onClick={handleCreate}
            className="inline-flex items-center justify-center rounded-lg bg-black px-3 py-2 text-xs font-medium text-white hover:bg-gray-800 transition-all shadow-sm"
          >
            <Plus className="mr-1.5 h-3 w-3" />
            Add Asset
          </button>
        </div>

        {initialCreatives.length === 0 ? (
          <div className="p-10 text-center text-gray-500 flex flex-col items-center">
            <ImageIcon className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm">No creative assets found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {initialCreatives.map((item) => (
              <div key={item.id} className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all bg-white flex flex-col">
                
                <div className="aspect-video bg-gray-50 relative flex items-center justify-center overflow-hidden border-b border-gray-100">
                  {item.type === "IMAGE" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={item.url} 
                      alt={item.title} 
                      className="w-full h-full object-contain p-2"
                      loading="lazy"
                    />
                  ) : item.type === "VIDEO" ? (
                    <div className="text-gray-400 flex flex-col items-center">
                        <div className="p-2 bg-white rounded-full shadow-sm mb-1"><LinkIcon className="w-5 h-5" /></div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Video Asset</span>
                    </div>
                  ) : (
                    <div className="text-gray-400 flex flex-col items-center">
                        <FileText className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Document</span>
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-1.5 bg-white rounded-full text-gray-800 hover:bg-gray-100 shadow-sm"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={isDeleting}
                      className="p-1.5 bg-white rounded-full text-red-600 hover:bg-red-50 shadow-sm"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-3 flex-1 flex flex-col gap-1.5">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-900 truncate text-xs flex-1 pr-2" title={item.title}>
                        {item.title}
                    </h3>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${item.isActive ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                        {item.isActive ? "Active" : "Draft"}
                    </span>
                  </div>
                  
                  <div className="text-[10px] text-gray-500 flex items-center gap-2">
                    {item.width && item.height && <span>{item.width}x{item.height}</span>}
                    <span className="flex items-center gap-1 ml-auto">
                        <BarChart3 className="w-3 h-3"/> {item.usageCount || item._count?.usages || 0} Uses
                    </span>
                  </div>

                  <div className="mt-auto pt-2 border-t border-gray-50">
                    <button 
                        onClick={() => handleCopy(item.url, item.id)}
                        className="flex items-center justify-center gap-1.5 w-full text-[11px] font-medium text-gray-700 hover:text-black bg-gray-50 hover:bg-gray-100 py-1.5 rounded transition-colors"
                    >
                        {copiedId === item.id ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
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
        <CreativeModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          initialData={editingItem} 
        />
      )}
    </>
  );
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: CreativeWithStats | null;
}

interface CreativeFormValues {
  id?: string;
  title: string;
  type: MediaType;
  url: string;
  targetUrl?: string;
  width?: number;
  height?: number;
  isActive: boolean;
  description?: string;
}

function CreativeModal({ isOpen, onClose, initialData }: ModalProps) {
  const [isPending, startTransition] = useTransition();
  
  const form = useForm<CreativeFormValues>({
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

  const onSubmit = (data: CreativeFormValues) => {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b shrink-0 bg-gray-50/50">
          <h3 className="text-sm font-bold text-gray-900">
            {initialData ? "Edit Asset" : "Add Marketing Asset"}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
            <form id="creative-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              
              <div className="space-y-1.5">
                  <MediaPicker 
                    label="Asset File"
                    value={form.watch("url")}
                    onChange={(url) => form.setValue("url", url, { shouldValidate: true })}
                    onRemove={() => form.setValue("url", "")}
                  />
                  {form.formState.errors.url && <p className="text-red-500 text-[10px]">Required</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Title</label>
                    <input
                      {...form.register("title", { required: true })}
                      className="w-full border rounded-md px-2.5 py-1.5 text-sm focus:ring-1 focus:ring-black outline-none"
                      placeholder="e.g. Summer Banner"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Type</label>
                    <select {...form.register("type")} className="w-full border rounded-md px-2.5 py-1.5 text-sm bg-white">
                        <option value="IMAGE">Image</option>
                        <option value="VIDEO">Video</option>
                        <option value="DOCUMENT">Document</option>
                    </select>
                  </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Target URL (Optional)</label>
                <input
                  {...form.register("targetUrl")}
                  placeholder="https://myshop.com/promo"
                  className="w-full border rounded-md px-2.5 py-1.5 text-sm focus:ring-1 focus:ring-black outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Width (px)</label>
                  <input type="number" {...form.register("width")} className="w-full border rounded-md px-2.5 py-1.5 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Height (px)</label>
                  <input type="number" {...form.register("height")} className="w-full border rounded-md px-2.5 py-1.5 text-sm" />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="isActive" className="w-4 h-4 rounded text-black focus:ring-black border-gray-300" {...form.register("isActive")} />
                <label htmlFor="isActive" className="text-xs font-medium text-gray-900 cursor-pointer select-none">
                  Make Visible Immediately
                </label>
              </div>
            </form>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2 shrink-0">
          <button type="button" onClick={onClose} className="px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button
            type="submit"
            form="creative-form"
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Save Asset
          </button>
        </div>
      </div>
    </div>
  );
}