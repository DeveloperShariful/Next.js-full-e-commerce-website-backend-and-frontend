// app/admin/attributes/_components/attribute-form.tsx

"use client";

import { useState, useEffect, useTransition } from "react";
import { AttributeData } from "../types";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";

import { createAttribute, updateAttribute, AttributeState } from "@/app/actions/admin/attribute/attribute";

interface FormProps {
  initialData: Partial<AttributeData>; 
  onSuccess: () => void;
  isEditing: boolean;
}

export function AttributeForm({ initialData, onSuccess, isEditing }: FormProps) {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  
  const [formData, setFormData] = useState({
    id: initialData.id || "",
    name: initialData.name || "",
    slug: initialData.slug || "",
    type: initialData.type || "TEXT",
    values: initialData.values?.join(", ") || "",
  });

  useEffect(() => {
    setFormData({
      id: initialData.id || "",
      name: initialData.name || "",
      slug: initialData.slug || "",
      type: initialData.type || "TEXT",
      values: initialData.values?.join(", ") || "",
    });
    setErrors({});
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const toastId = toast.loading(isEditing ? "Updating..." : "Creating...");
    const payload = new FormData();
    
    if (isEditing) payload.append("id", formData.id);
    payload.append("name", formData.name);
    payload.append("slug", formData.slug);
    payload.append("type", formData.type);
    payload.append("values", formData.values);

    startTransition(async () => {
      const res: AttributeState = isEditing 
        ? await updateAttribute(payload) 
        : await createAttribute(payload);

      if (res.success) {
        toast.success(res.message || "Operation successful!", { id: toastId });
        if (!isEditing) {
          setFormData({ id: "", name: "", slug: "", type: "TEXT", values: "" });
        }
        onSuccess();
      } else {
        toast.dismiss(toastId);
        if (res.errors) {
          setErrors(res.errors);
          toast.error("Please fix form errors");
        } else {
          toast.error(res.message || "Failed");
        }
      }
    });
  };

  const handleCancel = () => {
    onSuccess(); 
  };

  return (
    <div className="bg-transparent pr-0 lg:pr-4 animate-in fade-in duration-300">
      
      <h2 className="text-[18px] font-normal text-[#1d2327] mb-4">
        {isEditing ? "Edit attribute" : "Add new attribute"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
          <label className="block text-[14px] text-[#2c3338] mb-1">Name</label>
          <input 
            type="text" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            className={`w-full px-2 py-[5px] bg-white border rounded-[3px] text-[14px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] outline-none transition-shadow ${errors.name ? "border-[#d63638] focus:ring-1 focus:ring-[#d63638]" : "border-[#8c8f94] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"}`} 
          />
          {errors.name && <p className="text-[12px] text-[#d63638] mt-1">{errors.name[0]}</p>}
          <p className="text-[13px] text-[#646970] mt-1.5 leading-relaxed">Name for the attribute (shown on the front-end).</p>
        </div>

        <div>
          <label className="block text-[14px] text-[#2c3338] mb-1">Slug</label>
          <input 
            type="text" 
            value={formData.slug} 
            onChange={(e) => setFormData({...formData, slug: e.target.value})} 
            className={`w-full px-2 py-[5px] bg-white border rounded-[3px] text-[14px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] outline-none transition-shadow ${errors.slug ? "border-[#d63638] focus:ring-1 focus:ring-[#d63638]" : "border-[#8c8f94] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"}`} 
          />
          {errors.slug && <p className="text-[12px] text-[#d63638] mt-1">{errors.slug[0]}</p>}
          <p className="text-[13px] text-[#646970] mt-1.5 leading-relaxed">Unique slug/reference for the attribute; must be no more than 28 characters.</p>
        </div>

        <div>
          <label className="block text-[14px] text-[#2c3338] mb-1">Type</label>
          <select 
            value={formData.type} 
            onChange={(e) => setFormData({...formData, type: e.target.value})} 
            className="w-full px-2 py-[5px] bg-white border border-[#8c8f94] rounded-[3px] text-[14px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none"
          >
            <option value="TEXT">Text / Label</option>
            <option value="COLOR">Color</option>
            <option value="BUTTON">Button / Image</option>
          </select>
          <p className="text-[13px] text-[#646970] mt-1.5 leading-relaxed">Determines how this attribute's values are displayed.</p>
        </div>

        <div>
          <label className="block text-[14px] text-[#2c3338] mb-1">Terms / Values</label>
          <textarea 
            rows={4} 
            value={formData.values} 
            onChange={(e) => setFormData({...formData, values: e.target.value})} 
            className={`w-full px-2 py-[5px] bg-white border rounded-[3px] text-[14px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] outline-none resize-none transition-shadow ${errors.values ? "border-[#d63638] focus:ring-1 focus:ring-[#d63638]" : "border-[#8c8f94] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"}`} 
          />
          {errors.values && <p className="text-[12px] text-[#d63638] mt-1">{errors.values[0]}</p>}
          <p className="text-[13px] text-[#646970] mt-1.5 leading-relaxed">Comma separated values (e.g. Small, Medium, Large). For colors use valid names or hex codes.</p>
        </div>

        {/* Submit Buttons */}
        <div className="pt-4 flex items-center gap-2">
          <button 
            type="submit" 
            disabled={isPending} 
            className="px-3 py-1.5 bg-[#2271b1] text-white text-[13px] font-normal rounded-[3px] border border-[#2271b1] hover:bg-[#135e96] hover:border-[#135e96] transition-colors disabled:opacity-70 flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
             {isPending && <Loader2 className="animate-spin" size={14}/>}
             {isEditing ? "Update attribute" : "Add attribute"}
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