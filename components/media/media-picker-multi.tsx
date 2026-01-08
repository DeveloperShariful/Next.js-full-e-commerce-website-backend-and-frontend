// components/media/media-picker-multi.tsx

"use client";

import { useState } from "react";
import { MediaSelectorModal } from "./media-selector-modal";
import { MediaItem } from "@/app/actions/admin/media/media-read";
import { Image as ImageIcon, X, Plus, GripVertical } from "lucide-react";
import Image from "next/image";

interface MediaPickerMultiProps {
  label?: string;
  value?: string[]; // Array of URLs
  onChange: (urls: string[]) => void;
  onRemove: (index: number) => void;
}

export function MediaPickerMulti({ label = "Gallery", value = [], onChange, onRemove }: MediaPickerMultiProps) {
  const [open, setOpen] = useState(false);

  // Handle Selection from Modal
  const handleSelect = (media: MediaItem | MediaItem[]) => {
    let newUrls: string[] = [];

    // Check if it's an array (Multi-select) or single object
    if (Array.isArray(media)) {
        newUrls = media.map((m) => m.url);
    } else {
        newUrls = [media.url];
    }

    // Filter duplicates
    const uniqueUrls = newUrls.filter(url => !value.includes(url));
    
    // Append to existing
    onChange([...value, ...uniqueUrls]);
  };

  return (
    <div className="space-y-3">
      {label && <label className="text-sm font-bold text-slate-700 block">{label}</label>}

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        
        {/* Existing Images */}
        {value.map((url, i) => (
          <div key={i} className="relative group aspect-square bg-slate-50 rounded-lg border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
             <Image 
                src={url} 
                alt={`Gallery ${i}`} 
                fill 
                className="object-cover" 
             />
             
             {/* Delete Button (Visible on Hover or Touch) */}
             <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button 
                  type="button" 
                  onClick={() => onRemove(i)} 
                  className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-sm"
                  title="Remove"
                >
                  <X size={12}/>
                </button>
             </div>

             {/* Optional: Number Badge */}
             <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                {i + 1}
             </div>
          </div>
        ))}

        {/* Add Button (Last Card) */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-slate-400 hover:text-indigo-600 group"
        >
           <div className="p-2 bg-slate-100 rounded-full group-hover:bg-white mb-1 transition">
              <Plus size={20} />
           </div>
           <span className="text-[10px] font-bold uppercase tracking-wider">Add</span>
        </button>

      </div>

      {value.length === 0 && (
         <p className="text-[11px] text-slate-400 italic">No images selected yet.</p>
      )}

      {/* Modal */}
      {open && (
        <MediaSelectorModal 
          onClose={() => setOpen(false)}
          onSelect={handleSelect}
          allowMultiple={true} // 🔥 This fixes your previous error
        />
      )}
    </div>
  );
}