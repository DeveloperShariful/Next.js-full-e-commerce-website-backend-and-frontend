"use client";

import { UploadCloud, Image as ImageIcon } from "lucide-react";

interface MediaHeaderProps {
  onUploadClick: () => void;
}

export function MediaHeader({ onUploadClick }: MediaHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ImageIcon className="text-indigo-600" /> Media Library
        </h1>
        <p className="text-sm text-slate-500 mt-1">Manage assets, edit metadata, and organize files.</p>
      </div>
      <button 
        onClick={onUploadClick}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-sm transition active:scale-95"
      >
         <UploadCloud size={18}/> Upload New
      </button>
    </div>
  );
}