//components/media/media-selector-modal.tsx

"use client";

import { useState, useEffect } from "react";
import { X, Search, Check, UploadCloud, Loader2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { getAllMedia, MediaItem } from "@/app/actions/admin/media/media-read";
import { saveMedia } from "@/app/actions/admin/media/media-create";
import ImageUpload from "@/components/ui/image-upload"; // আপনার আগের কম্পোনেন্ট
import { toast } from "react-hot-toast";

interface MediaSelectorModalProps {
  onClose: () => void;
  onSelect: (media: MediaItem) => void;
}

export function MediaSelectorModal({ onClose, onSelect }: MediaSelectorModalProps) {
  const [activeTab, setActiveTab] = useState<"LIBRARY" | "UPLOAD">("LIBRARY");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Fetch Media
  const fetchMedia = async () => {
    setLoading(true);
    const res = await getAllMedia(search, "newest", "IMAGE", "ALL");
    if (res.success) setMedia(res.data as any);
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === "LIBRARY") {
        // Debounce search
        const timer = setTimeout(() => fetchMedia(), 500);
        return () => clearTimeout(timer);
    }
  }, [search, activeTab]);

  // Handle Selection
  const handleConfirm = () => {
    const selectedMedia = media.find((m) => m.id === selectedId);
    if (selectedMedia) {
      onSelect(selectedMedia);
      onClose();
    }
  };

  // Handle New Upload inside Modal
  const handleUploadSuccess = async (result: any) => {
    const info = result.info;
    try {
        const fileData = {
            url: info.secure_url,
            publicId: info.public_id,
            originalName: info.original_filename,
            filename: `${info.original_filename}.${info.format}`,
            mimeType: `${info.resource_type}/${info.format}`,
            size: info.bytes,
            width: info.width || 0,
            height: info.height || 0
        };
        
        const res = await saveMedia(fileData);
        if (res.success) {
            toast.success("Uploaded & Selected!");
            onSelect(res.data as any); // Auto select new upload
            onClose();
        }
    } catch (error) {
        toast.error("Failed to save media");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
           <div className="flex gap-4">
              <button 
                onClick={() => setActiveTab("LIBRARY")}
                className={`text-sm font-bold px-4 py-2 rounded-full transition ${activeTab === "LIBRARY" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-200"}`}
              >
                Media Library
              </button>
              <button 
                onClick={() => setActiveTab("UPLOAD")}
                className={`text-sm font-bold px-4 py-2 rounded-full transition ${activeTab === "UPLOAD" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-200"}`}
              >
                Upload New
              </button>
           </div>
           <button onClick={onClose}><X className="text-slate-400 hover:text-red-500 transition"/></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F8F9FA]">
           
           {activeTab === "LIBRARY" && (
             <>
                {/* Search Bar */}
                <div className="relative mb-6">
                   <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                   <input 
                     placeholder="Search images..." 
                     className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                   />
                </div>

                {loading ? (
                   <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600"/></div>
                ) : media.length === 0 ? (
                   <div className="text-center py-20 text-slate-400">No images found</div>
                ) : (
                   <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                      {media.map((item) => (
                         <div 
                           key={item.id}
                           onClick={() => setSelectedId(item.id)}
                           className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition group ${selectedId === item.id ? "border-indigo-600 ring-2 ring-indigo-100" : "border-transparent hover:border-slate-300"}`}
                         >
                            <Image src={item.url} alt={item.altText || ""} fill className="object-cover"/>
                            {selectedId === item.id && (
                               <div className="absolute inset-0 bg-indigo-900/20 flex items-center justify-center">
                                  <div className="bg-indigo-600 text-white p-1 rounded-full"><Check size={20}/></div>
                               </div>
                            )}
                            <div className="absolute bottom-0 inset-x-0 bg-black/50 p-1 text-[10px] text-white truncate opacity-0 group-hover:opacity-100 transition">
                               {item.filename}
                            </div>
                         </div>
                      ))}
                   </div>
                )}
             </>
           )}

           {activeTab === "UPLOAD" && (
              <div className="max-w-xl mx-auto py-12">
                 <ImageUpload 
                    value={[]} 
                    onChange={() => {}} 
                    onRemove={() => {}} 
                    onUploadSuccess={handleUploadSuccess}
                    showPreview={false}
                 />
              </div>
           )}

        </div>

        {/* Footer */}
        {activeTab === "LIBRARY" && (
            <div className="p-4 border-t bg-white flex justify-between items-center">
               <span className="text-sm text-slate-500">
                  {selectedId ? "1 image selected" : "No image selected"}
               </span>
               <div className="flex gap-2">
                  <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button 
                    disabled={!selectedId}
                    onClick={handleConfirm} 
                    className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Insert Media
                  </button>
               </div>
            </div>
        )}
      </div>
    </div>
  );
}