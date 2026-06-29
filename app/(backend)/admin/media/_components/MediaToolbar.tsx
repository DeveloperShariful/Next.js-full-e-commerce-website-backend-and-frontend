// app/(backend)/admin/media/_components/MediaToolbar.tsx

'use client';

import { useState } from 'react';
import { IoListOutline, IoGridOutline, IoTrashOutline, IoSyncOutline } from 'react-icons/io5';
import { syncAllExistingMedia, syncFromVercelBlob } from '@/app/actions/backend/media/media-action';

type SortBy = 'date' | 'name' | 'size';
type ViewMode = 'grid' | 'list';

type ToolbarProps = {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  typeFilter: string;
  setTypeFilter: (val: string) => void;
  sourceFilter: string;
  setSourceFilter: (val: string) => void;
  isBulkMode: boolean;
  setIsBulkMode: (val: boolean) => void;
  selectedIds: string[];
  setSelectedIds: (val: string[]) => void;
  handleBulkDelete: () => void;
  isDeletingBulk: boolean;
  typeCounts: Record<string, number>;
  sourceCounts: Record<string, number>;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  sortBy: SortBy;
  setSortBy: (s: SortBy) => void;
  onSyncComplete: () => Promise<void>;
};

export default function MediaToolbar(props: ToolbarProps) {
  const {
    searchQuery, setSearchQuery,
    typeFilter, setTypeFilter,
    sourceFilter, setSourceFilter,
    isBulkMode, setIsBulkMode,
    selectedIds, setSelectedIds,
    handleBulkDelete, isDeletingBulk,
    typeCounts, sourceCounts,
    viewMode, setViewMode,
    sortBy, setSortBy,
    onSyncComplete,
  } = props;

  const [isSyncing, setIsSyncing] = useState(false);
  const [isBlobSyncing, setIsBlobSyncing] = useState(false);

  const handleSync = async () => {
    if (isSyncing || isBlobSyncing) return;
    setIsSyncing(true);
    const res = await syncAllExistingMedia();
    setIsSyncing(false);
    if (res.success) {
      alert(`Success! ${res.count} items synced from database.`);
      await onSyncComplete();
    } else {
      alert('Sync failed: ' + res.message);
    }
  };

  const handleBlobSync = async () => {
    if (isSyncing || isBlobSyncing) return;
    setIsBlobSyncing(true);
    const res = await syncFromVercelBlob();
    setIsBlobSyncing(false);
    if (res.success) {
      alert(`Success! ${res.count} files imported from Vercel Blob storage.`);
      await onSyncComplete();
    } else {
      alert('Blob sync failed: ' + res.message);
    }
  };

  return (
    <div className="bg-white border border-[#c3c4c7] px-4 py-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-[13px] shadow-sm mb-6 mx-2 md:mx-0">

      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        {/* View Mode Toggle */}
        <div className="hidden md:flex border border-[#8c8f94] rounded-sm overflow-hidden">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-[#f0f0f1] text-[#2271b1]' : 'bg-white text-[#8c8f94] hover:text-[#2271b1]'}`}
            title="List view"
          >
            <IoListOutline size={18} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 border-l border-[#8c8f94] transition-colors ${viewMode === 'grid' ? 'bg-[#f0f0f1] text-[#2271b1]' : 'bg-white text-[#8c8f94] hover:text-[#2271b1]'}`}
            title="Grid view"
          >
            <IoGridOutline size={18} />
          </button>
        </div>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-white border border-[#8c8f94] text-[#2c3338] px-2 py-1 rounded-sm focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none"
        >
          <option value="ALL">All media items ({typeCounts.ALL ?? 0})</option>
          <option value="IMAGE">Images ({typeCounts.IMAGE ?? 0})</option>
          <option value="VIDEO">Video ({typeCounts.VIDEO ?? 0})</option>
          <option value="DOCUMENT">Documents ({typeCounts.DOCUMENT ?? 0})</option>
        </select>

        {/* Source Filter */}
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="bg-white border border-[#8c8f94] text-[#2c3338] px-2 py-1 rounded-sm focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none"
        >
          <option value="ALL">All sources ({sourceCounts.ALL ?? 0})</option>
          <option value="GENERAL">General Uploads ({sourceCounts.GENERAL ?? 0})</option>
          <option value="PRODUCT">Products ({sourceCounts.PRODUCT ?? 0})</option>
          <option value="CATEGORY">Categories ({sourceCounts.CATEGORY ?? 0})</option>
          <option value="BRAND">Brands ({sourceCounts.BRAND ?? 0})</option>
          <option value="AFFILIATE">Affiliate Assets ({sourceCounts.AFFILIATE ?? 0})</option>
          <option value="WARRANTY">Warranty Claims ({sourceCounts.WARRANTY ?? 0})</option>
          <option value="USER">User Avatars ({sourceCounts.USER ?? 0})</option>
          <option value="STORE">Store Logos ({sourceCounts.STORE ?? 0})</option>
          <option value="REVIEW">Reviews ({sourceCounts.REVIEW ?? 0})</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="bg-white border border-[#8c8f94] text-[#2c3338] px-2 py-1 rounded-sm focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none"
        >
          <option value="date">Sort: Newest first</option>
          <option value="name">Sort: Name A–Z</option>
          <option value="size">Sort: Largest first</option>
        </select>

        {/* Bulk Select */}
        {!isBulkMode ? (
          <button
            onClick={() => setIsBulkMode(true)}
            className="border border-[#2271b1] text-[#2271b1] px-3 py-1 rounded-sm hover:bg-[#f6f7f7] bg-white transition-colors"
          >
            Bulk select
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setIsBulkMode(false); setSelectedIds([]); }}
              className="border border-[#8c8f94] text-[#2c3338] px-3 py-1 rounded-sm hover:bg-[#f6f7f7] bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={selectedIds.length === 0 || isDeletingBulk}
              className="flex items-center gap-1 border border-[#d63638] text-[#d63638] bg-white px-3 py-1 rounded-sm hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <IoTrashOutline size={14} />
              {isDeletingBulk ? 'Deleting...' : `Delete Selected (${selectedIds.length})`}
            </button>
          </div>
        )}
      </div>

      <div className="w-full md:w-auto flex flex-col md:flex-row items-stretch md:items-center justify-end gap-3">
        <button
          onClick={handleSync}
          disabled={isSyncing || isBlobSyncing}
          className="flex items-center justify-center gap-1 border border-[#2271b1] bg-[#f0f8ff] text-[#2271b1] px-3 py-1 rounded-sm hover:bg-[#e0f0ff] transition-colors disabled:opacity-50"
          title="Sync all existing images from Products, Categories, Brands, Users & Warranty"
        >
          <IoSyncOutline className={isSyncing ? 'animate-spin' : ''} size={16} />
          {isSyncing ? 'Syncing...' : 'Sync DB Data'}
        </button>

        <button
          onClick={handleBlobSync}
          disabled={isSyncing || isBlobSyncing}
          className="flex items-center justify-center gap-1 border border-[#00a32a] bg-[#f0fff4] text-[#00a32a] px-3 py-1 rounded-sm hover:bg-[#e0ffe8] transition-colors disabled:opacity-50"
          title="Import all files from Vercel Blob storage into Media Library"
        >
          <IoSyncOutline className={isBlobSyncing ? 'animate-spin' : ''} size={16} />
          {isBlobSyncing ? 'Importing...' : 'Sync Blob Storage'}
        </button>

        <input
          type="text"
          placeholder="Search media..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:w-64 bg-white border border-[#8c8f94] px-3 py-1 rounded-sm focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none text-[#2c3338]"
        />
      </div>
    </div>
  );
}
