// app/admin/media/page.tsx

"use client";

import { useState, useEffect } from "react";
import { getAllMedia, saveMedia, deleteMedia, MediaItem } from "@/app/actions/media";
import ImageUpload from "@/components/ui/image-upload"; 
import { toast } from "react-hot-toast";
import { 
  Image as ImageIcon, Copy, RefreshCcw, 
  Loader2, Search, UploadCloud, Check, Trash2 
} from "lucide-react";
import Image from "next/image";

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const res = await getAllMedia();
    if (res.success) {
      setMedia(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- 🔥 INSTANT SAVE & UPDATE LOGIC ---
  const handleUpload = async (url: string) => {
    // 1. Save to DB
    const res = await saveMedia(url);
    
    if (res.success && res.data) {
        // 2. Update UI instantly without reload
        setMedia((prev) => [res.data!, ...prev]);
        toast.success("Image saved to library!");
    } else {
        toast.error("Failed to save image.");
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Delete this image?")) return;
    const res = await deleteMedia(id);
    if(res.success) {
        setMedia(prev => prev.filter(item => item.id !== id)); // Remove from UI
        toast.success("Image deleted");
    }
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter Logic
  const filteredMedia = media.filter(item => {
    const matchesFilter = filter === "ALL" || item.type === filter;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-6 max-w-[1920px] mx-auto min-h-screen bg-[#F8F9FA] font-sans text-slate-800">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <ImageIcon className="text-indigo-600" size={32} /> 
            Media Library
          </h1>
          <p className="text-sm text-slate-500 mt-1 ml-1">Manage all your digital assets in one place.</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition flex items-center gap-2 shadow-sm">
             <RefreshCcw size={16} className={loading ? "animate-spin" : ""}/> Sync Media
        </button>
      </div>

      {/* UPLOAD SECTION */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mb-10">
         <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full"><UploadCloud size={32} /></div>
            <div>
                <h3 className="text-lg font-bold text-slate-800">Upload New Files</h3>
                <p className="text-slate-500 text-sm mt-1">Images will be saved to the "UPLOADED" tab.</p>
            </div>
            
            <div className="w-full max-w-xl mx-auto mt-4">
                <div className="border-2 border-dashed border-indigo-100 rounded-xl p-2 bg-indigo-50/30 hover:bg-indigo-50/50 transition">
                    <ImageUpload 
                        value={[]} // Always empty so new uploads don't get stuck in preview
                        disabled={false}
                        onChange={(url) => handleUpload(url)} // ✅ Calls save immediately
                        onRemove={() => {}}
                    />
                </div>
            </div>
         </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 sticky top-0 z-10 bg-[#F8F9FA]/90 backdrop-blur-md py-4 border-b border-transparent md:border-slate-200/50">
         <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto max-w-full">
            {/* ✅ Added UPLOADED Tab */}
            {["ALL", "UPLOADED", "PRODUCT", "CATEGORY", "USER"].map((type) => (
                <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                    filter === type 
                    ? "bg-slate-900 text-white shadow-md" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
                >
                {type}
                </button>
            ))}
         </div>
         <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input type="text" placeholder="Search by name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-sm"/>
         </div>
      </div>

      {/* GALLERY GRID */}
      {loading ? (
         <div className="flex flex-col justify-center items-center h-64 text-slate-500 gap-3">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
            <span className="font-medium text-sm">Loading gallery...</span>
         </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
           {filteredMedia.length === 0 ? (
               <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                   <ImageIcon size={64} className="mb-4 opacity-20"/>
                   <p className="text-lg font-medium text-slate-600">No media found</p>
                   <p className="text-sm">Try changing filters or upload new images.</p>
               </div>
           ) : (
               filteredMedia.map((item) => (
                   <div key={item.id} className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 overflow-hidden">
                       <div className="aspect-square relative bg-slate-100 overflow-hidden">
                           <Image src={item.url} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500"/>
                           
                           {/* Overlay */}
                           <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]">
                               <button 
                                 onClick={() => handleCopy(item.url, item.id)}
                                 className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition transform hover:scale-105 ${
                                     copiedId === item.id ? "bg-green-500 text-white" : "bg-white text-slate-900 hover:bg-slate-100"
                                 }`}
                               >
                                  {copiedId === item.id ? <Check size={14}/> : <Copy size={14}/>}
                                  {copiedId === item.id ? "Copied" : "Copy URL"}
                               </button>
                               
                               {/* Only allow deletion for manually UPLOADED items */}
                               {item.type === 'UPLOADED' && (
                                   <button 
                                     onClick={() => handleDelete(item.id)}
                                     className="px-4 py-2 bg-red-600 text-white rounded-full text-xs font-bold flex items-center gap-2 hover:bg-red-700 transition"
                                   >
                                      <Trash2 size={14}/> Delete
                                   </button>
                               )}
                           </div>

                           <div className="absolute top-2 right-2">
                               <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md ${
                                   item.type === 'PRODUCT' ? 'bg-blue-500/90 text-white' :
                                   item.type === 'CATEGORY' ? 'bg-purple-500/90 text-white' :
                                   item.type === 'UPLOADED' ? 'bg-indigo-600/90 text-white' :
                                   'bg-slate-800/90 text-white'
                               }`}>
                                   {item.type}
                               </span>
                           </div>
                       </div>
                       <div className="p-3 bg-white">
                           <p className="text-xs font-bold text-slate-700 truncate mb-1" title={item.name}>{item.name}</p>
                           <p className="text-[10px] text-slate-400 font-mono truncate">{new Date(item.createdAt).toLocaleDateString()}</p>
                       </div>
                   </div>
               ))
           )}
        </div>
      )}
    </div>
  );
}