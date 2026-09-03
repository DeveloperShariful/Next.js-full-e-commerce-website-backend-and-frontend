// app/(backend)/admin/media/_components/MediaLibraryUI.tsx

'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { uploadMediaFile } from '@/lib/upload-media';
import { saveMediaRecord, bulkDeleteMedia, getMediaLibraryItems, type StorageUsage, type MediaLibraryItem } from '@/app/actions/backend/media/media-action';
import { classifyStorage } from '@/lib/cloudinary-storage-classify';
import MediaToolbar from './MediaToolbar';
import MediaGrid from './MediaGrid';
import MediaModal from './MediaModal';
import StorageUsageWidget from './StorageUsageWidget';
import { MediaPaginationControls } from './MediaPaginationControls';

type ViewMode = 'grid' | 'list';
type SortBy = 'date' | 'name' | 'size';

type MediaLibraryUIProps = {
  initialMedia: MediaLibraryItem[];
  storageUsage: StorageUsage;
};

export default function MediaLibraryUI({ initialMedia, storageUsage }: MediaLibraryUIProps) {
  const [mediaList, setMediaList] = useState<MediaLibraryItem[]>(initialMedia);
  const [showUploader, setShowUploader] = useState(false);

  // Filters, Search, View, Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [storageFilter, setStorageFilter] = useState('ALL');
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

  // Pagination — "Show: 20/50/100/200" বাটন সরিয়ে fixed 20-per-page (MediaPaginationControls
  // আগের মতোই আছে — top pager দিয়ে যেকোনো page-এ jump করা যায়, bottom-এ একটা "More" বাটন
  // দিয়ে সহজে পরের page-এ যাওয়া যায়)।
  const PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);

  // ── Counts (single pass — O(n) instead of 9 passes) ──
  const { typeCounts, sourceCounts, storageCounts } = useMemo(() => {
    const tc: Record<string, number> = { ALL: 0, IMAGE: 0, VIDEO: 0, DOCUMENT: 0 };
    const sc: Record<string, number> = { ALL: 0, GENERAL: 0, PRODUCT: 0, CATEGORY: 0, BRAND: 0, AFFILIATE: 0, WARRANTY: 0, BLOG: 0, USER: 0, STORE: 0, REVIEW: 0, COMMUNITY: 0 };
    const stc: Record<string, number> = { ALL: 0 };
    for (const m of mediaList) {
      tc.ALL++;
      if (m.type in tc) tc[m.type] = (tc[m.type] ?? 0) + 1;
      sc.ALL++;
      if (m.source in sc) sc[m.source] = (sc[m.source] ?? 0) + 1;
      stc.ALL++;
      const bucket = classifyStorage(m.url);
      stc[bucket] = (stc[bucket] ?? 0) + 1;
    }
    return { typeCounts: tc, sourceCounts: sc, storageCounts: stc };
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
      const matchStorage = storageFilter === 'ALL' || classifyStorage(item.url) === storageFilter;
      return matchSearch && matchType && matchSource && matchStorage;
    });
  }, [mediaList, searchQuery, typeFilter, sourceFilter, storageFilter]);

  const sortedMedia = useMemo(() => {
    const sorted = [...filteredMedia];
    if (sortBy === 'name') sorted.sort((a, b) => a.filename.localeCompare(b.filename));
    else if (sortBy === 'size') sorted.sort((a, b) => b.size - a.size);
    else sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return sorted;
  }, [filteredMedia, sortBy]);

  // ── Pagination slice ──
  const totalPages = Math.max(1, Math.ceil(sortedMedia.length / PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedMedia = sortedMedia.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const handleFilterChange = (setter: (v: string) => void) => (v: string) => { setter(v); setCurrentPage(1); };

  // ── Refresh after sync (replaces window.location.reload) ──
  const refreshMedia = useCallback(async () => {
    const fresh = await getMediaLibraryItems();
    setMediaList(fresh);
  }, []);

  // ── Upload ──
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    const uploadedFiles: MediaLibraryItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const uploaded = await uploadMediaFile(file, 'general', (pct) => setUploadProgress(pct));

        const dbResult = await saveMediaRecord({
          url: uploaded.url,
          pathname: uploaded.pathname,
          filename: uploaded.filename,
          mimeType: uploaded.mimeType,
          size: uploaded.size,
          source: 'GENERAL',
          qualityScore: uploaded.qualityScore,
          originalSize: uploaded.originalSize,
          transcodePending: uploaded.transcodePending,
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
  // Read-only (community) rows are never checkable in the grid, but this
  // guards against them slipping into selectedIds anyway — bulkDeleteMedia
  // expects real Media ids, and a "postmedia-..." one would just be a
  // silent no-op there, so filtering here keeps the count accurate.
  const handleBulkDelete = async () => {
    const deletableIds = selectedIds.filter((id) => !id.startsWith('postmedia-'));
    if (deletableIds.length === 0) return;
    if (!confirm(`Are you sure you want to permanently delete ${deletableIds.length} items from your site?\nThis cannot be undone.`)) return;

    setIsDeletingBulk(true);
    const res = await bulkDeleteMedia(deletableIds);

    if (res.success) {
      setMediaList(prev => prev.filter(m => !deletableIds.includes(m.id)));
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

      <div className="px-2 md:px-0">
        <StorageUsageWidget usage={storageUsage} />
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
        storageFilter={storageFilter}
        setStorageFilter={handleFilterChange(setStorageFilter)}
        isBulkMode={isBulkMode}
        setIsBulkMode={setIsBulkMode}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        handleBulkDelete={handleBulkDelete}
        isDeletingBulk={isDeletingBulk}
        typeCounts={typeCounts}
        sourceCounts={sourceCounts}
        storageCounts={storageCounts}
        viewMode={viewMode}
        setViewMode={setViewMode}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onSyncComplete={refreshMedia}
      />

      {/* Pagination (Top) — admin/products পেজের pagination-controls.tsx-এর সাথে মিলিয়ে */}
      <div className="px-2 md:px-0 mb-3">
        <MediaPaginationControls
          total={sortedMedia.length}
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Grid / List */}
      <MediaGrid
        filteredMedia={paginatedMedia}
        isBulkMode={isBulkMode}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        // MediaGrid শুধু বর্তমান page-এর slice দেখে, তাই ওর index page-local
        // (0-19)। কিন্তু MediaModal পুরো sortedMedia লিস্ট থেকে item খোঁজে —
        // তাই local index-কে page offset যোগ করে global index-এ বদলে দিতে
        // হবে, নাহলে page 2+ এ ক্লিক করলে page 1-এর একই position-এর item
        // খুলে যায়।
        setSelectedIndex={(localIndex) =>
          setSelectedIndex(localIndex === null ? null : localIndex + (safePage - 1) * PER_PAGE)
        }
        viewMode={viewMode}
      />

      {/* "More" — bottom-এ পুরো pager না রেখে সহজ এক ক্লিকে পরের page-এ যাওয়ার
          বাটন। bulk-select-এ কোনো প্রভাব নাই — selectedIds page বদলালেও থেকে যায়। */}
      {safePage < totalPages && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="px-6 py-2 border border-[#c3c4c7] bg-white text-[13px] font-medium rounded-sm hover:border-[#2271b1] hover:text-[#2271b1] transition-colors"
          >
            More
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
