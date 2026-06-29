// app/(backend)/admin/media/MediaPickerModal.tsx

'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { upload } from '@vercel/blob/client';
import { getAllMedia, saveMediaRecord } from '@/app/actions/backend/media/media-action';
import { Media, MediaSource } from '@prisma/client';
import Image from 'next/image';
import {
  IoCloseOutline,
  IoSearchOutline,
  IoCheckmarkOutline,
  IoCloudUploadOutline,
  IoDocumentTextOutline,
  IoVideocamOutline,
} from 'react-icons/io5';

export type PickedMedia = {
  id: string;
  url: string;
  altText?: string | null;
  filename: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (items: PickedMedia[]) => void;
  multiple?: boolean;
  title?: string;
  source?: MediaSource;
};

export default function MediaPickerModal({ open, onClose, onSelect, multiple = false, title, source }: Props) {
  const [mounted, setMounted] = useState(false);
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploader, setShowUploader] = useState(false);
  const [visibleCount, setVisibleCount] = useState(40);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const PAGE_SIZE = 40;

  // SSR safety: only render portal after mount
  useEffect(() => { setMounted(true); }, []);

  const loadMedia = useCallback(async () => {
    setLoading(true);
    const data = await getAllMedia();
    setMediaList(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) {
      setMediaList([]);
      loadMedia();
      setSelectedIds([]);
      setSearch('');
      setTypeFilter('ALL');
      setVisibleCount(PAGE_SIZE);
    }
  }, [open, loadMedia]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, typeFilter]);

  // Memoized filter — avoids O(n) pass on every render
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return mediaList.filter(m => {
      const matchSearch = !q
        || m.filename.toLowerCase().includes(q)
        || (m.originalName?.toLowerCase().includes(q) ?? false);
      const matchType = typeFilter === 'ALL' || m.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [mediaList, search, typeFilter]);

  const visibleItems = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  const toggleSelect = (id: string) => {
    if (multiple) {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    } else {
      setSelectedIds([id]);
    }
  };

  const handleConfirm = () => {
    const picked = mediaList
      .filter(m => selectedIds.includes(m.id))
      .map(m => ({ id: m.id, url: m.url, altText: m.altText, filename: m.filename }));
    onSelect(picked);
    onClose();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsUploading(true);
    setUploadProgress(0);

    for (const file of files) {
      try {
        const blob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/upload',
          onUploadProgress: (p: { loaded: number; total: number }) => {
            const total = p.total || 1;
            setUploadProgress(Math.round((p.loaded / total) * 100));
          },
        });

        const dbResult = await saveMediaRecord({
          url: blob.url,
          pathname: blob.pathname,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          source: source ?? MediaSource.GENERAL,
        });

        if (!dbResult.success) {
          console.error('Failed to save media record for', file.name, dbResult.message);
          alert(`File uploaded but failed to save to library: ${file.name}`);
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        alert(`Failed to upload ${file.name}: ${msg}`);
      }
    }

    setIsUploading(false);
    setUploadProgress(0);
    setShowUploader(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    loadMedia();
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] flex flex-col rounded-sm shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#c3c4c7] bg-[#f6f7f7] shrink-0">
          <h2 className="text-[16px] font-semibold text-[#1d2327]">
            {title ?? (multiple ? 'Select Media Files' : 'Select Media File')}
          </h2>
          <button onClick={onClose} className="p-1 text-[#646970] hover:text-[#d63638] cursor-pointer">
            <IoCloseOutline size={22} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-[#c3c4c7] bg-white shrink-0">
          <div className="relative">
            <IoSearchOutline size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8c8f94]" />
            <input
              type="search"
              placeholder="Search media..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-[5px] border border-[#8c8f94] rounded-[3px] text-[13px] text-[#2c3338] bg-white focus:border-[#2271b1] focus:outline-none w-[200px]"
            />
          </div>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="border border-[#8c8f94] rounded-[3px] px-2 py-[5px] text-[13px] text-[#2c3338] bg-white focus:border-[#2271b1] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All types</option>
            <option value="IMAGE">Images</option>
            <option value="VIDEO">Videos</option>
            <option value="DOCUMENT">Documents</option>
          </select>

          <span className="text-[12px] text-[#646970]">
            {visibleCount < filtered.length ? `${visibleCount} of ${filtered.length} files` : `${filtered.length} files`}
          </span>

          <div className="flex-1" />

          <button
            onClick={() => setShowUploader(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-[5px] text-[13px] border rounded-[3px] cursor-pointer transition-colors ${
              showUploader ? 'bg-[#135e96] border-[#135e96] text-white' : 'bg-[#2271b1] border-[#2271b1] text-white hover:bg-[#135e96]'
            }`}
          >
            <IoCloudUploadOutline size={14} />
            Upload New
          </button>
        </div>

        {/* Upload panel */}
        {showUploader && (
          <div className="px-4 py-3 border-b border-[#c3c4c7] bg-[#f6f7f7] shrink-0">
            <div className="border-2 border-dashed border-[#c3c4c7] bg-white rounded-sm p-6 text-center relative">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,video/mp4,video/quicktime,application/pdf"
                onChange={handleUpload}
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              {isUploading ? (
                <div className="max-w-xs mx-auto">
                  <p className="text-[13px] font-semibold text-[#2c3338] mb-2">Uploading... {uploadProgress}%</p>
                  <div className="w-full bg-[#f0f0f1] rounded-full h-3 overflow-hidden">
                    <div className="bg-[#2271b1] h-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              ) : (
                <div className="pointer-events-none">
                  <IoCloudUploadOutline size={32} className="mx-auto text-[#c3c4c7] mb-2" />
                  <p className="text-[13px] text-[#8c8f94]">Drop files here or click to select</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-[#646970] text-[13px]">
              Loading media...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#646970]">
              <IoCloudUploadOutline size={40} className="text-[#c3c4c7] mb-3" />
              <p className="text-[13px]">No media files found.</p>
              <button
                onClick={() => setShowUploader(true)}
                className="mt-3 text-[13px] text-[#2271b1] hover:underline cursor-pointer"
              >
                Upload your first file
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-[2px] bg-[#c3c4c7]">
              {visibleItems.map(file => {
                const isSelected = selectedIds.includes(file.id);
                return (
                  <div
                    key={file.id}
                    onClick={() => toggleSelect(file.id)}
                    className={`group relative aspect-square cursor-pointer select-none bg-white overflow-hidden ${
                      isSelected ? 'outline outline-[3px] outline-[#2271b1] z-10' : ''
                    }`}
                  >
                    <div className="w-full h-full bg-[#f0f0f1] flex items-center justify-center">
                      {file.type === 'IMAGE' ? (
                        <Image
                          src={file.url}
                          alt={file.altText || file.filename}
                          fill
                          className="object-cover"
                          sizes="120px"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : file.type === 'VIDEO' ? (
                        <div className="relative w-full h-full bg-[#1d2327]">
                          <video src={`${file.url}#t=1`} className="w-full h-full object-cover" preload="metadata" muted playsInline />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-black/50 rounded-full p-1.5">
                              <svg className="w-4 h-4 text-white fill-white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                            </div>
                          </div>
                          <div className="absolute bottom-1 left-1 bg-black/60 rounded-sm px-1 py-0.5 pointer-events-none">
                            <IoVideocamOutline size={10} className="text-white" />
                          </div>
                        </div>
                      ) : (
                        <IoDocumentTextOutline size={28} className="text-[#2271b1]" />
                      )}
                    </div>

                    <div className={`absolute inset-0 transition-colors ${
                      isSelected ? 'bg-[#2271b1]/20' : 'bg-black/0 group-hover:bg-black/10'
                    }`} />

                    {isSelected && (
                      <div className="absolute top-1 left-1 w-5 h-5 bg-[#2271b1] rounded-sm flex items-center justify-center shadow">
                        <IoCheckmarkOutline className="text-white text-sm font-bold" />
                      </div>
                    )}

                    <div className="absolute bottom-0 inset-x-0 bg-[#1d2327]/80 text-white text-[9px] px-1.5 py-[3px] truncate opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {file.filename}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center pt-4 pb-1">
              <button
                onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                className="px-5 py-2 text-[13px] border border-[#2271b1] text-[#2271b1] bg-white hover:bg-[#f0f6fc] rounded-[3px] cursor-pointer transition-colors"
              >
                Load More ({filtered.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#c3c4c7] bg-[#f6f7f7] shrink-0">
          <span className="text-[13px] text-[#646970]">
            {selectedIds.length > 0 ? `${selectedIds.length} file${selectedIds.length > 1 ? 's' : ''} selected` : 'No files selected'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-[5px] text-[13px] border border-[#c3c4c7] bg-white text-[#2c3338] hover:bg-[#f0f0f1] rounded-[3px] cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedIds.length === 0}
              className="px-4 py-[5px] text-[13px] border border-[#2271b1] bg-[#2271b1] text-white hover:bg-[#135e96] rounded-[3px] cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {multiple ? `Select (${selectedIds.length})` : 'Select'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
