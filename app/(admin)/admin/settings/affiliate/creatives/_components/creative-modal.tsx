// File: app/(admin)/admin/settings/affiliate/creatives/_components/creative-modal.tsx

"use client";

import { useForm } from "react-hook-form";
import { useTransition, useEffect } from "react";
import { toast } from "sonner";
import { X, Loader2, Save } from "lucide-react";
import { AffiliateCreative, MediaType } from "@prisma/client";

import { upsertCreative } from "@/app/actions/admin/settings/affiliates/mutations/manage-creatives";

interface Props {
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

export default function CreativeModal({ isOpen, onClose, initialData }: Props) {
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
      const result = await upsertCreative(data);
      if (result.success) {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
      }
    });
  };

  // Watch URL for preview
  const imageUrl = form.watch("url");
  const assetType = form.watch("type");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {initialData ? "Edit Asset" : "Add Marketing Asset"}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row h-full max-h-[80vh]">
          {/* Form Side */}
          <div className="flex-1 overflow-y-auto p-6 border-r">
            <form id="creative-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Title</label>
                <input
                  {...form.register("title", { required: "Title is required" })}
                  placeholder="e.g. Summer Sale Banner 300x250"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none"
                />
                {form.formState.errors.title && <p className="text-red-500 text-xs">{form.formState.errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Asset Type</label>
                  <select
                    {...form.register("type")}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                  >
                    <option value="IMAGE">Image</option>
                    <option value="VIDEO">Video</option>
                    <option value="DOCUMENT">Document</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Target URL (Optional)</label>
                  <input
                    {...form.register("targetUrl")}
                    placeholder="https://gobike.au/sale"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Asset Source URL</label>
                <input
                  {...form.register("url", { required: "Asset URL is required" })}
                  placeholder="https://cdn.example.com/banner.jpg"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none"
                />
                 {form.formState.errors.url && <p className="text-red-500 text-xs">{form.formState.errors.url.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Width (px)</label>
                  <input
                    type="number"
                    {...form.register("width")}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Height (px)</label>
                  <input
                    type="number"
                    {...form.register("height")}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Description (Internal)</label>
                <textarea
                  {...form.register("description")}
                  rows={2}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="isActive"
                  className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black" 
                  {...form.register("isActive")} 
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-900 cursor-pointer">
                  Asset is Active
                </label>
              </div>
            </form>
          </div>

          {/* Preview Side */}
          <div className="w-full md:w-1/3 bg-gray-50 p-6 border-l flex flex-col items-center justify-center text-center">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Preview</span>
            {imageUrl && assetType === "IMAGE" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={imageUrl} 
                alt="Preview" 
                className="max-w-full max-h-[200px] object-contain rounded shadow-sm border bg-white"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=Invalid+Image+URL'; }}
              />
            ) : (
              <div className="w-full h-[150px] border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-sm p-4">
                {imageUrl ? "No preview available for this file type" : "Enter an Image URL to preview"}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
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