// app/(admin)/admin/media/_components/media-library.tsx

"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { getAllMedia, MediaItem } from "@/app/actions/admin/media/media-read";
import { bulkDeleteMedia } from "@/app/actions/admin/media/media-delete";
import { getFolderTree, deleteFolder } from "@/app/actions/admin/media/folder-actions";
import { moveMediaToFolder } from "@/app/actions/admin/media/media-move"; 

import { toast } from "react-hot-toast";
import { MediaHeader } from "./media-header";
import { MediaToolbar } from "./media-toolbar";
import { MediaGrid } from "./media-grid";
import { MediaList } from "./media-list";
import { MediaDetails } from "./media-details";
import { UploadModal } from "./upload-modal";
import { MediaSidebar } from "./media-sidebar"; 
import { FolderModal } from "./folder-modal";   
import { MoveModal } from "./move-modal"; 
import { ImageEditor } from "./image-editor"; // ✅ Image Editor Import
import { Loader2, UploadCloud, ArrowDown, FolderOpen, Folder } from "lucide-react";

interface MediaLibraryProps {
  initialData: MediaItem[];
  initialTotal: number;
}

export function MediaLibrary({ initialData, initialTotal }: MediaLibraryProps) {
  // --- STATES ---
  const [media, setMedia] = useState<MediaItem[]>(initialData);
  const [total, setTotal] = useState(initialTotal);
  const [folders, setFolders] = useState<any[]>([]); 
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null); 
  
  const [isPending, startTransition] = useTransition(); 
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"GRID" | "LIST">("GRID");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL"); 
  const [usageFilter, setUsageFilter] = useState("ALL");
  const [sort, setSort] = useState("newest");
  
  // 🔥 Mobile Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals & Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailsFile, setDetailsFile] = useState<MediaItem | null>(null);
  
  // ✅ Editor State
  const [editorFile, setEditorFile] = useState<MediaItem | null>(null);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderModalMode, setFolderModalMode] = useState<"CREATE" | "RENAME">("CREATE");
  const [activeFolderActionId, setActiveFolderActionId] = useState<string | null>(null); 
  const [folderToEdit, setFolderToEdit] = useState<any>(null);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

  // --- DATA FETCHING ---
  const refreshData = useCallback((
    targetPage = 1,
    isLoadMore = false,
    folderOverride = currentFolderId 
  ) => {
    startTransition(async () => {
        const effectiveFolderId = search ? "ALL_MEDIA_SEARCH" : folderOverride;
        const res = await getAllMedia(search, sort, filter, usageFilter, effectiveFolderId, targetPage, 40);
        if (res.success) {
            if (isLoadMore) setMedia(prev => [...prev, ...(res.data as any)]);
            else setMedia(res.data as any);
            setTotal(res.meta.total);
            setPage(targetPage);
        }
    });
  }, [search, sort, filter, usageFilter, currentFolderId]);

  const refreshFolders = async () => {
      const res = await getFolderTree();
      if(res.success) setFolders(res.data as any);
  };

  useEffect(() => { refreshFolders(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
        refreshData(1, false);
    }, 500);
    return () => clearTimeout(timer);
  }, [search, sort, filter, usageFilter, currentFolderId]);

  // --- ACTIONS ---
  const handleCreateFolder = (parentId: string | null) => {
      setFolderModalMode("CREATE"); setActiveFolderActionId(parentId); setIsFolderModalOpen(true);
  };
  const handleRenameFolder = (folder: any) => {
      setFolderModalMode("RENAME"); setFolderToEdit(folder); setIsFolderModalOpen(true);
  };
  const handleDeleteFolder = async (id: string) => {
      if(!confirm("Delete folder? Files inside will be moved to parent.")) return;
      const res = await deleteFolder(id);
      if(res.success) { toast.success(res.message); refreshFolders(); if(currentFolderId === id) setCurrentFolderId(null); } 
      else { toast.error(res.message); }
  };
  const handleFolderSuccess = () => { refreshFolders(); refreshData(); };

  // DnD
  const handleDragStart = (e: React.DragEvent, mediaId: string) => {
      e.dataTransfer.setData("mediaId", mediaId);
      if (selectedIds.includes(mediaId)) e.dataTransfer.setData("mediaIds", JSON.stringify(selectedIds));
      else e.dataTransfer.setData("mediaIds", JSON.stringify([mediaId]));
  };
  const handleDropOnFolder = async (e: React.DragEvent, targetFolderId: string | null) => {
      e.preventDefault(); e.stopPropagation();
      const idsString = e.dataTransfer.getData("mediaIds");
      if(!idsString) return;
      const ids = JSON.parse(idsString);
      if(ids.length === 0) return;
      const toastId = toast.loading(`Moving ${ids.length} items...`);
      const res = await moveMediaToFolder(ids, targetFolderId);
      if(res.success) { toast.success(res.message, { id: toastId }); refreshData(); refreshFolders(); setSelectedIds([]); } 
      else { toast.error(res.message, { id: toastId }); }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} files?`)) return;
    const loadingToast = toast.loading("Processing...");
    const res = await bulkDeleteMedia(selectedIds, false); 
    if (res.success) { 
        if(res.skippedCount > 0) toast.error(res.message, { id: loadingToast, duration: 5000 });
        else toast.success(res.message, { id: loadingToast });
        setSelectedIds([]); refreshData();
    } else { toast.error(res.message, { id: loadingToast }); }
  };

  const selectedItems = media.filter(m => selectedIds.includes(m.id));
  const isAllSelected = media.length > 0 && selectedIds.length === media.length;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#F8F9FA] relative">
      <div className="hidden lg:block w-64 h-full shrink-0 border-r border-slate-200 bg-white">
         <MediaSidebar folders={folders} currentFolderId={currentFolderId} onSelectFolder={setCurrentFolderId} onCreateFolder={handleCreateFolder} onRenameFolder={handleRenameFolder} onDeleteFolder={handleDeleteFolder} onDropFile={handleDropOnFolder} />
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
            <div className="relative w-72 h-full bg-white shadow-2xl animate-in slide-in-from-left duration-200">
                <MediaSidebar folders={folders} currentFolderId={currentFolderId} onSelectFolder={setCurrentFolderId} onCreateFolder={handleCreateFolder} onRenameFolder={handleRenameFolder} onDeleteFolder={handleDeleteFolder} onDropFile={handleDropOnFolder} onCloseMobile={() => setIsSidebarOpen(false)} />
            </div>
        </div>
      )}

      <div className="flex-1 flex flex-col h-full min-w-0">
          <div className="p-6 pb-0">
             <div className="flex items-center gap-3 mb-4">
                 <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 bg-white border border-slate-200 rounded-md text-slate-600 shadow-sm hover:bg-slate-50"><Folder size={20}/></button>
                 <div className="flex-1"><MediaHeader onUploadClick={() => setIsUploadOpen(true)} /></div>
             </div>
             
             <MediaToolbar 
                view={view} setView={setView} search={search} setSearch={setSearch} filter={filter} setFilter={(v) => { setFilter(v); refreshData(); }} usageFilter={usageFilter} setUsageFilter={(v) => { setUsageFilter(v); refreshData(); }} sort={sort} setSort={(v) => { setSort(v); refreshData(); }}
                selectedCount={selectedIds.length} selectedItems={selectedItems} onBulkDelete={handleBulkDelete} onCancelSelection={() => setSelectedIds([])} onRefresh={() => { refreshData(); refreshFolders(); }} onSelectAll={() => setSelectedIds(selectedIds.length === media.length ? [] : media.map(m=>m.id))} isAllSelected={isAllSelected}
             />
             
             {selectedIds.length > 0 && (
                 <div className="mb-4 flex gap-2">
                     <button onClick={() => setIsMoveModalOpen(true)} className="text-xs font-bold bg-white border border-slate-300 px-3 py-1.5 rounded-md hover:bg-slate-50 flex items-center gap-2 text-slate-700"><FolderOpen size={14}/> Move to Folder</button>
                 </div>
             )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 pt-2">
              <div className={`transition-opacity duration-300 ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                  {media.length === 0 && !isPending ? (
                    <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                        <UploadCloud className="text-slate-300 mb-4" size={64}/>
                        <p className="text-lg font-bold text-slate-600">{currentFolderId ? "Folder is empty" : "No media found"}</p>
                        <button onClick={() => setIsUploadOpen(true)} className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200">Upload File</button>
                    </div>
                  ) : (
                    <>
                        {view === "GRID" ? (
                            <MediaGrid data={media} selectedIds={selectedIds} onToggleSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i=>i!==id) : [...prev,id])} onItemClick={setDetailsFile} onDeleteRefresh={() => refreshData()} onDragStart={handleDragStart} />
                        ) : (
                            <MediaList data={media} selectedIds={selectedIds} onToggleSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i=>i!==id) : [...prev,id])} onItemClick={setDetailsFile} />
                        )}
                        {media.length < total && (
                            <div className="flex justify-center mt-10 pb-10">
                                <button onClick={() => refreshData(page + 1, true)} disabled={isPending} className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-300 rounded-full shadow-sm text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"><ArrowDown size={16}/> Load More</button>
                            </div>
                        )}
                    </>
                  )}
              </div>
          </div>
      </div>

      {isUploadOpen && <UploadModal onClose={() => setIsUploadOpen(false)} onSuccess={() => { refreshData(); refreshFolders(); }} />}
      
      {/* ✅ Details now connects to Editor */}
      {detailsFile && (
          <MediaDetails 
            file={detailsFile} 
            onClose={() => setDetailsFile(null)} 
            onUpdate={() => { setDetailsFile(null); refreshData(); }} 
            onEdit={() => { setEditorFile(detailsFile); setDetailsFile(null); }} // Open Editor, Close Details
          />
      )}

      {/* ✅ Editor Modal */}
      {editorFile && (
          <ImageEditor 
            file={editorFile} 
            isOpen={!!editorFile} 
            onClose={() => setEditorFile(null)} 
            onSuccess={() => { refreshData(); setEditorFile(null); }} 
          />
      )}

      {isFolderModalOpen && <FolderModal isOpen={isFolderModalOpen} onClose={() => setIsFolderModalOpen(false)} onSuccess={handleFolderSuccess} mode={folderModalMode} parentFolderId={activeFolderActionId} folderToEdit={folderToEdit}/>}
      {isMoveModalOpen && <MoveModal isOpen={isMoveModalOpen} onClose={() => setIsMoveModalOpen(false)} selectedIds={selectedIds} onSuccess={() => { refreshData(); refreshFolders(); setSelectedIds([]); }} currentFolderId={currentFolderId}/>}
    </div>
  );
}