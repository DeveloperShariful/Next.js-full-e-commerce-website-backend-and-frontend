// app/(admin)/admin/media/_components/media-grid.tsx

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { CheckSquare, Square, FileText, Copy, Eye, Trash2, Edit } from "lucide-react";
import { MediaItem } from "@/app/actions/admin/media/media-read";
import { bulkDeleteMedia } from "@/app/actions/admin/media/media-delete";
import { toast } from "react-hot-toast";

interface MediaGridProps {
  data: MediaItem[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onItemClick: (item: MediaItem) => void;
  onDeleteRefresh: () => void; // Refresh after delete
}

export function MediaGrid({ data, selectedIds, onToggleSelect, onItemClick, onDeleteRefresh }: MediaGridProps) {
  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: MediaItem | null }>({ x: 0, y: 0, item: null });

  // Close context menu on click elsewhere
  useEffect(() => {
    const handleClick = () => setContextMenu({ x: 0, y: 0, item: null });
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, item: MediaItem) => {
    e.preventDefault();
    setContextMenu({ x: e.pageX, y: e.pageY, item });
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  };

  const handleDeleteSingle = async (id: string) => {
    if (!confirm("Delete this file permanently?")) return;
    const res = await bulkDeleteMedia([id]);
    if (res.success) {
        toast.success("File deleted");
        onDeleteRefresh();
    } else {
        toast.error("Delete failed");
    }
  };

  return (
    <>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-7 gap-4">
        {data.map((item) => (
            <div 
            key={item.id} 
            className={`
                group relative aspect-square bg-white rounded-xl border overflow-hidden cursor-pointer transition-all duration-200
                ${selectedIds.includes(item.id) ? "ring-2 ring-indigo-500 border-transparent shadow-md" : "border-slate-200 hover:shadow-lg hover:border-indigo-300"}
            `}
            onClick={() => onItemClick(item)}
            onContextMenu={(e) => handleContextMenu(e, item)} // 🔥 Right Click Trigger
            >
                {/* Checkbox */}
                <div 
                className={`absolute top-2 left-2 z-10 ${selectedIds.includes(item.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity"}`}
                onClick={(e) => { e.stopPropagation(); onToggleSelect(item.id); }}
                >
                {selectedIds.includes(item.id) 
                    ? <CheckSquare className="text-indigo-600 bg-white rounded" size={20}/> 
                    : <Square className="text-slate-400 bg-white/80 rounded hover:text-slate-600" size={20}/>}
                </div>

                {/* Content */}
                <div className="w-full h-full relative bg-slate-50 flex items-center justify-center pb-10">
                {item.type === 'IMAGE' ? (
                    <Image src={item.url} alt={item.altText || item.filename} fill className="object-cover"/>
                ) : (
                    <div className="text-slate-400 flex flex-col items-center">
                        <FileText size={40} strokeWidth={1.5}/>
                        <span className="text-[10px] uppercase font-bold mt-2">{item.mimeType.split('/')[1]}</span>
                    </div>
                )}
                </div>
                
                {/* Footer Label */}
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

        {/* 🔥 CUSTOM CONTEXT MENU */}
        {contextMenu.item && (
            <div 
                className="fixed bg-white border border-slate-200 shadow-xl rounded-lg w-48 py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                style={{ top: contextMenu.y, left: contextMenu.x }}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
                <div className="px-3 py-2 text-xs text-slate-400 font-bold border-b border-slate-100 mb-1 truncate">
                    {contextMenu.item.filename}
                </div>
                
                <button onClick={() => onItemClick(contextMenu.item!)} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2">
                    <Eye size={14}/> Preview / Edit
                </button>
                
                <button onClick={() => { handleCopyUrl(contextMenu.item!.url); setContextMenu({x:0, y:0, item:null}); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2">
                    <Copy size={14}/> Copy URL
                </button>
                
                <div className="h-px bg-slate-100 my-1"></div>
                
                <button onClick={() => handleDeleteSingle(contextMenu.item!.id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                    <Trash2 size={14}/> Delete Permanently
                </button>
            </div>
        )}
    </>
  );
}