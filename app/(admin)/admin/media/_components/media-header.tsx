// app/(admin)/admin/media/_components/media-header.tsx

"use client";

import { useState } from "react";
import { UploadCloud, Database, Loader2 } from "lucide-react";
import { syncOldMedia } from "@/app/actions/admin/media/media-sync";
import { toast } from "react-hot-toast";

interface MediaHeaderProps {
  onUploadClick: () => void;
}

export function MediaHeader({ onUploadClick }: MediaHeaderProps) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    if(!confirm("Are you sure you want to sync all old images? This might take a while.")) return;

    setSyncing(true);
    const toastId = toast.loading("Scanning old images...");
    
    try {
        const res = await syncOldMedia();
        if (res.success) {
            toast.success(res.message, { id: toastId });
            window.location.reload();
        } else {
            toast.error("Sync failed", { id: toastId });
        }
    } catch (error) {
        toast.error("Something went wrong", { id: toastId });
    } finally {
        setSyncing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between sm:mb-8">
      
      {/* --- Title Section --- */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl tracking-tight">
          Media Library
        </h1>
        <p className="text-xs text-slate-500 sm:text-sm font-medium">
          Manage images, videos & documents
        </p>
      </div>
      
      {/* --- Actions Section --- */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        
        {/* Sync Button */}
        <button 
            onClick={handleSync}
            disabled={syncing}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2.5 sm:px-4 sm:py-2 bg-white text-slate-600 font-bold text-xs sm:text-sm rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition border border-slate-200 shadow-sm active:scale-95 disabled:opacity-70 whitespace-nowrap"
        >
            {syncing ? <Loader2 size={16} className="animate-spin"/> : <Database size={16} />}
            <span>{syncing ? "Syncing..." : "Sync Data"}</span>
        </button>

        {/* Upload Button */}
        <button 
          onClick={onUploadClick}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2.5 sm:px-4 sm:py-2 bg-indigo-600 text-white font-bold text-xs sm:text-sm rounded-lg hover:bg-indigo-700 transition shadow-md shadow-indigo-100 active:scale-95 whitespace-nowrap"
        >
          <UploadCloud size={18}/>
          <span>Upload New</span>
        </button>

      </div>
    </div>
  );
}