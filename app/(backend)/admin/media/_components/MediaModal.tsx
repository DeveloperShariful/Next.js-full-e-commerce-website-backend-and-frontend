// app/(backend)/admin/media/_components/MediaModal.tsx

'use client';

import { useState, useEffect } from 'react';
import { updateMediaDetails, deleteMedia } from '@/app/actions/backend/media/media-action';
import { Media } from '@prisma/client';
import { IoCloseOutline, IoChevronBackOutline, IoChevronForwardOutline, IoDocumentTextOutline } from 'react-icons/io5';

function formatBytes(bytes: number, decimals = 0) {
  if (!+bytes) return '0 KB';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

type MediaModalProps = {
  filteredMedia: Media[];
  selectedIndex: number | null;
  setSelectedIndex: (index: number | null) => void;
  setMediaList: React.Dispatch<React.SetStateAction<Media[]>>;
};

export default function MediaModal({ filteredMedia, selectedIndex, setSelectedIndex, setMediaList }: MediaModalProps) {
  const [copied, setCopied] = useState(false);
  const [savingField, setSavingField] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ altText: '', originalName: '', caption: '', description: '' });

  const selectedFile = selectedIndex !== null ? filteredMedia[selectedIndex] : null;

  useEffect(() => {
    if (selectedFile) {
      setEditForm({
        altText: selectedFile.altText || '',
        originalName: selectedFile.originalName || '',
        caption: selectedFile.caption || '',
        description: selectedFile.description || '',
      });
      setCopied(false);
    }
  }, [selectedFile]);

  // Keyboard navigation: ← → Escape
  useEffect(() => {
    if (selectedIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSelectedIndex(null); return; }
      if (e.key === 'ArrowLeft' && selectedIndex > 0) setSelectedIndex(selectedIndex - 1);
      if (e.key === 'ArrowRight' && selectedIndex < filteredMedia.length - 1) setSelectedIndex(selectedIndex + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIndex, filteredMedia.length, setSelectedIndex]);

  if (!selectedFile || selectedIndex === null) return null;

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-secure contexts
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("You are about to permanently delete this item from your site.\nThis action cannot be undone.\n'Cancel' to stop, 'OK' to delete.")) return;

    const res = await deleteMedia(id);
    if (res.success) {
      setMediaList(prev => prev.filter(m => m.id !== id));
      setSelectedIndex(null);
    } else {
      alert(res.message);
    }
  };

  const handleBlurSave = async (field: string, value: string) => {
    if ((selectedFile as Record<string, unknown>)[field] === value) return;

    setSavingField(field);
    const res = await updateMediaDetails(selectedFile.id, { [field]: value });

    if (res.success && res.media) {
      setMediaList(prev => prev.map(m => m.id === selectedFile.id ? res.media! : m));
    }
    setSavingField(null);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-2 md:p-8 backdrop-blur-sm">
      <div className="bg-white w-full max-w-6xl h-full max-h-[90vh] shadow-2xl flex flex-col relative animate-fadeIn rounded-sm">

        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#dcdcde] px-4 py-2 bg-white">
          <h2 className="text-xl font-semibold text-[#1d2327]">Attachment details</h2>
          <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
            <span className="text-[12px] text-[#646970] mr-1">{selectedIndex + 1} / {filteredMedia.length}</span>
            <button
              onClick={() => setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : selectedIndex)}
              disabled={selectedIndex === 0}
              className="p-1 text-gray-500 hover:text-[#2271b1] disabled:opacity-30 transition-colors"
              title="Previous (← arrow key)"
            >
              <IoChevronBackOutline size={22} />
            </button>
            <button
              onClick={() => setSelectedIndex(selectedIndex < filteredMedia.length - 1 ? selectedIndex + 1 : selectedIndex)}
              disabled={selectedIndex === filteredMedia.length - 1}
              className="p-1 text-gray-500 hover:text-[#2271b1] disabled:opacity-30 transition-colors"
              title="Next (→ arrow key)"
            >
              <IoChevronForwardOutline size={22} />
            </button>
            <button
              onClick={() => setSelectedIndex(null)}
              className="p-1 text-gray-500 hover:text-red-600 ml-2 transition-colors"
              title="Close (Escape)"
            >
              <IoCloseOutline size={28} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col md:flex-row flex-grow overflow-hidden bg-[#f0f0f1]">

          {/* LEFT: Preview */}
          <div className="w-full md:w-[65%] h-[40vh] md:h-full border-b md:border-b-0 md:border-r border-[#dcdcde] flex items-center justify-center p-4 md:p-8 relative bg-[#f0f0f1]">
            {selectedFile.type === 'VIDEO' ? (
              <video controls className="w-full max-h-full shadow-lg bg-black object-contain">
                <source src={selectedFile.url} type={selectedFile.mimeType} />
              </video>
            ) : selectedFile.type === 'DOCUMENT' ? (
              <div className="flex flex-col items-center justify-center text-gray-500">
                <IoDocumentTextOutline size={80} className="text-[#2271b1] mb-4" />
                <a href={selectedFile.url} target="_blank" rel="noopener noreferrer" className="text-[#2271b1] hover:underline bg-white px-4 py-2 border border-gray-300 rounded shadow-sm font-medium">
                  View Full Document
                </a>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedFile.url}
                alt={selectedFile.altText || 'Preview'}
                className="w-auto h-auto max-w-full max-h-full object-contain shadow-sm"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
          </div>

          {/* RIGHT: Details */}
          <div className="w-full md:w-[35%] bg-[#f6f7f7] p-5 overflow-y-auto custom-scrollbar">

            <div className="text-[#646970] text-[13px] border-b border-[#dcdcde] pb-4 mb-5">
              <p className="font-semibold text-[#1d2327] truncate mb-1" title={selectedFile.filename}>{selectedFile.filename}</p>
              <p>Uploaded on: {new Date(selectedFile.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              <p>File type: {selectedFile.mimeType}</p>
              <p>File size: {formatBytes(selectedFile.size)}</p>
              {selectedFile.source && <p>Source: <span className="font-bold">{selectedFile.source}</span></p>}

              <button
                onClick={() => handleDelete(selectedFile.id)}
                className="text-[#d63638] hover:text-red-800 hover:underline mt-3 block font-medium"
              >
                Delete permanently
              </button>
            </div>

            <div className="space-y-4 text-[13px]">

              {/* File URL */}
              <div className="mb-6">
                <label className="block text-[#646970] font-semibold mb-1">File URL:</label>
                <input
                  type="text"
                  readOnly
                  value={selectedFile.url}
                  className="w-full bg-white border border-[#8c8f94] rounded-sm px-2 py-1 focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none text-[#2c3338] mb-2"
                />
                <button
                  onClick={() => handleCopyUrl(selectedFile.url)}
                  className="border border-[#2271b1] text-[#2271b1] bg-[#f6f7f7] hover:bg-[#f0f0f1] px-3 py-1 rounded-sm transition-colors font-medium shadow-sm"
                >
                  {copied ? '✓ Copied!' : 'Copy URL to clipboard'}
                </button>
              </div>

              {/* Editable fields */}
              <div className="space-y-3">

                {/* Alt Text */}
                <div className="relative flex flex-col xl:flex-row xl:items-start gap-1 xl:gap-3">
                  <label className="text-[#646970] xl:w-20 xl:text-right pt-1 font-medium">Alt Text</label>
                  <div className="flex-1 relative">
                    <textarea
                      value={editForm.altText}
                      onChange={e => setEditForm({ ...editForm, altText: e.target.value })}
                      onBlur={e => handleBlurSave('altText', e.target.value)}
                      className="w-full bg-white border border-[#8c8f94] rounded-sm px-2 py-1.5 focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none h-14 resize-none"
                    />
                    {savingField === 'altText' && <span className="absolute right-2 top-2 w-3 h-3 rounded-full border-2 border-[#2271b1] border-t-transparent animate-spin" />}
                    <p className="text-[11px] text-gray-500 mt-1 leading-tight">
                      Describe the purpose of the image for accessibility. Leave empty if decorative.
                    </p>
                  </div>
                </div>

                {/* Title */}
                <div className="relative flex flex-col xl:flex-row xl:items-center gap-1 xl:gap-3">
                  <label className="text-[#646970] xl:w-20 xl:text-right font-medium">Title</label>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={editForm.originalName}
                      onChange={e => setEditForm({ ...editForm, originalName: e.target.value })}
                      onBlur={e => handleBlurSave('originalName', e.target.value)}
                      className="w-full bg-white border border-[#8c8f94] rounded-sm px-2 py-1 focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none"
                    />
                    {savingField === 'originalName' && <span className="absolute right-2 top-2 w-3 h-3 rounded-full border-2 border-[#2271b1] border-t-transparent animate-spin" />}
                  </div>
                </div>

                {/* Caption */}
                <div className="relative flex flex-col xl:flex-row xl:items-start gap-1 xl:gap-3">
                  <label className="text-[#646970] xl:w-20 xl:text-right pt-1 font-medium">Caption</label>
                  <div className="flex-1 relative">
                    <textarea
                      value={editForm.caption}
                      onChange={e => setEditForm({ ...editForm, caption: e.target.value })}
                      onBlur={e => handleBlurSave('caption', e.target.value)}
                      className="w-full bg-white border border-[#8c8f94] rounded-sm px-2 py-1.5 focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none h-14 resize-none"
                    />
                    {savingField === 'caption' && <span className="absolute right-2 top-2 w-3 h-3 rounded-full border-2 border-[#2271b1] border-t-transparent animate-spin" />}
                  </div>
                </div>

                {/* Description */}
                <div className="relative flex flex-col xl:flex-row xl:items-start gap-1 xl:gap-3">
                  <label className="text-[#646970] xl:w-20 xl:text-right pt-1 font-medium">Description</label>
                  <div className="flex-1 relative">
                    <textarea
                      value={editForm.description}
                      onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                      onBlur={e => handleBlurSave('description', e.target.value)}
                      className="w-full bg-white border border-[#8c8f94] rounded-sm px-2 py-1.5 focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none h-24 resize-none"
                    />
                    {savingField === 'description' && <span className="absolute right-2 top-2 w-3 h-3 rounded-full border-2 border-[#2271b1] border-t-transparent animate-spin" />}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
