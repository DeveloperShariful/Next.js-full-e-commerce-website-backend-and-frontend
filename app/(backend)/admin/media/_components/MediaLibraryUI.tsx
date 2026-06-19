// app/(backend)/admin/media/_components/MediaLibraryUI.tsx

'use client';

import { useState, useRef, useMemo } from 'react';
import { upload } from '@vercel/blob/client';
import { saveMediaRecord, bulkDeleteMedia } from '@/app/actions/backend/media/media-action';
import { Media } from '@prisma/client'; // NEW: Imported original Prisma Type
import MediaToolbar from './MediaToolbar';
import MediaGrid from './MediaGrid';
import MediaModal from './MediaModal';

type MediaLibraryUIProps = {
  initialMedia: Media[]; // Strongly typed array
};

export default function MediaLibraryUI({ initialMedia }: MediaLibraryUIProps) {
  const [mediaList, setMediaList] = useState<Media[]>(initialMedia);
  const [showUploader, setShowUploader] = useState(false);
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); 
  const [sourceFilter, setSourceFilter] = useState('ALL');

  // Bulk Select Mode
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal State
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // 1. COUNTS
  const typeCounts = useMemo(() => ({
    ALL: mediaList.length,
    IMAGE: mediaList.filter(m => m.type === 'IMAGE').length,
    VIDEO: mediaList.filter(m => m.type === 'VIDEO').length,
    DOCUMENT: mediaList.filter(m => m.type === 'DOCUMENT').length,
  }), [mediaList]);

  const sourceCounts = useMemo(() => ({
    ALL: mediaList.length,
    GENERAL: mediaList.filter(m => m.source === 'GENERAL').length,
    PRODUCT: mediaList.filter(m => m.source === 'PRODUCT').length,
    CATEGORY: mediaList.filter(m => m.source === 'CATEGORY').length,
    BRAND: mediaList.filter(m => m.source === 'BRAND').length,
    AFFILIATE: mediaList.filter(m => m.source === 'AFFILIATE').length,
    WARRANTY: mediaList.filter(m => m.source === 'WARRANTY').length,
    USER: mediaList.filter(m => m.source === 'USER').length,
    STORE: mediaList.filter(m => m.source === 'STORE').length,
    REVIEW: mediaList.filter(m => m.source === 'REVIEW').length,
  }), [mediaList]);

  // 2. PAGINATION STATE
  const [perPage, setPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  // 3. FILTER LOGIC
  const filteredMedia = useMemo(() => {
    return mediaList.filter(item => {
      const matchSearch = item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.originalName && item.originalName.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchType = typeFilter === 'ALL' || item.type === typeFilter;
      const matchSource = sourceFilter === 'ALL' || item.source === sourceFilter;
      return matchSearch && matchType && matchSource;
    });
  }, [mediaList, searchQuery, typeFilter, sourceFilter]);

  // 4. PAGINATED SLICE
  const totalPages = Math.max(1, Math.ceil(filteredMedia.length / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedMedia = filteredMedia.slice((safePage - 1) * perPage, safePage * perPage);
  const fromItem = filteredMedia.length === 0 ? 0 : (safePage - 1) * perPage + 1;
  const toItem = Math.min(safePage * perPage, filteredMedia.length);

  // Reset to page 1 when filters/search change
  const handleFilterChange = (setter: (v: string) => void) => (v: string) => { setter(v); setCurrentPage(1); };

  // 2. UPLOAD LOGIC
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    let uploadedFiles: Media[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const blob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/upload',
          onUploadProgress: (progressEvent: { loaded: number; total: number }) => {
            const percentage = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            setUploadProgress(percentage);
          },
        });

        const dbResult = await saveMediaRecord({
          url: blob.url,
          pathname: blob.pathname,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          source: 'GENERAL',
        });

        if (dbResult.success && dbResult.media) {
          uploadedFiles.push(dbResult.media);
        }
      } catch (error) {
        alert(`Failed to upload ${file.name}`);
      }
    }

    if (uploadedFiles.length > 0) {
      setMediaList(prev => [...uploadedFiles, ...prev]);
    }

    setIsUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 3. BULK DELETE LOGIC
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to permanently delete ${selectedIds.length} items from your site?\nThis cannot be undone.`)) return;

    setIsDeletingBulk(true);
    
    const itemsToDelete = mediaList
      .filter(m => selectedIds.includes(m.id))
      .map(m => ({ id: m.id, pathname: m.pathname }));

    const res = await bulkDeleteMedia(itemsToDelete);
    
    if (res.success) {
      setMediaList(prev => prev.filter(m => !selectedIds.includes(m.id)));
      setSelectedIds([]); 
      setIsBulkMode(false); 
    } else {
      alert(res.message);
    }
    
    setIsDeletingBulk(false);
  };

  return (
    <div className="font-sans text-[#2c3338] w-full pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6 px-2 md:px-0 pt-4">
        <h1 className="text-2xl font-normal text-[#1d2327]">Media Library</h1>
        <button 
          onClick={() => setShowUploader(!showUploader)}
          className="border border-[#2271b1] text-[#2271b1] bg-[#f6f7f7] hover:bg-[#f0f0f1] px-3 py-1 rounded-sm text-sm transition-colors w-max"
        >
          {showUploader ? 'Cancel Upload' : 'Add New Media File'}
        </button>
      </div>

      {/* Slide-down Uploader */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showUploader ? 'max-h-[500px] mb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="border-2 border-dashed border-[#c3c4c7] bg-white rounded-sm p-8 md:p-14 text-center relative mx-2 md:mx-0">
          <input 
            type="file" 
            ref={fileInputRef} 
            multiple 
            accept="image/jpeg, image/png, image/webp, image/svg+xml, video/mp4, video/quicktime, application/pdf" 
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            disabled={isUploading}
          />
          {!isUploading ? (
            <div className="pointer-events-none">
              <p className="text-xl text-[#8c8f94] mb-3">Drop files to upload</p>
              <p className="text-sm text-[#8c8f94] mb-3">or</p>
              <button className="bg-white border border-[#2271b1] text-[#2271b1] px-4 py-1.5 rounded-sm shadow-sm pointer-events-auto hover:bg-[#f6f7f7] text-[13px] font-medium">
                Select Files
              </button>
            </div>
          ) : (
            <div className="w-full max-w-md mx-auto z-20 relative">
              <p className="text-[#2c3338] font-bold mb-2 text-sm">Uploading... {uploadProgress}%</p>
              <div className="w-full bg-[#f0f0f1] rounded-full h-4 shadow-inner overflow-hidden border border-gray-200">
                <div className="bg-[#2271b1] h-full transition-all duration-200" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Shared Toolbar */}
      <MediaToolbar
        searchQuery={searchQuery}
        setSearchQuery={handleFilterChange(setSearchQuery)}
        typeFilter={typeFilter}
        setTypeFilter={handleFilterChange(setTypeFilter)}
        sourceFilter={sourceFilter}
        setSourceFilter={handleFilterChange(setSourceFilter)}
        isBulkMode={isBulkMode}
        setIsBulkMode={setIsBulkMode}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        handleBulkDelete={handleBulkDelete}
        isDeletingBulk={isDeletingBulk}
        typeCounts={typeCounts}
        sourceCounts={sourceCounts}
      />

      {/* Per-page + counter row */}
      <div className="flex items-center justify-between px-2 md:px-0 mb-3 text-[13px] text-[#50575e]">
        <span>
          {filteredMedia.length === 0
            ? 'No items found'
            : `Showing ${fromItem}–${toItem} of ${filteredMedia.length} items`}
        </span>
        <div className="flex items-center gap-2">
          <span>Show:</span>
          {[20, 50, 100, 200].map(n => (
            <button
              key={n}
              onClick={() => { setPerPage(n); setCurrentPage(1); }}
              className={`px-2 py-0.5 rounded-sm border text-[12px] transition-colors ${perPage === n ? 'bg-[#2271b1] text-white border-[#2271b1]' : 'bg-white border-[#c3c4c7] text-[#2c3338] hover:border-[#2271b1] hover:text-[#2271b1]'}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Shared Grid */}
      <MediaGrid
        filteredMedia={paginatedMedia}
        isBulkMode={isBulkMode}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        setSelectedIndex={setSelectedIndex}
      />

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-6 flex-wrap">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="px-3 py-1 border border-[#c3c4c7] bg-white text-[13px] rounded-sm hover:border-[#2271b1] hover:text-[#2271b1] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
            .reduce<(number | '...')[]>((acc, p, idx, arr) => {
              if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} className="px-2 text-[#8c8f94]">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p as number)}
                  className={`w-8 h-7 border text-[13px] rounded-sm transition-colors ${safePage === p ? 'bg-[#2271b1] text-white border-[#2271b1]' : 'bg-white border-[#c3c4c7] text-[#2c3338] hover:border-[#2271b1] hover:text-[#2271b1]'}`}
                >
                  {p}
                </button>
              )
            )}

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="px-3 py-1 border border-[#c3c4c7] bg-white text-[13px] rounded-sm hover:border-[#2271b1] hover:text-[#2271b1] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}

      {/* Details Modal Popup */}
      <MediaModal
        filteredMedia={filteredMedia}
        selectedIndex={selectedIndex}
        setSelectedIndex={setSelectedIndex}
        setMediaList={setMediaList}
      />

    </div>
  );
}