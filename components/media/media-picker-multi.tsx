//components/media/media-picker-multi.tsx

"use client";

import { useState } from "react";
import { MediaSelectorModal } from "./media-selector-modal";
import { MediaItem } from "@/app/actions/admin/media/media-read";
import { Image as ImageIcon, X, Plus } from "lucide-react";
import Image from "next/image";

interface MediaPickerMultiProps {
  label?: string;
  value?: string[]; // Array of URLs
  onChange: (urls: string[]) => void;
  onRemove: (index: number) => void;
}

export function MediaPickerMulti({ label = "Gallery", value = [], onChange, onRemove }: MediaPickerMultiProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (media: MediaItem) => {
    // Add new image to existing array
    const newImages = [...value, media.url];
    onChange(newImages); 
    // Note: We are currently saving URLs only for gallery. 
    // If you need IDs later, we will update logic.
  };

  return (
    <div className="space-y-3">
      {/* Grid of Images */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-3">
           {value.map((url, i) => (
             <div key={i} className="relative group aspect-square border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                <Image src={url} alt="Gallery" fill className="object-cover" />
                <button 
                  type="button" 
                  onClick={() => onRemove(i)} 
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm z-10"
                >
                  <X size={12}/>
                </button>
             </div>
           ))}
        </div>
      )}

      {/* Add Button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition border border-indigo-200 w-full justify-center border-dashed"
      >
         <Plus size={16}/> Add Image from Library
      </button>

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