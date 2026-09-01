// app/(backend)/admin/media/_components/MediaPaginationControls.tsx
//
// Admin Products page-এর WP-style pagination-এর (pagination-controls.tsx)
// হুবহু ডিজাইন — শুধু সেটা URL/router-চালিত (server pagination), এখানে
// Media Library client-side state-এ পুরো লিস্ট রাখে, তাই এটা props/callback
// দিয়ে চলে।

'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useState, useEffect } from 'react';

interface MediaPaginationControlsProps {
  total: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function MediaPaginationControls({ total, currentPage, totalPages, onPageChange }: MediaPaginationControlsProps) {
  const [pageInput, setPageInput] = useState(String(currentPage));

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const goTo = (page: number) => {
    if (page < 1 || page > totalPages) return;
    onPageChange(page);
  };

  const handleInputSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const num = parseInt(pageInput);
      if (!isNaN(num)) goTo(num);
      else setPageInput(String(currentPage));
    }
  };

  return (
    <div className="flex items-center gap-2 text-[13px] text-[#3c434a]">
      <span className="text-[#646970]">{total} items</span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => goTo(1)}
          disabled={currentPage <= 1}
          className="px-1.5 py-[3px] bg-[#f6f7f7] border border-[#c3c4c7] rounded-[3px] text-[#8c8f94] hover:text-[#2271b1] hover:bg-white transition-colors disabled:opacity-50 disabled:bg-[#f0f0f1]"
          title="First Page"
        >
          <ChevronsLeft size={14} />
        </button>

        <button
          onClick={() => goTo(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-1.5 py-[3px] bg-[#f6f7f7] border border-[#c3c4c7] rounded-[3px] text-[#8c8f94] hover:text-[#2271b1] hover:bg-white transition-colors disabled:opacity-50 disabled:bg-[#f0f0f1]"
          title="Previous Page"
        >
          <ChevronLeft size={14} />
        </button>

        <span className="mx-1 flex items-center">
          <input
            type="text"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onKeyDown={handleInputSubmit}
            className="w-10 px-1 py-[3px] text-center border border-[#8c8f94] rounded-[3px] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none mx-1 text-[13px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)]"
          />
          <span className="text-[#646970]">of <span className="font-semibold text-[#3c434a] ml-0.5">{totalPages || 1}</span></span>
        </span>

        <button
          onClick={() => goTo(currentPage + 1)}
          disabled={currentPage >= totalPages || totalPages === 0}
          className="px-1.5 py-[3px] bg-[#f6f7f7] border border-[#c3c4c7] rounded-[3px] text-[#8c8f94] hover:text-[#2271b1] hover:bg-white transition-colors disabled:opacity-50 disabled:bg-[#f0f0f1]"
          title="Next Page"
        >
          <ChevronRight size={14} />
        </button>

        <button
          onClick={() => goTo(totalPages)}
          disabled={currentPage >= totalPages || totalPages === 0}
          className="px-1.5 py-[3px] bg-[#f6f7f7] border border-[#c3c4c7] rounded-[3px] text-[#8c8f94] hover:text-[#2271b1] hover:bg-white transition-colors disabled:opacity-50 disabled:bg-[#f0f0f1]"
          title="Last Page"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}
