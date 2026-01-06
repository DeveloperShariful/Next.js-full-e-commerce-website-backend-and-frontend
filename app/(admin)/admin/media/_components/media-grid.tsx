// app/(admin)/admin/media/_components/media-grid.tsx

"use client";

import Image from "next/image";
import { CheckSquare, Square, FileText } from "lucide-react";
import { MediaItem } from "@/app/actions/admin/media/media-read";

interface MediaGridProps {
  data: MediaItem[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onItemClick: (item: MediaItem) => void;
}

export function MediaGrid({ data, selectedIds, onToggleSelect, onItemClick }: MediaGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {data.map((item) => (
         <div 
           key={item.id} 
           className={`
             group relative aspect-square bg-white rounded-xl border overflow-hidden cursor-pointer transition-all duration-200
             ${selectedIds.includes(item.id) ? "ring-2 ring-indigo-500 border-transparent shadow-md" : "border-slate-200 hover:shadow-lg hover:border-indigo-300"}
           `}
           onClick={() => onItemClick(item)}
         >
            {/* Selection Checkbox */}
            <div 
              className={`absolute top-2 left-2 z-10 ${selectedIds.includes(item.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity"}`}
              onClick={(e) => { e.stopPropagation(); onToggleSelect(item.id); }}
            >
               {selectedIds.includes(item.id) 
                 ? <CheckSquare className="text-indigo-600 bg-white rounded" size={20}/> 
                 : <Square className="text-slate-400 bg-white/80 rounded hover:text-slate-600" size={20}/>}
            </div>

            {/* Content */}
            <div className="w-full h-full relative bg-slate-50 flex items-center justify-center pb-10"> {/* 🔥 Added pb-10 so text doesn't cover content */}
               {item.type === 'IMAGE' ? (
                  <Image src={item.url} alt={item.altText || item.filename} fill className="object-cover"/>
               ) : (
                  <div className="text-slate-400 flex flex-col items-center">
                     <FileText size={40} strokeWidth={1.5}/>
                     <span className="text-[10px] uppercase font-bold mt-2">{item.mimeType.split('/')[1]}</span>
                  </div>
               )}
            </div>
            
            {/* Footer Label - 🔥 ALWAYS VISIBLE (Removed translate-y-full) */}
            <div className="absolute bottom-0 inset-x-0 bg-white border-t border-slate-100 p-2">
               <p className="text-xs font-bold text-slate-700 truncate">{item.filename}</p>
               <p className="text-[10px] text-slate-500 uppercase flex justify-between">
                  <span>{item.mimeType.split('/')[1]}</span>
                  <span>{(item.size / 1024).toFixed(0)} KB</span>
               </p>
            </div>
         </div>
      ))}
    </div>
  );
}