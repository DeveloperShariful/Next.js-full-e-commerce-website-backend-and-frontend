// app/(backend)/admin/media/_components/MediaGrid.tsx

'use client';

import Image from 'next/image';
import { Media, MediaType } from '@prisma/client';
import { IoDocumentTextOutline, IoVideocamOutline, IoCheckmarkOutline, IoImageOutline } from 'react-icons/io5';

type ViewMode = 'grid' | 'list';

type MediaGridProps = {
  filteredMedia: Media[];
  isBulkMode: boolean;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedIndex: (val: number | null) => void;
  viewMode?: ViewMode;
};

function formatBytes(bytes: number) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaGrid(props: MediaGridProps) {
  const { filteredMedia, isBulkMode, selectedIds, setSelectedIds, setSelectedIndex, viewMode = 'grid' } = props;

  const handleItemClick = (index: number, id: string) => {
    if (isBulkMode) {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    } else {
      setSelectedIndex(index);
    }
  };

  if (filteredMedia.length === 0) {
    return (
      <div className="text-center py-20 bg-white border border-[#c3c4c7] rounded-sm text-gray-500 shadow-sm mx-2 md:mx-0">
        No media files found.
      </div>
    );
  }

  // ── LIST VIEW ──
  if (viewMode === 'list') {
    return (
      <div className="bg-white border border-[#c3c4c7] rounded-sm shadow-sm mx-2 md:mx-0 overflow-hidden">
        <table className="w-full text-[13px] text-[#2c3338]">
          <thead className="bg-[#f6f7f7] border-b border-[#c3c4c7]">
            <tr>
              {isBulkMode && <th className="w-10 px-3 py-2" />}
              <th className="px-3 py-2 text-left font-semibold text-[#1d2327] w-12">File</th>
              <th className="px-3 py-2 text-left font-semibold text-[#1d2327]">Name</th>
              <th className="px-3 py-2 text-left font-semibold text-[#1d2327] hidden sm:table-cell">Type</th>
              <th className="px-3 py-2 text-left font-semibold text-[#1d2327] hidden md:table-cell">Size</th>
              <th className="px-3 py-2 text-left font-semibold text-[#1d2327] hidden lg:table-cell">Source</th>
              <th className="px-3 py-2 text-left font-semibold text-[#1d2327] hidden lg:table-cell">Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredMedia.map((file, index) => {
              const isSelected = selectedIds.includes(file.id);
              return (
                <tr
                  key={file.id}
                  onClick={() => handleItemClick(index, file.id)}
                  className={`border-b border-[#f0f0f1] cursor-pointer transition-colors hover:bg-[#f6f7f7] ${isSelected ? 'bg-[#e8f0fc]' : ''}`}
                >
                  {isBulkMode && (
                    <td className="px-3 py-2">
                      <div className={`w-4 h-4 border-2 flex items-center justify-center ${isSelected ? 'bg-[#2271b1] border-[#2271b1]' : 'bg-white border-[#8c8f94]'}`}>
                        {isSelected && <IoCheckmarkOutline className="text-white text-xs" />}
                      </div>
                    </td>
                  )}
                  <td className="px-3 py-2">
                    <div className="w-10 h-10 relative bg-[#f0f0f1] rounded-sm overflow-hidden shrink-0">
                      {file.type === MediaType.IMAGE ? (
                        <Image src={file.url} alt={file.altText || file.filename} fill sizes="40px" className="object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : file.type === MediaType.VIDEO ? (
                        <div className="w-full h-full flex items-center justify-center bg-[#1d2327]">
                          <IoVideocamOutline size={16} className="text-white" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <IoDocumentTextOutline size={18} className="text-[#2271b1]" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 max-w-[200px]">
                    <p className="truncate font-medium text-[#2271b1]">{file.originalName || file.filename}</p>
                    {file.altText && <p className="truncate text-[11px] text-[#646970]">{file.altText}</p>}
                  </td>
                  <td className="px-3 py-2 hidden sm:table-cell">
                    <span className="px-1.5 py-0.5 bg-[#f0f0f1] rounded-sm text-[11px] uppercase tracking-wide">{file.type}</span>
                  </td>
                  <td className="px-3 py-2 hidden md:table-cell text-[#646970]">{formatBytes(file.size)}</td>
                  <td className="px-3 py-2 hidden lg:table-cell">
                    {file.source !== 'GENERAL' && (
                      <span className="px-1.5 py-0.5 bg-[#f0f0f1] rounded-sm text-[11px] uppercase tracking-wide">{file.source}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 hidden lg:table-cell text-[#646970]">
                    {new Date(file.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // ── GRID VIEW ──
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 auto-rows-max px-2 md:px-0">
      {filteredMedia.map((file, index) => {
        const isSelected = selectedIds.includes(file.id);

        return (
          <div
            key={file.id}
            onClick={() => handleItemClick(index, file.id)}
            className={`
              group relative w-full aspect-square bg-[#f0f0f1] border shadow-sm cursor-pointer transition-all
              ${isBulkMode ? 'hover:border-[#2271b1]' : 'hover:border-[#2271b1] hover:shadow-md'}
              ${isSelected ? 'border-[#2271b1] ring-2 ring-[#2271b1]' : 'border-[#c3c4c7]'}
            `}
          >
            {file.type === MediaType.VIDEO ? (
              <div className="w-full h-full relative bg-[#1d2327]">
                <video src={`${file.url}#t=1`} className="w-full h-full object-cover" preload="metadata" muted playsInline />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black/50 rounded-full p-1.5">
                    <svg className="w-4 h-4 text-white fill-white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </div>
                <div className="absolute bottom-1 left-1 bg-black/60 rounded-sm px-1 py-0.5 flex items-center gap-0.5 pointer-events-none">
                  <IoVideocamOutline size={10} className="text-white" />
                </div>
              </div>
            ) : file.type === MediaType.DOCUMENT ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-white text-gray-700 p-2">
                <IoDocumentTextOutline size={32} className="text-[#2271b1] mb-2" />
                <span className="text-[10px] truncate w-full text-center px-1">{file.filename}</span>
              </div>
            ) : (
              <div className="w-full h-full relative">
                <Image
                  src={file.url}
                  alt={file.altText || file.filename}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 15vw"
                  className={`object-cover transition-transform ${isBulkMode && isSelected ? 'scale-95 opacity-80' : ''}`}
                  onError={(e) => {
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      (e.target as HTMLImageElement).style.display = 'none';
                      parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg xmlns=\'http://www.w3.org/2000/svg\' class=\'w-8 h-8 text-gray-400\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1\' d=\'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z\'/></svg></div>';
                    }
                  }}
                />
              </div>
            )}

            {/* Source Badge */}
            {file.source && file.source !== 'GENERAL' && (
              <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                {file.source}
              </span>
            )}

            {/* Filename tooltip on hover */}
            <div className="absolute bottom-0 inset-x-0 bg-[#1d2327]/80 text-white text-[9px] px-1.5 py-[3px] truncate opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {file.filename}
            </div>

            {/* Bulk Selection Checkmark */}
            {isBulkMode && (
              <div className="absolute top-2 right-2">
                <div className={`w-6 h-6 border-2 flex items-center justify-center transition-colors shadow-sm
                  ${isSelected ? 'bg-[#2271b1] border-[#2271b1]' : 'bg-white/80 border-gray-400 group-hover:border-[#2271b1]'}
                `}>
                  {isSelected && <IoCheckmarkOutline className="text-white text-lg font-bold" />}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
