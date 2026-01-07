//app/admin/orders/_components/pagination-controls.tsx

"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const pathname = usePathname(); // ✅ অটোমেটিক বর্তমান পেজের পাথ ধরবে (যেমন: /admin/products)
  const searchParams = useSearchParams();

  // --- URL Update Function ---
  const updateUrl = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    
    // Limit পাল্টালে Page 1 এ রিসেট করা
    if (key === "limit") params.set("page", "1");
    
    // ✅ ডাইনামিক রাউটিং (Hardcoded Path সরানো হয়েছে)
    router.push(`${pathname}?${params.toString()}`);
  };

  const start = (currentPage - 1) * perPage + 1;
  const end = Math.min(currentPage * perPage, total);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center py-4 border-t border-slate-200 mt-4 gap-4 text-sm text-slate-600 select-none">
      
      {/* Left: Showing Info */}
      <div className="font-medium">
        Showing {total === 0 ? 0 : start} to {end} of {total} items
      </div>

      <div className="flex items-center gap-4">
        
        {/* Rows Per Page Dropdown */}
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-slate-500">Rows per page:</span>
          <Select
            value={String(perPage)}
            onValueChange={(val) => updateUrl("limit", val)}
          >
            <SelectTrigger className="h-8 w-[70px] bg-white border-slate-300">
              <SelectValue placeholder={String(perPage)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="200">200</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 lg:w-auto lg:px-3 bg-white border-slate-300 hover:bg-slate-50 disabled:opacity-50"
            disabled={currentPage <= 1}
            onClick={() => updateUrl("page", String(currentPage - 1))}
          >
            <ChevronLeft className="h-4 w-4 lg:mr-1" />
            <span className="hidden lg:inline">Previous</span>
          </Button>

          <div className="h-8 px-3 flex items-center justify-center border border-blue-500 bg-blue-50 text-blue-600 rounded-md font-bold min-w-[32px]">
            {currentPage}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 lg:w-auto lg:px-3 bg-white border-slate-300 hover:bg-slate-50 disabled:opacity-50"
            disabled={currentPage >= totalPages}
            onClick={() => updateUrl("page", String(currentPage + 1))}
          >
            <span className="hidden lg:inline">Next</span>
            <ChevronRight className="h-4 w-4 lg:ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}