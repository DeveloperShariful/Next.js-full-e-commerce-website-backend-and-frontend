// File: app/(admin)/admin/settings/affiliate/creatives/_components/creative-modal.tsx

"use client";

import { useForm } from "react-hook-form";
import { useTransition, useEffect } from "react";
import { toast } from "sonner";
import { X, Loader2, Save } from "lucide-react";
import { AffiliateCreative, MediaType } from "@prisma/client";
import { MediaPicker } from "@/components/media/media-picker"; 

// ✅ Correct Import Path
// ✅ Use Named Import
import { upsertCreativeAction } from "@/app/actions/admin/settings/affiliates/_services/creative-service";

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
      // ✅ Call Service Method Directly
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
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

        <div className="p-6 overflow-y-auto max-h-[80vh]">
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
                          placeholder="https://gobike.au/sale"
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
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
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