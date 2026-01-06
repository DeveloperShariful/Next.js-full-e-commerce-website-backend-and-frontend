//app/(admin)/admin/media/_components/media-list.tsx

"use client";

import Image from "next/image";
import { CheckSquare, Square, FileText, MoreHorizontal, Link2 } from "lucide-react";
import { MediaItem } from "@/app/actions/admin/media/media-read";

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
               <th className="p-4">Used In</th> {/* 🔥 NEW: Usage Column */}
               <th className="p-4">Dimensions</th>
               <th className="p-4">Type</th>
               <th className="p-4">Size</th>
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
                  {/* Checkbox */}
                  <td className="p-4" onClick={(e) => { e.stopPropagation(); onToggleSelect(item.id); }}>
                     {selectedIds.includes(item.id) ? <CheckSquare size={18} className="text-indigo-600"/> : <Square size={18} className="text-slate-300 hover:text-slate-500"/>}
                  </td>

                  {/* Thumbnail */}
                  <td className="p-4">
                     <div className="w-10 h-10 bg-slate-100 rounded border overflow-hidden relative flex items-center justify-center">
                        {item.type === 'IMAGE' ? (
                           <Image src={item.url} fill className="object-cover" alt=""/>
                        ) : <FileText size={20} className="text-slate-400"/>}
                     </div>
                  </td>

                  {/* Filename */}
                  <td className="p-4 font-medium text-slate-800">
                      <div className="truncate max-w-[150px]" title={item.filename}>{item.filename}</div>
                  </td>

                  {/* 🔥 NEW: Used In Logic */}
                  <td className="p-4">
                     {item.productImages && item.productImages.length > 0 ? (
                        <div className="flex flex-col gap-1 items-start">
                           {item.productImages.slice(0, 2).map((pi, idx) => (
                              <div key={idx} className="flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100 w-fit max-w-[120px]">
                                 <Link2 size={10} className="shrink-0"/>
                                 <span className="truncate">{pi.product.name}</span>
                              </div>
                           ))}
                           {item.productImages.length > 2 && (
                              <span className="text-[10px] text-slate-400 pl-1">+{item.productImages.length - 2} more</span>
                           )}
                        </div>
                     ) : (
                        <span className="text-xs text-slate-400 italic bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">Unattached</span>
                     )}
                  </td>

                  {/* Dimensions */}
                  <td className="p-4 text-xs text-slate-500">
                     {item.width && item.height ? `${item.width} x ${item.height}` : '-'}
                  </td>

                  {/* Type */}
                  <td className="p-4">
                     <span className="uppercase text-[10px] font-bold bg-slate-100 rounded px-2 py-0.5 w-min whitespace-nowrap">
                        {item.mimeType.split('/')[1]}
                     </span>
                  </td>

                  {/* Size */}
                  <td className="p-4 text-xs text-slate-500 whitespace-nowrap">{(item.size / 1024).toFixed(1)} KB</td>

                  {/* Action */}
                  <td className="p-4 text-right">
                      <button className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600">
                          <MoreHorizontal size={16} />
                      </button>
                  </td>
               </tr>
            ))}
         </tbody>
      </table>
    </div>
  );
}