// File Location: app/admin/orders/_components/pagination-controls.tsx

"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface PaginationControlsProps {
  total: number;
  currentPage: number;
  totalPages: number;
  perPage: number;
}

export function PaginationControls({
  total,
  currentPage,
  totalPages,
  perPage,
}: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname(); 
  const searchParams = useSearchParams();

  // 🔥 FIXED: Local state to keep UI in sync instantly when dropdown changes
  const [localLimit, setLocalLimit] = useState(String(perPage));

  useEffect(() => {
    setLocalLimit(String(perPage));
  }, [perPage]);

  const updateUrl = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    
    if (key === "limit") params.set("page", "1");
    
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVal = e.target.value;
    setLocalLimit(newVal);
    updateUrl("limit", newVal);
  };

  const btnClass = "min-w-[30px] h-[30px] px-2 flex items-center justify-center border border-[#8c8f94] bg-[#f6f7f7] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] rounded-[3px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center py-3 mt-2 text-[13px] text-[#3c434a] font-sans">
      
      <div className="flex items-center gap-2 mb-3 sm:mb-0">
          <select 
            value={localLimit}
            onChange={handleLimitChange}
            className="border border-[#8c8f94] bg-white h-[30px] px-2 text-[13px] text-[#32373c] focus:border-[#2271b1] focus:ring-1 outline-none shadow-sm"
          >
              <option value="20">20 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
              <option value="200">200 per page</option>
              {/* Added 500 options for bulk view if needed */}
              <option value="500">500 per page</option>
          </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[#646970] mr-2">{total} items</span>

        <button
          className={btnClass}
          disabled={currentPage <= 1}
          onClick={() => updateUrl("page", "1")}
          title="First page"
        >«</button>

        <button
          className={btnClass}
          disabled={currentPage <= 1}
          onClick={() => updateUrl("page", String(currentPage - 1))}
          title="Previous page"
        >‹</button>

        <span className="flex items-center gap-1 mx-1 text-[#646970]">
          <input 
            type="text" 
            value={currentPage} 
            readOnly
            className="w-[35px] h-[30px] text-center border border-[#8c8f94] bg-white text-[#32373c] shadow-inner outline-none"
          />
          <span className="mx-1">of</span>
          <span className="font-medium text-[#3c434a]">{totalPages}</span>
        </span>

        <button
          className={btnClass}
          disabled={currentPage >= totalPages}
          onClick={() => updateUrl("page", String(currentPage + 1))}
          title="Next page"
        >›</button>

        <button
          className={btnClass}
          disabled={currentPage >= totalPages}
          onClick={() => updateUrl("page", String(totalPages))}
          title="Last page"
        >»</button>

      </div>
    </div>
  );
}