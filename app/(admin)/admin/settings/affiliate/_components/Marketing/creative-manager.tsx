// File: app/(admin)/admin/settings/affiliate/_components/Marketing/creative-manager.tsx

"use client";

import { useState, useTransition, useEffect } from "react";
import { AffiliateCreative, MediaType } from "@prisma/client";
import { Edit, Trash2, Image as ImageIcon, Link as LinkIcon, Copy, Plus, ExternalLink, FileText, Check, X, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { deleteCreativeAction, upsertCreativeAction } from "@/app/actions/admin/settings/affiliate/_services/marketing-assets-service";
import { MediaPicker } from "@/components/media/media-picker";

// ============================================================================
// PART 1: MAIN COMPONENT (GRID VIEW)
// ============================================================================

interface CreativeManagerProps {
  initialCreatives: AffiliateCreative[];
}

export default function CreativeManager({ initialCreatives }: CreativeManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AffiliateCreative | null>(null);
  const [isDeleting, startDelete] = useTransition();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: AffiliateCreative) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;
    
    startDelete(async () => {
      const result = await deleteCreativeAction(id);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Asset URL copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {/* Actions Header */}
        <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
          <div>
             <h3 className="font-semibold text-gray-900">Marketing Creatives</h3>
             <p className="text-xs text-gray-500">Banners, text links, and assets for affiliates.</p>
          </div>
          <button
            onClick={handleCreate}
            className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-all shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </button>
        </div>

        {/* Grid Layout for Assets */}
        {initialCreatives.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <ImageIcon className="h-10 w-10 text-gray-300 mb-3" />
            <p>No creative assets found.</p>
            <p className="text-xs text-gray-400">Upload banners to help affiliates promote better.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
            {initialCreatives.map((item) => (
              <div key={item.id} className="group border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all bg-white flex flex-col h-full">
                
                {/* Preview Area */}
                <div className="aspect-[16/9] bg-gray-100 relative flex items-center justify-center overflow-hidden border-b border-gray-100">
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
                        <div className="p-3 bg-white rounded-full shadow-sm mb-2"><LinkIcon className="w-6 h-6" /></div>
                        <span className="text-xs font-medium">VIDEO ASSET</span>
                    </div>
                  ) : (
                    <div className="text-gray-400 flex flex-col items-center">
                        <FileText className="w-8 h-8 mb-2" />
                        <span className="text-xs font-medium">DOCUMENT</span>
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shadow-sm ${item.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                        {item.isActive ? "Active" : "Draft"}
                      </span>
                  </div>

                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 bg-white rounded-full text-gray-800 hover:bg-gray-100 shadow-lg"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={isDeleting}
                      className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 shadow-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col gap-2">
                  <h3 className="font-semibold text-gray-900 truncate text-sm" title={item.title}>
                    {item.title}
                  </h3>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    {item.width && item.height && <p>Dimensions: {item.width} x {item.height}px</p>}
                    {item.targetUrl && (
                        <a href={item.targetUrl} target="_blank" className="flex items-center gap-1 text-blue-600 hover:underline truncate">
                            <ExternalLink className="w-3 h-3" /> {item.targetUrl}
                        </a>
                    )}
                  </div>

                  <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                    <button 
                        onClick={() => copyToClipboard(item.url, item.id)}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-black bg-gray-50 px-2 py-1.5 rounded-md hover:bg-gray-100 w-full justify-center transition-colors"
                    >
                        {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedId === item.id ? "Copied!" : "Copy Link"}
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

// ============================================================================
// PART 2: MODAL COMPONENT 
// ============================================================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: AffiliateCreative | null;
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const [isPending, startTransition] = useTransition();
  
  const form = useForm<CreativeFormValues>({
    defaultValues: {
      title: "",
      type: "IMAGE",
      url: "",
      targetUrl: "",
      isActive: true,
      description: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        id: initialData.id,
        title: initialData.title,
        type: initialData.type,
        url: initialData.url,
        targetUrl: initialData.targetUrl || "",
        width: initialData.width || undefined,
        height: initialData.height || undefined,
        isActive: initialData.isActive,
        description: initialData.description || "",
      });
    } else {
      form.reset({
        title: "",
        type: "IMAGE",
        url: "",
        targetUrl: "",
        isActive: true,
        description: "",
      });
    }
  }, [initialData, form, isOpen]);

  const onSubmit = (data: CreativeFormValues) => {
    startTransition(async () => {
      const result = await upsertCreativeAction(data);
      if (result.success) {
        toast.success(result.message);
        onClose();
        // Optional: Trigger refresh
        // window.location.reload(); 
      } else {
        toast.error(result.message);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">
            {initialData ? "Edit Asset" : "Add Marketing Asset"}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
            <form id="creative-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Side: Media Picker */}
                  <div className="space-y-2">
                      <MediaPicker 
                        label="Asset Image/Banner"
                        value={form.watch("url")}
                        onChange={(url) => form.setValue("url", url, { shouldValidate: true })}
                        onRemove={() => form.setValue("url", "")}
                      />
                      {form.formState.errors.url && <p className="text-red-500 text-xs mt-1">Image is required</p>}
                  </div>

                  {/* Right Side: Inputs */}
                  <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 uppercase">Title</label>
                        <input
                          {...form.register("title", { required: "Title is required" })}
                          placeholder="e.g. Summer Sale Banner"
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 uppercase">Type</label>
                        <select {...form.register("type")} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                            <option value="IMAGE">Image</option>
                            <option value="VIDEO">Video</option>
                            <option value="DOCUMENT">Document</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 uppercase">Target URL</label>
                        <input
                          {...form.register("targetUrl")}
                          placeholder={`${siteUrl}/sale`}
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none"
                        />
                      </div>
                  </div>
              </div>

              {/* Dimensions Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase">Width (px)</label>
                  <input type="number" {...form.register("width")} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase">Height (px)</label>
                  <input type="number" {...form.register("height")} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 bg-gray-50 p-3 rounded-lg border">
                <input type="checkbox" id="isActive" className="w-4 h-4 rounded text-black focus:ring-black" {...form.register("isActive")} />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-900 cursor-pointer">
                  Activate this asset immediately
                </label>
              </div>
            </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button
            type="submit"
            form="creative-form"
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {initialData ? "Update Asset" : "Add Asset"}
          </button>
        </div>
      </div>
    </div>
  );
}