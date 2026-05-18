// File: app/admin/support/_components/wc-support-toolbar.tsx

"use client";

import { useState } from "react";
import { bulkUpdateTickets } from "@/app/actions/backend/support/support";
import { SupportQueryParams, GetTicketsResponse } from "../types";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { toast } from "sonner"; 
import { TicketStatus } from "@prisma/client";

interface WcSupportToolbarProps {
  queryParams: SupportQueryParams;
  setQueryParams: (params: SupportQueryParams) => void;
  meta?: GetTicketsResponse["meta"];
  selectedIds: string[];
  onRefresh: () => void;
  setSelectedIds: (ids: string[]) => void;
}

export const WcSupportToolbar = ({
  queryParams,
  setQueryParams,
  meta,
  selectedIds,
  onRefresh,
  setSelectedIds
}: WcSupportToolbarProps) => {
  const [bulkAction, setBulkAction] = useState("");
  const [localSearch, setLocalSearch] = useState(queryParams.search || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleBulkAction = async () => {
    if (!bulkAction || selectedIds.length === 0) {
        toast.error("Please select an action and at least one ticket.");
        return;
    }

    const confirmMessage = bulkAction === "delete" 
        ? "Are you sure you want to delete selected tickets permanently? This will also delete all messages." 
        : `Are you sure you want to mark selected tickets as ${bulkAction.replace("_", " ")}?`;

    if (!confirm(confirmMessage)) return;

    setIsUpdating(true);
    const res = await bulkUpdateTickets(selectedIds, bulkAction);
    
    if (res.success) {
      toast.success(res.message);
      setSelectedIds([]); 
      setBulkAction(""); 
      onRefresh(); 
    } else {
      toast.error(res.error || "Something went wrong!");
    }
    setIsUpdating(false);
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setQueryParams({ ...queryParams, search: localSearch, page: 1 });
  };

  const totalPages = meta?.totalPages || 1;
  const currentPage = queryParams.page || 1;
  
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setQueryParams({ ...queryParams, page });
  };

  return (
    // মোবাইলের জন্য flex-col এবং gap-3
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 py-2 text-[13px] text-[#2c3338] mb-2">
      
      {/* 1. Left Side: Bulk Actions */}
      <div className="flex items-center gap-1.5 w-full lg:w-auto">
        <select 
          value={bulkAction}
          onChange={(e) => setBulkAction(e.target.value)}
          className="flex-1 sm:flex-none border border-[#8c8f94] rounded-[3px] px-2 py-0.5 h-[30px] bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none sm:min-w-[150px]"
        >
          <option value="">Bulk actions</option>
          <option value={TicketStatus.RESOLVED}>Mark as Resolved</option>
          <option value={TicketStatus.CLOSED}>Mark as Closed</option>
          <option value={TicketStatus.IN_PROGRESS}>Mark as In Progress</option>
          <option value="delete">Delete permanently</option>
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
            placeholder="Search tickets, subject..." 
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