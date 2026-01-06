//app/(admin)/admin/media/_components/media-header.tsx
"use client";

import { useState } from "react";
import { UploadCloud, RefreshCw, Database } from "lucide-react";
import { syncOldMedia } from "@/app/actions/admin/media/media-sync"; // ✅ Import Action
import { toast } from "react-hot-toast";

interface MediaHeaderProps {
  onUploadClick: () => void;
}

export function MediaHeader({ onUploadClick }: MediaHeaderProps) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    if(!confirm("এটি আপনার পুরনো সব প্রোডাক্ট ও ক্যাটাগরি ইমেজ খুঁজে মিডিয়া লাইব্রেরিতে নিয়ে আসবে। আপনি কি শুরু করতে চান?")) return;

    setSyncing(true);
    const toastId = toast.loading("Scanning old images...");
    
    const res = await syncOldMedia();
    
    if (res.success) {
        toast.success(res.message, { id: toastId });
        window.location.reload(); // পেজ রিফ্রেশ
    } else {
        toast.error("Sync failed", { id: toastId });
    }
    setSyncing(false);
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Media Library</h1>
        <p className="text-sm text-slate-500">Manage all your images, videos and documents</p>
      </div>
      
      <div className="flex gap-3">
        {/* 🔥 SYNC BUTTON */}
        <button 
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition border border-slate-300"
        >
            <Database size={18} className={syncing ? "animate-pulse" : ""} />
            {syncing ? "Syncing..." : "Sync Old Data"}
        </button>

        <button 
          onClick={onUploadClick}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
        >
          <UploadCloud size={20}/>
          <span className="hidden sm:inline">Upload New</span>
        </button>
      </div>
    </div>
  );
}