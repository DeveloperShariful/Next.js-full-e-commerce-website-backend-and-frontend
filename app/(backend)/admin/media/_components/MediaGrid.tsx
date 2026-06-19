// app/(backend)/admin/media/_components/MediaGrid.tsx

'use client';

import Image from 'next/image';
import { Media } from '@prisma/client'; // NEW: Imported original Prisma Type
import { IoDocumentTextOutline, IoVideocamOutline, IoCheckmarkOutline } from 'react-icons/io5';

type MediaGridProps = {
  filteredMedia: Media[]; // Strongly typed array
  isBulkMode: boolean;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedIndex: (val: number | null) => void;
};

export default function MediaGrid(props: MediaGridProps) {
  const { filteredMedia, isBulkMode, selectedIds, setSelectedIds, setSelectedIndex } = props;

  const handleItemClick = (index: number, id: string) => {
    if (isBulkMode) {
      setSelectedIds((prev) => 
        prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
      );
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

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 auto-rows-max px-2 md:px-0">
      {filteredMedia.map((file, index) => {
        const isSelected = selectedIds.includes(file.id);

        return (
          <div 
            key={file.id} 
            onClick={() => handleItemClick(index, file.id)}
            className={`
              group relative w-full aspect-square bg-[#f0f0f1] border shadow-sm cursor-pointer transition-all focus:ring-2 focus:ring-[#2271b1]
              ${isBulkMode ? 'hover:border-[#2271b1]' : 'hover:border-[#2271b1] hover:shadow-md'}
              ${isSelected ? 'border-[#2271b1] ring-2 ring-[#2271b1]' : 'border-[#c3c4c7]'}
            `}
          >
            {/* Media Rendering based on strong Type */}
            {file.type === 'VIDEO' ? (
              <div className="w-full h-full relative bg-[#1d2327]">
                <video
                  src={`${file.url}#t=1`}
                  className="w-full h-full object-cover"
                  preload="metadata"
                  muted
                  playsInline
                />
                {/* Play icon center */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black/50 rounded-full p-1.5">
                    <svg className="w-4 h-4 text-white fill-white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </div>
                {/* Video badge bottom-left */}
                <div className="absolute bottom-1 left-1 bg-black/60 rounded-sm px-1 py-0.5 flex items-center gap-0.5 pointer-events-none">
                  <IoVideocamOutline size={10} className="text-white" />
                </div>
              </div>
            ) : file.type === 'DOCUMENT' ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-white text-gray-700 p-2">
                <IoDocumentTextOutline size={32} className="text-[#2271b1] mb-2" />
                <span className="text-[10px] truncate w-full text-center px-1">{file.filename}</span>
              </div>
            ) : (
              <Image 
                src={file.url} 
                alt={file.altText || file.filename} 
                fill 
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 15vw"
                className={`object-cover transition-transform ${isBulkMode && isSelected ? 'scale-95 opacity-80' : ''}`} 
              />
            )}

            {/* Source Badge */}
            {file.source && file.source !== 'GENERAL' && (
              <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                {file.source}
              </span>
            )}

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