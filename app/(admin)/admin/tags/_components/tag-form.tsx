// File: app/(admin)/admin/tags/_components/tag-form.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertTag } from "@/app/actions/admin/tags/tag-actions";
import { toast } from "react-hot-toast";
import { Save, ArrowLeft, Loader2, Palette, Search } from "lucide-react";
import Link from "next/link";

interface TagFormProps {
  initialData?: any;
}

export default function TagForm({ initialData }: TagFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState(initialData?.color || "#3b82f6");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const res = await upsertTag(formData, initialData?.id);

    if (res.success) {
      toast.success(res.message);
      router.push("/admin/tags");
      router.refresh();
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">
          {initialData ? "Edit Tag" : "New Tag"}
        </h2>
        <Link href="/admin/tags" className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1">
           <ArrowLeft size={16}/> Back
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Basic Info Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tag Name *</label>
              <input name="name" defaultValue={initialData?.name} required placeholder="e.g. Best Seller" className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition"/>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
              <input name="slug" defaultValue={initialData?.slug} placeholder="best-seller" className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition"/>
            </div>

            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Badge Color</label>
               <div className="flex items-center gap-3">
                   <input 
                      type="color" 
                      name="color"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="h-10 w-20 p-1 border border-slate-300 rounded cursor-pointer"
                   />
                   <div className="text-sm text-slate-500 flex items-center gap-1">
                       <Palette size={14}/> Selected: {selectedColor}
                   </div>
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea name="description" defaultValue={initialData?.description} rows={2} placeholder="Description..." className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition"/>
            </div>
        </div>

        {/* SEO Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 mb-1 text-slate-800">
                <Search size={16} />
                <h3 className="font-semibold text-sm">SEO (Optional)</h3>
            </div>
            <input name="metaTitle" defaultValue={initialData?.metaTitle} placeholder="Meta Title" className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition"/>
            <textarea name="metaDesc" defaultValue={initialData?.metaDesc} rows={2} placeholder="Meta Description" className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition"/>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition flex justify-center items-center gap-2 disabled:opacity-50 shadow-lg"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {initialData ? "Update Tag" : "Create Tag"}
        </button>
      </form>
    </div>
  );
}