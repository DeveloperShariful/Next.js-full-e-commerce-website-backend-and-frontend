// File: app/(backend)/admin/categories/_components/category-form.tsx

"use client";

import { useState, useEffect } from "react";
import MediaPickerModal from "@/app/(backend)/admin/media/_components/MediaPickerModal";
import { MediaSource } from "@prisma/client";
import { CategoryData } from "../types";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { createCategory , updateCategory} from "@/app/actions/backend/categories/actions";


interface FormProps {
  initialData: Partial<CategoryData>; 
  categories: CategoryData[]; // Pass full tree for dropdown
  onSuccess: () => void;
  isEditing: boolean;
}

export default function CategoryForm({ initialData, categories, onSuccess, isEditing }: FormProps) {
  const [formData, setFormData] = useState({
    id: initialData.id || "",
    name: initialData.name || "",
    slug: initialData.slug || "",
    parentId: initialData.parentId || "none",
    description: initialData.description || "",
    image: initialData.image ? [initialData.image] : [],
    metaTitle: initialData.metaTitle || "",
    metaDesc: initialData.metaDesc || "",
    isActive: initialData.isActive ?? true,
    menuOrder: initialData.menuOrder || 0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openImagePicker, setOpenImagePicker] = useState(false);

  useEffect(() => {
    setFormData({
      id: initialData.id || "",
      name: initialData.name || "",
      slug: initialData.slug || "",
      parentId: initialData.parentId || "none",
      description: initialData.description || "",
      image: initialData.image ? [initialData.image] : [],
      metaTitle: initialData.metaTitle || "",
      metaDesc: initialData.metaDesc || "",
      isActive: initialData.isActive ?? true,
      menuOrder: initialData.menuOrder || 0
    });
  }, [initialData]);

  const renderOptions = (items: CategoryData[], depth = 0): React.ReactNode[] => {
    return items.flatMap((cat) => [
      <option key={cat.id} value={cat.id} disabled={cat.id === formData.id}>
        {"\u00A0\u00A0\u00A0".repeat(depth)} {depth > 0 ? "— " : ""}{cat.name}
      </option>,
      ...(cat.children ? renderOptions(cat.children, depth + 1) : [])
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading(isEditing ? "Updating..." : "Creating...");

    const data = new FormData();
    if (isEditing) data.append("id", formData.id);
    
    data.append("name", formData.name);
    data.append("slug", formData.slug);
    data.append("parentId", formData.parentId);
    data.append("description", formData.description);
    if (formData.image.length > 0) data.append("image", formData.image[0]);
    data.append("metaTitle", formData.metaTitle);
    data.append("metaDesc", formData.metaDesc);
    data.append("isActive", String(formData.isActive));
    data.append("menuOrder", String(formData.menuOrder));

    try {
      const res = isEditing ? await updateCategory(data) : await createCategory(data);

      if (res.success) {
        toast.success(res.message as string, { id: toastId });
        if (!isEditing) {
          setFormData({ id: "", name: "", slug: "", parentId: "none", description: "", image: [], metaTitle: "", metaDesc: "", isActive: true, menuOrder: 0 });
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
    // 🚀 WP Style: Transparent background, padding right to separate from table
    <div className="bg-transparent pr-0 lg:pr-4 animate-in fade-in duration-300">
      
      <h2 className="text-[18px] font-normal text-[#1d2327] mb-4">
        {isEditing ? "Edit category" : "Add new category"}
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
          <label className="block text-[14px] text-[#2c3338] mb-1">Parent category</label>
          <select 
            value={formData.parentId} 
            onChange={(e) => setFormData({...formData, parentId: e.target.value})} 
            className="w-full px-2 py-[5px] bg-white border border-[#8c8f94] rounded-[3px] text-[14px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none"
          >
            <option value="none">None</option>
            {renderOptions(categories)}
          </select>
          <p className="text-[13px] text-[#646970] mt-1.5 leading-relaxed">Assign a parent term to create a hierarchy. The term Jazz, for example, would be the parent of Bebop and Big Band.</p>
        </div>

        <div>
          <label className="block text-[14px] text-[#2c3338] mb-1">Description</label>
          <textarea 
            rows={5} 
            value={formData.description} 
            onChange={(e) => setFormData({...formData, description: e.target.value})} 
            className="w-full px-2 py-[5px] bg-white border border-[#8c8f94] rounded-[3px] text-[14px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none resize-none transition-shadow" 
          />
          <p className="text-[13px] text-[#646970] mt-1.5 leading-relaxed">The description is not prominent by default; however, some themes may show it.</p>
        </div>

        <div>
          <label className="block text-[14px] text-[#2c3338] mb-1">Thumbnail</label>
          {formData.image?.[0] ? (
            <div className="flex flex-col gap-2">
              <img src={formData.image[0]} alt="Category thumbnail" className="w-24 h-24 object-cover border border-[#c3c4c7] rounded-sm" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setOpenImagePicker(true)} className="text-[13px] text-[#2271b1] hover:underline">Change image</button>
                <span className="text-[#c3c4c7]">|</span>
                <button type="button" onClick={() => setFormData({...formData, image: []})} className="text-[13px] text-[#d63638] hover:underline">Remove</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setOpenImagePicker(true)} className="text-[13px] text-[#2271b1] hover:underline">
              Set thumbnail image
            </button>
          )}
          <MediaPickerModal
            open={openImagePicker}
            onClose={() => setOpenImagePicker(false)}
            onSelect={(items) => { if (items[0]) setFormData({...formData, image: [items[0].url]}); }}
            title="Select Category Thumbnail"
            source={MediaSource.CATEGORY}
          />
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

              <div className="grid grid-cols-2 gap-4 items-center">
                 <div>
                   <label className="block text-[13px] text-[#2c3338] mb-1">Menu Order</label>
                   <input 
                     type="number" 
                     value={formData.menuOrder} 
                     onChange={(e) => setFormData({...formData, menuOrder: parseInt(e.target.value)})} 
                     className="w-20 px-2 py-[5px] bg-white border border-[#8c8f94] rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] outline-none"
                   />
                 </div>
                 
                 <div className="flex items-center gap-2 mt-5">
                   <input 
                     type="checkbox" 
                     checked={formData.isActive} 
                     onChange={(e) => setFormData({...formData, isActive: e.target.checked})} 
                     className="w-4 h-4 text-[#2271b1] rounded-[2px] border-[#8c8f94] focus:ring-[#2271b1] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)]"
                   />
                   <label className="text-[13px] text-[#2c3338]">Is Active?</label>
                 </div>
              </div>
           </div>
        </div>

        {/* 🚀 WP Style Submit Button */}
        <div className="pt-4 flex items-center gap-2">
          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="px-3 py-1.5 bg-[#2271b1] text-white text-[13px] font-normal rounded-[3px] border border-[#2271b1] hover:bg-[#135e96] hover:border-[#135e96] transition-colors disabled:opacity-70 flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
             {isSubmitting && <Loader2 className="animate-spin" size={14}/>}
             {isEditing ? "Update category" : "Add new category"}
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