"use client";

import { useState } from "react";
import { MediaSelectorModal } from "./media-selector-modal";
import { MediaItem } from "@/app/actions/admin/media/media-read";
import { Image as ImageIcon, X, RefreshCw } from "lucide-react";
import Image from "next/image";

interface MediaPickerProps {
  label?: string;
  value?: string;           // Current Image URL
  onChange: (url: string, mediaId?: string) => void; // Returns URL & ID
  onRemove?: () => void;
  width?: number;
  height?: number;
}

export function MediaPicker({ label = "Featured Image", value, onChange, onRemove }: MediaPickerProps) {
  const [open, setOpen] = useState(false);

  // --- Fixed handleSelect Function ---
  const handleSelect = (media: MediaItem | MediaItem[]) => {
    // চেক করা হচ্ছে এটি Array কিনা। যদি Array হয় তবে প্রথমটি নেব, না হলে সরাসরি অবজেক্টটি নেব।
    const item = Array.isArray(media) ? media[0] : media;
    
    if (item) {
      onChange(item.url, item.id); // Pass URL and ID back to form
      setOpen(false); // ইমেজ সিলেক্ট করার পর মোডাল বন্ধ করে দিচ্ছি (UX এর জন্য ভালো)
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-bold text-slate-700 block">{label}</label>
      
      {value ? (
        // Preview State
        <div className="relative w-40 h-40 rounded-xl overflow-hidden border border-slate-200 group bg-slate-50">
           <Image src={value} alt="Selected" fill className="object-cover" />
           
           {/* Overlay Actions */}
           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2">
              <button 
                type="button"
                onClick={() => setOpen(true)}
                className="bg-white text-slate-800 p-2 rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition"
                title="Replace Image"
              >
                <RefreshCw size={16}/>
              </button>
              <button 
                type="button"
                onClick={() => { if(onRemove) onRemove(); else onChange("", undefined); }}
                className="bg-white text-red-500 p-2 rounded-full hover:bg-red-50 transition"
                title="Remove Image"
              >
                <X size={16}/>
              </button>
           </div>
        </div>
      ) : (
        // Empty State
        <div 
          onClick={() => setOpen(true)}
          className="w-40 h-40 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition group"
        >
           <div className="p-3 bg-slate-100 rounded-full mb-2 group-hover:scale-110 transition group-hover:bg-indigo-100 group-hover:text-indigo-600">
              <ImageIcon size={24} className="text-slate-400 group-hover:text-indigo-600"/>
           </div>
           <span className="text-xs font-bold text-slate-500 group-hover:text-indigo-600">Select Image</span>
        </div>
      )}

      {/* Helper Text */}
      {!value && (
         <p className="text-[11px] text-slate-400">Recommended size: 800x800px (JPG, PNG)</p>
      )}

      {/* Modal */}
      {open && (
        <MediaSelectorModal 
          onClose={() => setOpen(false)}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
}