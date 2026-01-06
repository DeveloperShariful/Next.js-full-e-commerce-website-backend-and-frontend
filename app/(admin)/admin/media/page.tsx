//app/(admin)/admin/media/page.tsx

"use client";

import { useState, useEffect } from "react";
import { getAllMedia, MediaItem } from "@/app/actions/admin/media/media-read";
import { bulkDeleteMedia } from "@/app/actions/admin/media/media-delete";

import { toast } from "react-hot-toast";
import { MediaHeader } from "./_components/media-header";
import { MediaToolbar } from "./_components/media-toolbar";
import { MediaGrid } from "./_components/media-grid";
import { MediaList } from "./_components/media-list";
import { MediaDetails } from "./_components/media-details";
import { UploadModal } from "./_components/upload-modal";
import { Loader2, UploadCloud } from "lucide-react";

export default function MediaPage() {
  // --- STATES ---
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter & Sort States
  const [view, setView] = useState<"GRID" | "LIST">("GRID");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL"); 
  const [usageFilter, setUsageFilter] = useState("ALL");
  const [sort, setSort] = useState("newest");
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals State
  const [detailsFile, setDetailsFile] = useState<MediaItem | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // --- DATA FETCHING ---
  const fetchMedia = async (showToast = false) => {
    setLoading(true);
    const res = await getAllMedia(search, sort, filter, usageFilter);
    
    if (res.success) {
        setMedia(res.data as any);
        if (showToast) {
            toast.success("Library refreshed");
        }
    } else {
        if (showToast) {
            toast.error("Failed to refresh library");
        }
    }
    setLoading(false);
  };

  // Debounce Effect: Fetch data when filters change
  useEffect(() => {
    const timer = setTimeout(() => fetchMedia(), 500);
    return () => clearTimeout(timer);
  }, [search, sort, filter, usageFilter]);

  // --- HANDLERS ---
  
  // Manual Refresh Handler
  const handleRefresh = () => {
      fetchMedia(true); // true means show success toast
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Permanently delete ${selectedIds.length} files? This cannot be undone.`)) return;
    
    const toastId = toast.loading("Deleting files...");
    const res = await bulkDeleteMedia(selectedIds);
    
    if (res.success) {
      toast.success(res.message, { id: toastId });
      setSelectedIds([]); // Clear selection
      fetchMedia();       // Refresh list
    } else {
      toast.error(res.message, { id: toastId });
    }
  };

  return (
    <div className="p-6 max-w-[1920px] mx-auto min-h-screen bg-[#F8F9FA] font-sans text-slate-800">
      
      {/* Header */}
      <MediaHeader onUploadClick={() => setIsUploadOpen(true)} />

      {/* Toolbar with Filters & Refresh */}
      <MediaToolbar 
        view={view} setView={setView}
        search={search} setSearch={setSearch}
        filter={filter} setFilter={setFilter}
        
        usageFilter={usageFilter} 
        setUsageFilter={setUsageFilter}

        sort={sort} setSort={setSort}
        selectedCount={selectedIds.length}
        onBulkDelete={handleBulkDelete}
        onCancelSelection={() => setSelectedIds([])}
        
        // 🔥 Pass the refresh handler
        onRefresh={handleRefresh} 
      />

      {/* Content Area */}
      {loading ? (
         <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-3 animate-in fade-in">
            <Loader2 className="animate-spin text-indigo-600" size={40}/>
            <span className="text-sm font-medium">Loading library...</span>
         </div>
      ) : media.length === 0 ? (
         <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-200 rounded-2xl bg-white animate-in zoom-in-95">
            <UploadCloud className="text-slate-300 mb-4" size={64}/>
            <p className="text-lg font-bold text-slate-600">No media found</p>
            <p className="text-sm text-slate-400 mb-6"> Try adjusting filters or upload new files</p>
            <button onClick={() => setIsUploadOpen(true)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition">
               Upload File
            </button>
         </div>
      ) : (
         <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {view === "GRID" ? (
               <MediaGrid 
                 data={media} 
                 selectedIds={selectedIds} 
                 onToggleSelect={toggleSelect} 
                 onItemClick={setDetailsFile}
               />
            ) : (
               <MediaList 
                 data={media} 
                 selectedIds={selectedIds} 
                 onToggleSelect={toggleSelect} 
                 onItemClick={setDetailsFile}
               />
            )}
         </div>
      )}

      {/* --- MODALS --- */}
      
      {/* Upload Modal */}
      {isUploadOpen && (
        <UploadModal 
          onClose={() => setIsUploadOpen(false)} 
          onSuccess={() => fetchMedia(true)} // Refresh after upload
        />
      )}

      {/* Details/Edit Drawer */}
      {detailsFile && (
        <MediaDetails 
          file={detailsFile} 
          onClose={() => setDetailsFile(null)} 
          onUpdate={() => { setDetailsFile(null); fetchMedia(true); }} // Refresh after edit
        />
      )}

    </div>
  );
}