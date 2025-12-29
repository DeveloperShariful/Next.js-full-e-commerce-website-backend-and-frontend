// File: app/(admin)/admin/categories/_components/category-form.tsx
"use client";

import { useState } from "react";
import ImageUpload from "@/components/ui/image-upload"; // Ensure this matches your project
import { CategoryData } from "../types";
import { toast } from "react-hot-toast";
import { Save, Loader2, LayoutGrid, Globe, AlertCircle } from "lucide-react";

// Importing specific actions
import { createCategory } from "@/app/actions/admin/categories/create";
import { updateCategory } from "@/app/actions/admin/categories/update";

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

  // Helper to Flatten Tree for Dropdown Selection
  const renderOptions = (items: CategoryData[], depth = 0): React.ReactNode[] => {
    return items.flatMap((cat) => [
      <option key={cat.id} value={cat.id} disabled={cat.id === formData.id}>
        {"\u00A0\u00A0\u00A0\u00A0".repeat(depth)} {depth > 0 ? "↳ " : ""}{cat.name}
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

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Main Info & SEO */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b pb-4">
               <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><LayoutGrid size={20}/></div>
               <h3 className="font-bold text-xl text-slate-800">General Information</h3>
            </div>
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Category Name *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Slug URL</label>
                  <input type="text" value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Description</label>
                <textarea rows={6} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b pb-4">
               <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><Globe size={20}/></div>
               <h3 className="font-bold text-xl text-slate-800">SEO Configuration</h3>
            </div>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Meta Title</label>
                <input type="text" value={formData.metaTitle} onChange={(e) => setFormData({...formData, metaTitle: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Meta Description</label>
                <textarea rows={3} value={formData.metaDesc} onChange={(e) => setFormData({...formData, metaDesc: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none" />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Hierarchy, Order, Image, Save */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-lg mb-4 text-slate-800">Organization</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Parent Category</label>
                <select value={formData.parentId} onChange={(e) => setFormData({...formData, parentId: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                  <option value="none">None (Top Level)</option>
                  {renderOptions(categories)}
                </select>
                <p className="text-xs text-slate-400 flex items-center gap-1"><AlertCircle size={10}/> Nest under another category.</p>
              </div>
              
              <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">Menu Order</label>
                 <input type="number" value={formData.menuOrder} onChange={(e) => setFormData({...formData, menuOrder: parseInt(e.target.value)})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
                 <p className="text-xs text-slate-400">Lower numbers appear first (e.g., 0, 1, 2).</p>
              </div>

              <div className="flex items-center justify-between border-t pt-4 mt-4">
                <label className="font-bold text-sm text-slate-700">Active Status</label>
                <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"/>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-lg mb-4 text-slate-800">Thumbnail</h3>
            <ImageUpload value={formData.image} disabled={isSubmitting} onChange={(url) => setFormData({...formData, image: [url]})} onRemove={() => setFormData({...formData, image: []})}/>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
             {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
             {isEditing ? "Update Category" : "Save Category"}
          </button>
        </div>
      </form>
    </div>
  );
}