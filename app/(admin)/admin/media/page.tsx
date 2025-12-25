"use client";

import { useState, useEffect } from "react";
import { getAllMedia, bulkDeleteMedia, MediaItem } from "@/app/actions/admin/media";
import { toast } from "react-hot-toast";
import { MediaHeader } from "./_components/media-header";
import { MediaToolbar } from "./_components/media-toolbar";
import { MediaGrid } from "./_components/media-grid";
import { MediaList } from "./_components/media-list";
import { MediaDetails } from "./_components/media-details";
import { UploadModal } from "./_components/upload-modal";
import { Loader2, UploadCloud } from "lucide-react";

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States
  const [view, setView] = useState<"GRID" | "LIST">("GRID");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [sort, setSort] = useState("newest");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals & Drawers
  const [detailsFile, setDetailsFile] = useState<MediaItem | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const fetchMedia = async () => {
    setLoading(true);
    const res = await getAllMedia(search, sort, filter);
    if (res.success) setMedia(res.data);
    setLoading(false);
  };

  // Debounce Search & Sort Effect
  useEffect(() => {
    const timer = setTimeout(() => fetchMedia(), 500);
    return () => clearTimeout(timer);
  }, [search, sort, filter]);

  // Bulk Actions
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Permanently delete ${selectedIds.length} files?`)) return;
    
    const toastId = toast.loading("Deleting files...");
    const res = await bulkDeleteMedia(selectedIds);
    
    if (res.success) {
      toast.success(res.message, { id: toastId });
      setSelectedIds([]);
      fetchMedia();
    } else {
      toast.error(res.message, { id: toastId });
    }
  };

  return (
    <div className="p-6 max-w-[1920px] mx-auto min-h-screen bg-[#F8F9FA] font-sans text-slate-800">
      
      <MediaHeader onUploadClick={() => setIsUploadOpen(true)} />

      <MediaToolbar 
        view={view} setView={setView}
        search={search} setSearch={setSearch}
        filter={filter} setFilter={setFilter}
        sort={sort} setSort={setSort}
        selectedCount={selectedIds.length}
        onBulkDelete={handleBulkDelete}
        onCancelSelection={() => setSelectedIds([])}
      />

      {loading ? (
         <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-3">
            <Loader2 className="animate-spin text-indigo-600" size={40}/>
            <span className="text-sm font-medium">Loading library...</span>
         </div>
      ) : media.length === 0 ? (
         <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
            <UploadCloud className="text-slate-300 mb-4" size={64}/>
            <p className="text-lg font-bold text-slate-600">No media found</p>
            <p className="text-sm text-slate-400 mb-6">Upload files to get started</p>
            <button onClick={() => setIsUploadOpen(true)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition">
               Upload File
            </button>
         </div>
      ) : (
         <>
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
         </>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <UploadModal 
          onClose={() => setIsUploadOpen(false)} 
          onSuccess={fetchMedia}
        />
      )}

      {/* Details Drawer */}
      {detailsFile && (
        <MediaDetails 
          file={detailsFile} 
          onClose={() => setDetailsFile(null)} 
          onUpdate={() => { setDetailsFile(null); fetchMedia(); }}
        />
      )}

    </div>
  );
}