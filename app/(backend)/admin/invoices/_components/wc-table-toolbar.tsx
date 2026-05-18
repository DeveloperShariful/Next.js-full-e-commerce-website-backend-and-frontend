// File: app/admin/invoices/_components/wc-table-toolbar.tsx

"use client";

import { useState } from "react";
import { bulkUpdateInvoices } from "@/app/actions/backend/invoice/invoice";
import { InvoiceQueryParams, GetInvoicesResponse } from "../types";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { toast } from "sonner"; // For notifications

interface WcTableToolbarProps {
  queryParams: InvoiceQueryParams;
  setQueryParams: (params: InvoiceQueryParams) => void;
  meta?: GetInvoicesResponse["meta"];
  selectedIds: string[];
  onRefresh: () => void;
  setSelectedIds: (ids: string[]) => void;
}

export const WcTableToolbar = ({
  queryParams,
  setQueryParams,
  meta,
  selectedIds,
  onRefresh,
  setSelectedIds
}: WcTableToolbarProps) => {
  const [bulkAction, setBulkAction] = useState("");
  const [localSearch, setLocalSearch] = useState(queryParams.search || "");
  const [isUpdating, setIsUpdating] = useState(false);

  // Bulk Action Submit Handler
  const handleBulkAction = async () => {
    if (!bulkAction || selectedIds.length === 0) {
        toast.error("Please select an action and at least one item.");
        return;
    }

    const confirmMessage = bulkAction === "trash" 
        ? "Are you sure you want to move selected orders to trash?" 
        : `Are you sure you want to mark selected orders as ${bulkAction.toLowerCase()}?`;

    if (!confirm(confirmMessage)) return;

    setIsUpdating(true);
    const res = await bulkUpdateInvoices(selectedIds, bulkAction);
    
    if (res.success) {
      toast.success("Bulk action applied successfully!");
      setSelectedIds([]); // Clear selection
      setBulkAction(""); // Reset dropdown
      onRefresh(); // Refresh table data
    } else {
      toast.error(res.error || "Something went wrong!");
    }
    setIsUpdating(false);
  };

  // Search Submit Handler
  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setQueryParams({ ...queryParams, search: localSearch, page: 1 });
  };

  // Pagination Logic
  const totalPages = meta?.totalPages || 1;
  const currentPage = queryParams.page || 1;
  
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setQueryParams({ ...queryParams, page });
  };

  return (
    // মোবাইলের জন্য flex-col এবং gap-3 যোগ করা হয়েছে
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 py-2 text-[13px] text-[#2c3338] mb-2">
      
      {/* 1. Left Side: Bulk Actions */}
      <div className="flex items-center gap-1.5 w-full lg:w-auto">
        <select 
          value={bulkAction}
          onChange={(e) => setBulkAction(e.target.value)}
          className="flex-1 sm:flex-none border border-[#8c8f94] rounded-[3px] px-2 py-0.5 h-[30px] bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none sm:min-w-[150px]"
        >
          <option value="">Bulk actions</option>
          <option value="trash">Move to Trash</option>
          <option value="PROCESSING">Mark processing</option>
          <option value="SHIPPED">Mark shipped</option>
          <option value="DELIVERED">Mark completed</option>
        </select>
        <button 
          onClick={handleBulkAction}
          disabled={isUpdating}
          className="border border-[#2271b1] bg-[#f6f7f7] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] px-3 h-[30px] rounded-[3px] disabled:opacity-50 whitespace-nowrap"
        >
          {isUpdating ? "Applying..." : "Apply"}
        </button>
      </div>

      {/* 2. Right Side: Pagination & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
        
        {/* Pagination Controls - wrap ensure করা হলো */}
        <div className="flex flex-wrap items-center gap-2 text-[#50575e]">
          <span>{meta?.total || 0} items</span>
          
          <div className="flex items-center gap-1">
            <button onClick={() => goToPage(1)} disabled={currentPage === 1} className="p-1 border border-[#c3c4c7] rounded-[3px] bg-[#f6f7f7] hover:bg-[#f0f0f1] disabled:opacity-50"><ChevronsLeft size={16}/></button>
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="p-1 border border-[#c3c4c7] rounded-[3px] bg-[#f6f7f7] hover:bg-[#f0f0f1] disabled:opacity-50"><ChevronLeft size={16}/></button>

            <span className="px-1 whitespace-nowrap">
               <input 
                 type="number" 
                 value={currentPage}
                 onChange={(e) => goToPage(Number(e.target.value))}
                 className="w-10 text-center border border-[#8c8f94] h-[28px] rounded-[3px]"
                 min={1} max={totalPages}
               /> of <span className="font-medium">{totalPages}</span>
            </span>

            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="p-1 border border-[#c3c4c7] rounded-[3px] bg-[#f6f7f7] hover:bg-[#f0f0f1] disabled:opacity-50"><ChevronRight size={16}/></button>
            <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} className="p-1 border border-[#c3c4c7] rounded-[3px] bg-[#f6f7f7] hover:bg-[#f0f0f1] disabled:opacity-50"><ChevronsRight size={16}/></button>
          </div>
        </div>

        {/* Search Box - মোবাইলে w-full করে দেওয়া হয়েছে */}
        <form onSubmit={handleSearch} className="flex items-center w-full sm:w-auto">
          <input 
            type="search" 
            placeholder="Search orders..." 
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="flex-1 sm:flex-none border border-[#8c8f94] rounded-l-[3px] px-2 py-0.5 h-[30px] bg-white focus:border-[#2271b1] outline-none sm:w-[180px]"
          />
          <button 
            type="submit"
            className="border border-l-0 border-[#8c8f94] bg-[#f6f7f7] text-[#2c3338] hover:bg-[#f0f0f1] px-3 h-[30px] rounded-r-[3px]"
          >
            Search
          </button>
        </form>

      </div>
    </div>
  );
};