"use client";

import Image from "next/image";
import { CheckSquare, Square, FileText, MoreHorizontal } from "lucide-react";
import { MediaItem } from "@/app/actions/admin/media";

interface MediaListProps {
  data: MediaItem[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onItemClick: (item: MediaItem) => void;
}

export function MediaList({ data, selectedIds, onToggleSelect, onItemClick }: MediaListProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <table className="w-full text-left text-sm text-slate-700">
         <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
            <tr>
               <th className="p-4 w-10">Select</th>
               <th className="p-4 w-16">Preview</th>
               <th className="p-4">Filename</th>
               <th className="p-4">Dimensions</th>
               <th className="p-4">Type</th>
               <th className="p-4">Size</th>
               <th className="p-4">Uploaded</th>
               <th className="p-4 text-right">Action</th>
            </tr>
         </thead>
         <tbody className="divide-y divide-slate-100">
            {data.map((item) => (
               <tr 
                 key={item.id} 
                 className={`hover:bg-slate-50 transition cursor-pointer ${selectedIds.includes(item.id) ? "bg-indigo-50/30" : ""}`} 
                 onClick={() => onItemClick(item)}
               >
                  <td className="p-4" onClick={(e) => { e.stopPropagation(); onToggleSelect(item.id); }}>
                     {selectedIds.includes(item.id) ? <CheckSquare size={18} className="text-indigo-600"/> : <Square size={18} className="text-slate-300 hover:text-slate-500"/>}
                  </td>
                  <td className="p-4">
                     <div className="w-10 h-10 bg-slate-100 rounded border overflow-hidden relative flex items-center justify-center">
                        {item.type === 'IMAGE' ? (
                           <Image src={item.url} fill className="object-cover" alt=""/>
                        ) : <FileText size={20} className="text-slate-400"/>}
                     </div>
                  </td>
                  <td className="p-4 font-medium text-slate-800">{item.filename}</td>
                  <td className="p-4 text-xs text-slate-500">-</td>
                  <td className="p-4 uppercase text-xs font-bold bg-slate-100 rounded px-2 w-min">{item.mimeType.split('/')[1]}</td>
                  <td className="p-4 text-xs text-slate-500">{(item.size / 1024).toFixed(1)} KB</td>
                  <td className="p-4 text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-right"><button className="p-1 hover:bg-slate-200 rounded"><MoreHorizontal size={16} className="text-slate-400"/></button></td>
               </tr>
            ))}
         </tbody>
      </table>
    </div>
  );
}