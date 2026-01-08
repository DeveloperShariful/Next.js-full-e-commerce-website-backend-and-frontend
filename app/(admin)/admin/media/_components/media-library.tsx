// app/(admin)/admin/media/_components/media-library.tsx

"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { getAllMedia, MediaItem } from "@/app/actions/admin/media/media-read";
import { bulkDeleteMedia } from "@/app/actions/admin/media/media-delete";
import { toast } from "react-hot-toast";
import { MediaHeader } from "./media-header";
import { MediaToolbar } from "./media-toolbar";
import { MediaGrid } from "./media-grid";
import { MediaList } from "./media-list";
import { MediaDetails } from "./media-details";
import { UploadModal } from "./upload-modal";
import { Loader2, UploadCloud, ArrowDown } from "lucide-react";

interface MediaLibraryProps {
  initialData: MediaItem[]; // প্রি-ফেচ করা ডাটা রিসিভ করবে
  initialTotal: number;
}

export function MediaLibrary({ initialData, initialTotal }: MediaLibraryProps) {
  // --- STATES ---
  const [media, setMedia] = useState<MediaItem[]>(initialData);
  const [total, setTotal] = useState(initialTotal);
  
  // useTransition ব্যবহার করছি যাতে UI ব্লক না হয়
  const [isPending, startTransition] = useTransition(); 
  
  // Pagination
  const [page, setPage] = useState(1);
  const LIMIT = 40;

  // Filters
  const [view, setView] = useState<"GRID" | "LIST">("GRID");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL"); 
  const [usageFilter, setUsageFilter] = useState("ALL");
  const [sort, setSort] = useState("newest");
  
  // Modals & Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailsFile, setDetailsFile] = useState<MediaItem | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // --- SMART DATA FETCHING ---
  // এই ফাংশনটি এখন লোডিং স্পিনার ছাড়াই ব্যাকগ্রাউন্ডে ডাটা আনবে
  const refreshData = useCallback((
    newSearch = search, 
    newSort = sort, 
    newFilter = filter, 
    newUsage = usageFilter,
    targetPage = 1,
    isLoadMore = false
  ) => {
    startTransition(async () => {
        const res = await getAllMedia(newSearch, newSort, newFilter, newUsage, targetPage, LIMIT);
        if (res.success) {
            if (isLoadMore) {
                setMedia(prev => [...prev, ...(res.data as any)]);
            } else {
                setMedia(res.data as any);
            }
            setTotal(res.meta.total);
            setPage(targetPage);
        } else {
            toast.error("Could not load data");
        }
    });
  }, [search, sort, filter, usageFilter]);

  // --- EVENT HANDLERS (No UI Blocking) ---
  
  // 1. Search Debounce (Only time we use useEffect)
  useEffect(() => {
    const timer = setTimeout(() => {
        if (search) refreshData(search, sort, filter, usageFilter, 1, false);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]); // Only trigger on search change

  // 2. Filter / Sort Change Handlers
  const handleFilterChange = (val: string) => {
      setFilter(val); // UI আপডেট সাথে সাথে
      refreshData(search, sort, val, usageFilter, 1, false); // ব্যাকগ্রাউন্ডে ফেচ
  };

  const handleUsageChange = (val: string) => {
      setUsageFilter(val);
      refreshData(search, sort, filter, val, 1, false);
  };

  const handleSortChange = (val: string) => {
      setSort(val);
      refreshData(search, val, filter, usageFilter, 1, false);
  };

  const handleLoadMore = () => {
      refreshData(search, sort, filter, usageFilter, page + 1, true);
  };

  // 3. Selection Logic
  const handleSelectAll = useCallback(() => {
      if (selectedIds.length === media.length && media.length > 0) {
          setSelectedIds([]);
      } else {
          setSelectedIds(media.map(m => m.id));
      }
  }, [media, selectedIds]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // 4. Delete Logic
  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} files?`)) return;
    
    // ডিলিটের সময় আমরা ম্যানুয়াল লোডিং দেখাতে পারি বা Toast Promise
    await toast.promise(bulkDeleteMedia(selectedIds), {
        loading: 'Deleting...',
        success: (res) => {
            if(!res.success) throw new Error(res.message);
            setSelectedIds([]);
            refreshData(); // Refresh list
            return res.message;
        },
        error: (err) => `Error: ${err.message}`
    });
  };

  const selectedItems = media.filter(m => selectedIds.includes(m.id));
  const isAllSelected = media.length > 0 && selectedIds.length === media.length;
  const hasMore = media.length < total;

  return (
    <div className="p-6 max-w-[1920px] mx-auto min-h-screen bg-[#F8F9FA] font-sans text-slate-800">
      
      <MediaHeader onUploadClick={() => setIsUploadOpen(true)} />

      {/* Toolbar with Optimistic Updates */}
      <MediaToolbar 
        view={view} setView={setView}
        
        search={search} setSearch={setSearch}
        
        // 🔥 Passing new handlers
        filter={filter} setFilter={handleFilterChange} 
        usageFilter={usageFilter} setUsageFilter={handleUsageChange}
        sort={sort} setSort={handleSortChange}
        
        selectedCount={selectedIds.length}
        selectedItems={selectedItems} 
        onBulkDelete={handleBulkDelete}
        onCancelSelection={() => setSelectedIds([])}
        onRefresh={() => refreshData()}
        
        onSelectAll={handleSelectAll}
        isAllSelected={isAllSelected}
      />

      {/* Loading Indicator (Subtle, not blocking) */}
      {isPending && !search && (
          <div className="fixed top-0 left-0 w-full h-1 bg-blue-100 z-50">
              <div className="h-full bg-indigo-600 animate-progress"></div>
          </div>
      )}

      {/* Content Area with Opacity Transition */}
      <div className={`transition-opacity duration-300 ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          {media.length === 0 && !isPending ? (
             <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                <UploadCloud className="text-slate-300 mb-4" size={64}/>
                <p className="text-lg font-bold text-slate-600">No media found</p>
                <button onClick={() => setIsUploadOpen(true)} className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200">
                   Upload File
                </button>
             </div>
          ) : (
             <div className="pb-20">
                {view === "GRID" ? (
                   <MediaGrid 
                     data={media} 
                     selectedIds={selectedIds} 
                     onToggleSelect={toggleSelect} 
                     onItemClick={setDetailsFile}
                     onDeleteRefresh={() => refreshData()} 
                   />
                ) : (
                   <MediaList 
                     data={media} 
                     selectedIds={selectedIds} 
                     onToggleSelect={toggleSelect} 
                     onItemClick={setDetailsFile}
                   />
                )}

                {/* Load More */}
                {hasMore && (
                    <div className="flex justify-center mt-10">
                        <button 
                            onClick={handleLoadMore} 
                            disabled={isPending}
                            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-300 rounded-full shadow-sm text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition disabled:opacity-50"
                        >
                            {isPending ? <Loader2 className="animate-spin" size={16}/> : <ArrowDown size={16}/>}
                            Load More Files
                        </button>
                    </div>
                )}
             </div>
          )}
      </div>

      {isUploadOpen && <UploadModal onClose={() => setIsUploadOpen(false)} onSuccess={() => refreshData()} />}
      {detailsFile && <MediaDetails file={detailsFile} onClose={() => setDetailsFile(null)} onUpdate={() => { setDetailsFile(null); refreshData(); }} />}
    </div>
  );
}