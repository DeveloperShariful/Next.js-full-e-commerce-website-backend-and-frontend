// File Location: app/admin/coupons/_components/coupons-header.tsx

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CouponImportExportButtons } from "./coupon-import-export"; 
import { CouponCountsType } from "../types";

interface CouponsHeaderProps {
  counts: CouponCountsType; // ✅ FIXED: Replaced Record<string, number> with strict type
  totalItems: number; 
  currentPage: number;
  totalPages: number;
}

export const CouponsHeader = ({ counts, totalItems, currentPage, totalPages }: CouponsHeaderProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") || "all";
  const [query, setQuery] = useState(searchParams.get("query") || "");
  
  // Type Filter State
  const [selectedType, setSelectedType] = useState(searchParams.get("type") || "all");

  const updateFilters = (newParams: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(newParams).forEach(([key, value]) => {
          if (value) params.set(key, value);
          else params.delete(key);
      });
      params.set("page", "1");
      router.push(`/admin/coupons?${params.toString()}`);
  };

  const handleStatusChange = (val: string) => {
    updateFilters({ status: val === "all" ? undefined : val });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ query: query || undefined });
  };

  const applyTypeFilter = () => {
    updateFilters({ type: selectedType === "all" ? undefined : selectedType });
  };

  // Top Pagination Handler
  const handlePageChange = (newPage: number) => {
      if (newPage < 1 || newPage > totalPages) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(newPage));
      router.push(`/admin/coupons?${params.toString()}`);
  };

  const statuses = [
    { id: "all", label: "All", countKey: "all" as keyof CouponCountsType },
    { id: "mine", label: "Mine", countKey: "mine" as keyof CouponCountsType },
    { id: "published", label: "Published", countKey: "published" as keyof CouponCountsType },
    { id: "affiliate", label: "Affiliate Coupons", countKey: "affiliate" as keyof CouponCountsType },
    { id: "trash", label: "Trash", countKey: "trash" as keyof CouponCountsType },
  ];

  return (
    <div className="mb-2">
      
     {/* Top Header (Responsive) */}
      <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-4 mb-4 w-full">
        
        {/* Title & Add Button */}
        <div className="flex items-center gap-3">
            <h1 className="text-[23px] font-normal text-[#1d2327]">Coupons</h1>
            <Link 
                href="/admin/coupons/create" 
                className="border border-[#2271b1] text-[#2271b1] hover:bg-[#f6f7f7] hover:text-[#135e96] hover:border-[#135e96] transition-colors px-2.5 py-1 text-[13px] rounded-[3px] font-medium shadow-sm whitespace-nowrap"
            >
                Add new coupon
            </Link>
        </div>

        {/* ✅ Import/Export Buttons (Moves to next line on small screens) */}
        <div className="w-full sm:w-auto flex justify-end">
            <CouponImportExportButtons />
        </div>

      </div>
      

      {/* Status Links & Search Box */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 text-[13px]">
        
        <ul className="flex flex-wrap items-center text-[#646970] gap-1 m-0 p-0 list-none mb-3 md:mb-0">
          {statuses.map((status, index) => {
            // ✅ FIXED: Safely getting the count value
            const count = counts[status.countKey] || 0;
            
            // Hide if count is 0 (except 'all' and currently active status)
            if (count === 0 && status.id !== "all" && currentStatus !== status.id) return null;
            
            const isActive = currentStatus === status.id;

            return (
              <li key={status.id} className="inline-block">
                <button
                  onClick={() => handleStatusChange(status.id)}
                  className={cn(
                    "hover:text-[#135e96] transition-colors",
                    isActive ? "text-[#000] font-semibold" : "text-[#2271b1]",
                    status.id === "trash" && isActive ? "text-[#d63638]" : "" // Make active Trash red
                  )}
                >
                  {status.label} <span className="text-[#646970] font-normal">({count})</span>
                </button>
                {index < statuses.length - 1 && <span className="mx-1 text-[#a7aaad]">|</span>}
              </li>
            );
          })}
        </ul>

        <form onSubmit={handleSearch} className="flex items-center w-full md:w-auto">
            <input 
                type="search" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full md:w-auto border border-[#8c8f94] bg-white h-[30px] px-2 text-[13px] text-[#32373c] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none rounded-[3px] shadow-sm"
            />
            <button type="submit" className="ml-1 border border-[#8c8f94] bg-[#f6f7f7] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] h-[30px] px-3 text-[13px] rounded-[3px] font-medium transition-colors shadow-sm whitespace-nowrap">
                Search coupons
            </button>
        </form>

      </div>

      {/* Filter by Type & Top Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 mb-2 text-[13px]">
          
          <div className="flex items-center gap-1 w-full sm:w-auto mb-2 sm:mb-0">
              <select 
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full sm:w-auto border border-[#8c8f94] bg-white h-[30px] px-2 text-[#32373c] outline-none shadow-sm min-w-[150px] rounded-[3px] cursor-pointer"
              >
                  <option value="all">Show all types</option>
                  <option value="PERCENTAGE">Percentage discount</option>
                  <option value="FIXED_CART">Fixed cart discount</option>
                  <option value="FIXED_PRODUCT">Fixed product discount</option>
              </select>
              <button 
                  onClick={applyTypeFilter}
                  className="border border-[#2271b1] bg-[#f6f7f7] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] h-[30px] px-3 rounded-[3px] font-medium transition-colors shadow-sm"
              >
                  Filter
              </button>
          </div>

          {/* Top Pagination (Like WooCommerce) */}
          {totalItems > 0 && (
              <div className="flex items-center gap-1.5 text-[#646970]">
                  <span className="mr-1">{totalItems} items</span>
                  
                  <button onClick={() => handlePageChange(1)} disabled={currentPage <= 1} className="w-[30px] h-[30px] flex justify-center items-center border border-[#8c8f94] bg-[#f6f7f7] rounded-[3px] hover:bg-[#f0f0f1] disabled:opacity-50 text-[#2271b1] transition-colors">«</button>
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1} className="w-[30px] h-[30px] flex justify-center items-center border border-[#8c8f94] bg-[#f6f7f7] rounded-[3px] hover:bg-[#f0f0f1] disabled:opacity-50 text-[#2271b1] transition-colors">‹</button>
                  
                  <span className="flex items-center gap-1 mx-1">
                      <input type="text" value={currentPage} readOnly className="w-[35px] h-[30px] text-center border border-[#8c8f94] bg-white shadow-inner rounded-[3px]" />
                      of <span className="font-medium text-[#3c434a]">{totalPages}</span>
                  </span>
                  
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages} className="w-[30px] h-[30px] flex justify-center items-center border border-[#8c8f94] bg-[#f6f7f7] rounded-[3px] hover:bg-[#f0f0f1] disabled:opacity-50 text-[#2271b1] transition-colors">›</button>
                  <button onClick={() => handlePageChange(totalPages)} disabled={currentPage >= totalPages} className="w-[30px] h-[30px] flex justify-center items-center border border-[#8c8f94] bg-[#f6f7f7] rounded-[3px] hover:bg-[#f0f0f1] disabled:opacity-50 text-[#2271b1] transition-colors">»</button>
              </div>
          )}
      </div>

    </div>
  );
};