// components/media/media-selector-modal.tsx

"use client";

import { useState, useEffect } from "react";
import { X, Search, Check, Loader2, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { getAllMedia, MediaItem } from "@/app/actions/admin/media/media-read";
import { saveMedia } from "@/app/actions/admin/media/media-create";
import ImageUpload from "@/components/media/image-upload"; 
import { toast } from "react-hot-toast";

interface MediaSelectorModalProps {
  onClose: () => void;
  onSelect: (media: MediaItem | MediaItem[]) => void; 
  allowMultiple?: boolean; 
}

export function MediaSelectorModal({ onClose, onSelect, allowMultiple = false }: MediaSelectorModalProps) {
  const [activeTab, setActiveTab] = useState<"LIBRARY" | "UPLOAD">("LIBRARY");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const fetchMedia = async () => {
    setLoading(true);
    const res = await getAllMedia(search, "newest", "IMAGE", "ALL");
    if (res.success) setMedia(res.data as any);
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === "LIBRARY") {
        const timer = setTimeout(() => fetchMedia(), 500);
        return () => clearTimeout(timer);
    }
  }, [search, activeTab]);

  // 🔥 NEW: Toggle Selection Logic
  const handleToggleSelect = (item: MediaItem) => {
    if (allowMultiple) {
      // Multi-select mode: Add or Remove
      setSelectedIds(prev => 
        prev.includes(item.id) 
          ? prev.filter(id => id !== item.id) 
          : [...prev, item.id]
      );
    } else {
      // Single-select mode: Replace
      setSelectedIds([item.id]);
    }
  };

  // 🔥 NEW: Confirm Selection Logic
  const handleConfirm = () => {
    const selectedItems = media.filter((m) => selectedIds.includes(m.id));
    
    if (selectedItems.length === 0) return;

    if (allowMultiple) {
      onSelect(selectedItems); // Return Array
    } else {
      onSelect(selectedItems[0]); // Return Single Object
    }
    onClose();
  };

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
            toast.success("Uploaded!");
            // Auto select the new file
            const newFile = res.data as any;
            if (newFile) {
                if (allowMultiple) {
                    setSelectedIds(prev => [...prev, newFile.id]);
                } else {
                    setSelectedIds([newFile.id]);
                }
                // Switch back to library to see it (or just push to state)
                setMedia(prev => [newFile, ...prev]);
                setActiveTab("LIBRARY");
            }
        }
    } catch (error) {
        toast.error("Failed to save media");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
           <h3 className="font-bold text-lg text-slate-800">Select Media</h3>
           
           <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab("LIBRARY")}
                className={`text-xs font-bold px-4 py-1.5 rounded-md transition ${activeTab === "LIBRARY" ? "bg-white shadow text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
              >
                Media Library
              </button>
              <button 
                onClick={() => setActiveTab("UPLOAD")}
                className={`text-xs font-bold px-4 py-1.5 rounded-md transition ${activeTab === "UPLOAD" ? "bg-white shadow text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
              >
                Upload New
              </button>
           </div>

           <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition"><X className="text-slate-400" size={20}/></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F8F9FA]">
           
           {activeTab === "LIBRARY" && (
             <>
                {/* Search & Stats */}
                <div className="flex justify-between items-center mb-6">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                        <input 
                            placeholder="Search by name..." 
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                        Showing {media.length} items
                    </span>
                </div>

                {loading ? (
                   <div className="flex justify-center py-32"><Loader2 className="animate-spin text-indigo-600" size={32}/></div>
                ) : media.length === 0 ? (
                   <div className="text-center py-32 text-slate-400 flex flex-col items-center">
                       <ImageIcon size={48} className="mb-2 opacity-20"/>
                       No images found
                   </div>
                ) : (
                   <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                      {media.map((item) => {
                         const isSelected = selectedIds.includes(item.id);
                         return (
                             <div 
                               key={item.id}
                               onClick={() => handleToggleSelect(item)}
                               className={`
                                 relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition group bg-white
                                 ${isSelected ? "border-indigo-600 ring-2 ring-indigo-100" : "border-slate-200 hover:border-indigo-300"}
                               `}
                             >
                                <Image src={item.url} alt={item.altText || ""} fill className="object-cover"/>
                                
                                {/* Selection Indicator */}
                                {isSelected && (
                                   <div className="absolute inset-0 bg-indigo-900/10 flex items-center justify-center z-10">
                                      <div className="bg-indigo-600 text-white p-1 rounded-full shadow-lg scale-110">
                                          <Check size={16} strokeWidth={3}/>
                                      </div>
                                   </div>
                                )}
                                
                                {/* Info Overlay */}
                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6 text-white opacity-0 group-hover:opacity-100 transition duration-200">
                                   <p className="text-[10px] truncate font-medium">{item.filename}</p>
                                   <p className="text-[9px] opacity-80">{(item.size / 1024).toFixed(0)} KB</p>
                                </div>
                             </div>
                         );
                      })}
                   </div>
                )}
             </>
           )}

           {activeTab === "UPLOAD" && (
              <div className="h-full flex flex-col items-center justify-center">
                 <div className="w-full max-w-xl">
                    <ImageUpload 
                        value={[]} 
                        onChange={() => {}} 
                        onRemove={() => {}} 
                        onUploadSuccess={handleUploadSuccess}
                        showPreview={false}
                    />
                 </div>
              </div>
           )}

        </div>

        {/* Footer Bar (Action) */}
        {activeTab === "LIBRARY" && (
            <div className="px-6 py-4 border-t bg-white flex justify-between items-center shadow-lg z-10">
               <div className="flex items-center gap-2">
                   {selectedIds.length > 0 ? (
                       <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full flex items-center gap-2">
                           <CheckCircle2 size={16}/> {selectedIds.length} selected
                       </span>
                   ) : (
                       <span className="text-sm text-slate-400">No items selected</span>
                   )}
               </div>
               
               <div className="flex gap-3">
                  <button 
                    onClick={onClose} 
                    className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={selectedIds.length === 0}
                    onClick={handleConfirm} 
                    className="px-8 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200 transition transform active:scale-95"
                  >
                    {allowMultiple ? `Insert ${selectedIds.length} Images` : "Insert Image"}
                  </button>
               </div>
            </div>
        )}
      </div>
    </div>
  );
}