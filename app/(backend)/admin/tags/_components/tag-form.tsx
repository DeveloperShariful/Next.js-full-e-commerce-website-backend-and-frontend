// File: app/(backend)/admin/tags/_components/tag-form.tsx

"use client";

import { useState, useEffect } from "react";
import { TagData } from "../types";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { createTag, updateTag } from "@/app/actions/backend/tags/tag-actions";

interface FormProps {
  initialData: Partial<TagData>; 
  onSuccess: () => void;
  isEditing: boolean;
}

export default function TagForm({ initialData, onSuccess, isEditing }: FormProps) {
  const [formData, setFormData] = useState({
    id: initialData.id || "",
    name: initialData.name || "",
    slug: initialData.slug || "",
    description: initialData.description || "",
    color: initialData.color || "#3b82f6",
    metaTitle: initialData.metaTitle || "",
    metaDesc: initialData.metaDesc || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData({
      id: initialData.id || "",
      name: initialData.name || "",
      slug: initialData.slug || "",
      description: initialData.description || "",
      color: initialData.color || "#3b82f6",
      metaTitle: initialData.metaTitle || "",
      metaDesc: initialData.metaDesc || "",
    });
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading(isEditing ? "Updating..." : "Creating...");

    const data = new FormData();
    if (isEditing) data.append("id", formData.id);
    
    data.append("name", formData.name);
    data.append("slug", formData.slug);
    data.append("description", formData.description);
    data.append("color", formData.color);
    data.append("metaTitle", formData.metaTitle);
    data.append("metaDesc", formData.metaDesc);

    try {
      const res = isEditing ? await updateTag(data) : await createTag(data);

      if (res.success) {
        toast.success(res.message as string, { id: toastId });
        if (!isEditing) {
          setFormData({ id: "", name: "", slug: "", description: "", color: "#3b82f6", metaTitle: "", metaDesc: "" });
        }
        onSuccess();
      } else {
        toast.error(res.error as string, { id: toastId });
      }
    } catch (error) {
      toast.error("Something went wrong", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onSuccess(); 
  };

  return (
    <div className="bg-transparent pr-0 lg:pr-4 animate-in fade-in duration-300">
      
      <h2 className="text-[18px] font-normal text-[#1d2327] mb-4">
        {isEditing ? "Edit tag" : "Add new tag"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Basic Fields */}
        <div>
          <label className="block text-[14px] text-[#2c3338] mb-1">Name</label>
          <input 
            type="text" 
            required 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            className="w-full px-2 py-[5px] bg-white border border-[#8c8f94] rounded-[3px] text-[14px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none transition-shadow" 
          />
          <p className="text-[13px] text-[#646970] mt-1.5 leading-relaxed">The name is how it appears on your site.</p>
        </div>

        <div>
          <label className="block text-[14px] text-[#2c3338] mb-1">Slug</label>
          <input 
            type="text" 
            value={formData.slug} 
            onChange={(e) => setFormData({...formData, slug: e.target.value})} 
            className="w-full px-2 py-[5px] bg-white border border-[#8c8f94] rounded-[3px] text-[14px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none transition-shadow" 
          />
          <p className="text-[13px] text-[#646970] mt-1.5 leading-relaxed">The "slug" is the URL-friendly version of the name. It is usually all lowercase and contains only letters, numbers, and hyphens.</p>
        </div>

        <div>
          <label className="block text-[14px] text-[#2c3338] mb-1">Badge Color</label>
          <div className="flex items-center gap-3">
             <input 
                type="color" 
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                className="h-[30px] w-16 p-0 border border-[#8c8f94] rounded-[3px] cursor-pointer shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)]"
             />
             <span className="text-[13px] font-mono text-[#50575e] uppercase">
                {formData.color}
             </span>
          </div>
          <p className="text-[13px] text-[#646970] mt-1.5 leading-relaxed">Pick a color for the tag badge (Optional).</p>
        </div>

        <div>
          <label className="block text-[14px] text-[#2c3338] mb-1">Description</label>
          <textarea 
            rows={4} 
            value={formData.description} 
            onChange={(e) => setFormData({...formData, description: e.target.value})} 
            className="w-full px-2 py-[5px] bg-white border border-[#8c8f94] rounded-[3px] text-[14px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none resize-none transition-shadow" 
          />
          <p className="text-[13px] text-[#646970] mt-1.5 leading-relaxed">The description is not prominent by default; however, some themes may show it.</p>
        </div>

        {/* Custom Meta Fields */}
        <div className="pt-4">
           <h3 className="text-[14px] font-semibold text-[#1d2327] mb-3">SEO & Settings</h3>
           
           <div className="space-y-4">
              <div>
                <label className="block text-[13px] text-[#2c3338] mb-1">Meta Title</label>
                <input 
                  type="text" 
                  value={formData.metaTitle} 
                  onChange={(e) => setFormData({...formData, metaTitle: e.target.value})} 
                  className="w-full px-2 py-[5px] bg-white border border-[#8c8f94] rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] outline-none" 
                />
              </div>
              
              <div>
                <label className="block text-[13px] text-[#2c3338] mb-1">Meta Description</label>
                <textarea 
                  rows={2} 
                  value={formData.metaDesc} 
                  onChange={(e) => setFormData({...formData, metaDesc: e.target.value})} 
                  className="w-full px-2 py-[5px] bg-white border border-[#8c8f94] rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] outline-none resize-none" 
                />
              </div>
           </div>
        </div>

        {/* Submit Buttons */}
        <div className="pt-4 flex items-center gap-2">
          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="px-3 py-1.5 bg-[#2271b1] text-white text-[13px] font-normal rounded-[3px] border border-[#2271b1] hover:bg-[#135e96] hover:border-[#135e96] transition-colors disabled:opacity-70 flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
             {isSubmitting && <Loader2 className="animate-spin" size={14}/>}
             {isEditing ? "Update tag" : "Add new tag"}
          </button>
          
          {isEditing && (
            <button 
              type="button" 
              onClick={handleCancel}
              className="px-3 py-1.5 text-[#d63638] text-[13px] hover:underline"
            >
              Cancel
            </button>
          )}
        </div>
        
      </form>
    </div>
  );
}