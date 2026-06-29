// app/(backend)/admin/media/_components/MediaLibraryUI.tsx

'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { upload } from '@vercel/blob/client';
import { saveMediaRecord, bulkDeleteMedia, getAllMedia } from '@/app/actions/backend/media/media-action';
import { Media } from '@prisma/client';
import MediaToolbar from './MediaToolbar';
import MediaGrid from './MediaGrid';
import MediaModal from './MediaModal';

type ViewMode = 'grid' | 'list';
type SortBy = 'date' | 'name' | 'size';

type MediaLibraryUIProps = {
  initialMedia: Media[];
};

export default function MediaLibraryUI({ initialMedia }: MediaLibraryUIProps) {
  const [mediaList, setMediaList] = useState<Media[]>(initialMedia);
  const [showUploader, setShowUploader] = useState(false);

  // Filters, Search, View, Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('date');

  // Bulk Select
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // Upload
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Pagination
  const [perPage, setPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  // ── Counts (single pass — O(n) instead of 9 passes) ──
  const { typeCounts, sourceCounts } = useMemo(() => {
    const tc: Record<string, number> = { ALL: 0, IMAGE: 0, VIDEO: 0, DOCUMENT: 0 };
    const sc: Record<string, number> = { ALL: 0, GENERAL: 0, PRODUCT: 0, CATEGORY: 0, BRAND: 0, AFFILIATE: 0, WARRANTY: 0, USER: 0, STORE: 0, REVIEW: 0 };
    for (const m of mediaList) {
      tc.ALL++;
      if (m.type in tc) tc[m.type] = (tc[m.type] ?? 0) + 1;
      sc.ALL++;
      if (m.source in sc) sc[m.source] = (sc[m.source] ?? 0) + 1;
    }
    return { typeCounts: tc, sourceCounts: sc };
  }, [mediaList]);

  // ── Total storage size ──
  const totalBytes = useMemo(() => mediaList.reduce((sum, m) => sum + (m.size || 0), 0), [mediaList]);
  const totalStorageLabel = totalBytes > 1024 * 1024 * 1024
    ? `${(totalBytes / (1024 ** 3)).toFixed(2)} GB`
    : totalBytes > 1024 * 1024
    ? `${(totalBytes / (1024 ** 2)).toFixed(1)} MB`
    : `${(totalBytes / 1024).toFixed(0)} KB`;

  // ── Filter + Sort ──
  const filteredMedia = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return mediaList.filter(item => {
      const matchSearch = !q || item.filename.toLowerCase().includes(q) || (item.originalName?.toLowerCase().includes(q) ?? false);
      const matchType = typeFilter === 'ALL' || item.type === typeFilter;
      const matchSource = sourceFilter === 'ALL' || item.source === sourceFilter;
      return matchSearch && matchType && matchSource;
    });
  }, [mediaList, searchQuery, typeFilter, sourceFilter]);

  const sortedMedia = useMemo(() => {
    const sorted = [...filteredMedia];
    if (sortBy === 'name') sorted.sort((a, b) => a.filename.localeCompare(b.filename));
    else if (sortBy === 'size') sorted.sort((a, b) => b.size - a.size);
    else sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return sorted;
  }, [filteredMedia, sortBy]);

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(sortedMedia.length / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedMedia = sortedMedia.slice((safePage - 1) * perPage, safePage * perPage);
  const fromItem = sortedMedia.length === 0 ? 0 : (safePage - 1) * perPage + 1;
  const toItem = Math.min(safePage * perPage, sortedMedia.length);

  const handleFilterChange = (setter: (v: string) => void) => (v: string) => { setter(v); setCurrentPage(1); };

  // ── Refresh after sync (replaces window.location.reload) ──
  const refreshMedia = useCallback(async () => {
    const fresh = await getAllMedia();
    setMediaList(fresh);
  }, []);

  // ── Upload ──
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    const uploadedFiles: Media[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const blob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/upload',
          onUploadProgress: (progressEvent: { loaded: number; total: number }) => {
            const total = progressEvent.total || 1;
            setUploadProgress(Math.round((progressEvent.loaded / total) * 100));
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
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        alert(`Failed to upload ${file.name}: ${msg}`);
      }
    }

    if (uploadedFiles.length > 0) {
      setMediaList(prev => [...uploadedFiles, ...prev]);
    }

    setIsUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Bulk Delete ──
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to permanently delete ${selectedIds.length} items from your site?\nThis cannot be undone.`)) return;

    setIsDeletingBulk(true);
    const res = await bulkDeleteMedia(selectedIds);

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
        <span className="text-[13px] text-[#646970] hidden md:block">
          {mediaList.length} files · {totalStorageLabel} used
        </span>
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
                <div className="bg-[#2271b1] h-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
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
        viewMode={viewMode}
        setViewMode={setViewMode}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onSyncComplete={refreshMedia}
      />

      {/* Per-page + counter row */}
      <div className="flex items-center justify-between px-2 md:px-0 mb-3 text-[13px] text-[#50575e]">
        <span>
          {sortedMedia.length === 0
            ? 'No items found'
            : `Showing ${fromItem}–${toItem} of ${sortedMedia.length} items`}
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

      {/* Grid / List */}
      <MediaGrid
        filteredMedia={paginatedMedia}
        isBulkMode={isBulkMode}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        setSelectedIndex={setSelectedIndex}
        viewMode={viewMode}
      />

      {/* Pagination */}
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

      {/* Details Modal */}
      <MediaModal
        filteredMedia={sortedMedia}
        selectedIndex={selectedIndex}
        setSelectedIndex={setSelectedIndex}
        setMediaList={setMediaList}
      />
    </div>
  );
}
