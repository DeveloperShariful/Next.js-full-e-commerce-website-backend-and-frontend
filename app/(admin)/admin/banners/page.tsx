// app/admin/banners/page.tsx

"use client";

import { useState, useEffect } from "react";
import { getBanners, saveBanner, deleteBanner } from "@/app/actions/admin/banner";
import ImageUpload from "@/components/ui/image-upload";
import { toast } from "react-hot-toast";
import { 
  Megaphone, Plus, Trash2, Pencil, Save, 
  X, Loader2, GripVertical, CheckCircle2, XCircle 
} from "lucide-react";
import Image from "next/image";

export default function BannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    title: "",
    image: [] as string[],
    link: "",
    position: 0,
    isActive: true
  });

  const fetchData = async () => {
    setLoading(true);
    const res = await getBanners();
    if (res.success) setBanners(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setFormData({ title: "", image: [], link: "", position: 0, isActive: true });
    setEditingId(null);
  };

  const handleEdit = (banner: any) => {
    setEditingId(banner.id);
    setFormData({
      title: banner.title,
      image: [banner.image],
      link: banner.link || "",
      position: banner.position,
      isActive: banner.isActive
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Delete this banner?")) return;
    const res = await deleteBanner(id);
    if(res.success) { toast.success(res.message as string); fetchData(); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(formData.image.length === 0) return toast.error("Image is required");

    const data = new FormData();
    if(editingId) data.append("id", editingId);
    data.append("title", formData.title);
    data.append("image", formData.image[0]);
    data.append("link", formData.link);
    data.append("position", String(formData.position));
    data.append("isActive", String(formData.isActive));

    const res = await saveBanner(data);
    if(res.success) {
      toast.success(res.message as string);
      resetForm();
      fetchData();
    } else {
      toast.error(res.error as string);
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen bg-[#F0F0F1] font-sans text-slate-800">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Megaphone className="text-blue-600" /> Banners & Ads
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage homepage sliders and promotional banners.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* FORM */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-6">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
               <h3 className="font-bold text-lg">{editingId ? "Edit Banner" : "Add New Banner"}</h3>
               {editingId && <button onClick={resetForm}><X size={16} className="text-red-500"/></button>}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Banner Title</label>
                  <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full mt-1 border p-2 rounded text-sm"/>
               </div>
               <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Target Link (Optional)</label>
                  <input value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} className="w-full mt-1 border p-2 rounded text-sm" placeholder="/shop/category"/>
               </div>
               <div className="flex gap-4">
                  <div className="flex-1">
                     <label className="text-xs font-bold text-slate-600 uppercase">Order Position</label>
                     <input type="number" value={formData.position} onChange={e => setFormData({...formData, position: parseInt(e.target.value)})} className="w-full mt-1 border p-2 rounded text-sm"/>
                  </div>
                  <div className="flex-1">
                     <label className="text-xs font-bold text-slate-600 uppercase">Status</label>
                     <select value={String(formData.isActive)} onChange={e => setFormData({...formData, isActive: e.target.value === 'true'})} className="w-full mt-1 border p-2 rounded text-sm bg-white">
                        <option value="true">Active</option>
                        <option value="false">Hidden</option>
                     </select>
                  </div>
               </div>
               <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">Banner Image</label>
                  <ImageUpload 
                     value={formData.image} 
                     onChange={(url) => setFormData({...formData, image: [url]})}
                     onRemove={() => setFormData({...formData, image: []})}
                  />
               </div>
               <button type="submit" className="w-full bg-slate-900 text-white py-2 rounded-lg font-bold hover:bg-slate-800 flex items-center justify-center gap-2">
                  <Save size={16}/> Save Banner
               </button>
            </form>
          </div>
        </div>

        {/* LIST */}
        <div className="lg:col-span-2">
           <div className="space-y-4">
              {loading ? <div className="text-center py-10"><Loader2 className="animate-spin inline"/></div> : 
               banners.map((banner) => (
                 <div key={banner.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4 items-center group">
                    <div className="w-32 h-20 bg-slate-100 rounded-lg overflow-hidden relative border">
                       <Image src={banner.image} alt={banner.title} fill className="object-cover"/>
                    </div>
                    <div className="flex-1">
                       <h3 className="font-bold text-slate-800">{banner.title}</h3>
                       <p className="text-xs text-slate-500 truncate">{banner.link || "No link"}</p>
                       <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded font-mono">Pos: {banner.position}</span>
                          {banner.isActive ? 
                             <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold flex gap-1 items-center"><CheckCircle2 size={10}/> Active</span> : 
                             <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold flex gap-1 items-center"><XCircle size={10}/> Hidden</span>
                          }
                       </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                       <button onClick={() => handleEdit(banner)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Pencil size={18}/></button>
                       <button onClick={() => handleDelete(banner.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={18}/></button>
                    </div>
                 </div>
               ))
              }
              {banners.length === 0 && !loading && (
                 <div className="text-center py-10 text-slate-400 bg-white rounded-xl border border-dashed">No banners found.</div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
}