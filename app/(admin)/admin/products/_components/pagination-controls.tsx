//app/admin/product/_components/pagination-controls.tsx

"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useState, useEffect } from "react";

interface PaginationControlsProps {
  total: number;
  currentPage: number;
  totalPages: number;
  perPage: number; // Keeping it for API limit logic, though WP doesn't always show the dropdown
}

export function PaginationControls({
  total,
  currentPage,
  totalPages,
}: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname(); 
  const searchParams = useSearchParams();
  
  // Local state for the input box so user can type a page number
  const [pageInput, setPageInput] = useState(String(currentPage));

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const updateUrl = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(pageNumber));
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleInputSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const num = parseInt(pageInput);
      if (!isNaN(num)) {
        updateUrl(num);
      } else {
        setPageInput(String(currentPage)); // Reset if invalid
      }
    }
  };

  return (
    // 🚀 WP Style Pagination: Right aligned, small text, compact buttons
    <div className="flex items-center gap-2 text-[13px] text-[#3c434a] ml-auto">
      <span className="text-[#646970]">{total} items</span>
      
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button 
          onClick={() => updateUrl(1)} 
          disabled={currentPage <= 1}
          className="px-1.5 py-[3px] bg-[#f6f7f7] border border-[#c3c4c7] rounded-[3px] text-[#8c8f94] hover:text-[#2271b1] hover:bg-white transition-colors disabled:opacity-50 disabled:bg-[#f0f0f1]"
          title="First Page"
        >
          <ChevronsLeft size={14} />
        </button>
        
        {/* Previous Page */}
        <button 
          onClick={() => updateUrl(currentPage - 1)} 
          disabled={currentPage <= 1}
          className="px-1.5 py-[3px] bg-[#f6f7f7] border border-[#c3c4c7] rounded-[3px] text-[#8c8f94] hover:text-[#2271b1] hover:bg-white transition-colors disabled:opacity-50 disabled:bg-[#f0f0f1]"
          title="Previous Page"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Current Page Input & Total Pages */}
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

        {/* Next Page */}
        <button 
          onClick={() => updateUrl(currentPage + 1)} 
          disabled={currentPage >= totalPages || totalPages === 0}
          className="px-1.5 py-[3px] bg-[#f6f7f7] border border-[#c3c4c7] rounded-[3px] text-[#8c8f94] hover:text-[#2271b1] hover:bg-white transition-colors disabled:opacity-50 disabled:bg-[#f0f0f1]"
          title="Next Page"
        >
          <ChevronRight size={14} />
        </button>
        
        {/* Last Page */}
        <button 
          onClick={() => updateUrl(totalPages)} 
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