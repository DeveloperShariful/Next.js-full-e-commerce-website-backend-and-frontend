// File: app/(admin)/admin/brands/_components/brand-form.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertBrand } from "@/app/actions/admin/brands/brand-actions";
import { toast } from "react-hot-toast";
import { Save, ArrowLeft, Loader2, Globe, MapPin, Search } from "lucide-react";
import Link from "next/link";

interface BrandFormProps {
  initialData?: any; // Using any to match Prisma return type loosely or define proper interface
}

export default function BrandForm({ initialData }: BrandFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const res = await upsertBrand(formData, initialData?.id);

    if (res.success) {
      toast.success(res.message);
      router.push("/admin/brands");
      router.refresh();
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          {initialData ? "Edit Brand" : "Create New Brand"}
        </h2>
        <Link href="/admin/brands" className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1">
           <ArrowLeft size={16}/> Back to List
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Basic Info */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="font-semibold text-slate-800 mb-4">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Brand Name *</label>
                    <input name="name" defaultValue={initialData?.name} required placeholder="e.g. Shimano" className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Slug (Optional)</label>
                    <input name="slug" defaultValue={initialData?.slug} placeholder="e.g. shimano" className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition"/>
                  </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea name="description" defaultValue={initialData?.description} rows={4} placeholder="Brand description..." className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition"/>
              </div>
           </div>

           {/* SEO Section */}
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 mb-2 text-slate-800">
                  <Search size={18} />
                  <h3 className="font-semibold">SEO Configuration</h3>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Meta Title</label>
                <input name="metaTitle" defaultValue={initialData?.metaTitle} placeholder="SEO Title" className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Meta Description</label>
                <textarea name="metaDesc" defaultValue={initialData?.metaDesc} rows={2} placeholder="SEO Description" className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition"/>
              </div>
           </div>
        </div>

        {/* Right Column: Details */}
        <div className="space-y-6">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="font-semibold text-slate-800 mb-2">Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Website URL</label>
                <div className="relative">
                   <Globe size={16} className="absolute left-3 top-3 text-slate-400"/>
                   <input name="website" defaultValue={initialData?.website} placeholder="https://..." className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2 outline-none focus:border-blue-500 transition"/>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Country of Origin</label>
                <div className="relative">
                   <MapPin size={16} className="absolute left-3 top-3 text-slate-400"/>
                   <input name="countryOfOrigin" defaultValue={initialData?.countryOfOrigin} placeholder="e.g. Japan" className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2 outline-none focus:border-blue-500 transition"/>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Logo URL</label>
                <input name="logo" defaultValue={initialData?.logo} placeholder="Image URL" className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition"/>
                <p className="text-[10px] text-slate-400 mt-1">Upload functionality coming soon.</p>
              </div>
           </div>

           <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition flex justify-center items-center gap-2 disabled:opacity-50 shadow-lg"
           >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {initialData ? "Update Brand" : "Save Brand"}
           </button>
        </div>
      </form>
    </div>
  );
}