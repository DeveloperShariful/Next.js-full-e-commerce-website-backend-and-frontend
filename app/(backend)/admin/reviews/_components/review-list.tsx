//app/(backend)/admin/reviews/_components/review-list.tsx

"use client";

import { useState } from "react";
import { ReviewData, PaginationData, ReviewStatus } from "../types";
import { Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import ReviewRow from "./review-row";

interface ListProps {
  reviews: ReviewData[];
  loading: boolean;
  handleStatusChange: (id: string, status: ReviewStatus) => void;
  handleDelete: (id: string) => void;
  handleRestore: (id: string) => void;
  handleForceDelete: (id: string) => void;
  handleBulkAction: (ids: string[], action: "approve" | "unapprove" | "delete" | "restore" | "force_delete" | "spam") => Promise<boolean>;
  handleReplySubmit: (id: string, text: string) => Promise<boolean>;
  currentFilter: string;
  setCurrentFilter: (f: string) => void;
  counts: { all: number; pending: number; approved: number; rejected: number; trash: number };
  ratingFilter: string;
  setRatingFilter: (r: string) => void;
  productSearch: string;
  setProductSearch: (p: string) => void;
  pagination: PaginationData;
  setCurrentPage: (p: number) => void;
}

export default function ReviewList({ 
  reviews, loading, handleStatusChange, handleDelete, handleRestore, handleForceDelete, handleBulkAction, handleReplySubmit,
  currentFilter, setCurrentFilter, counts, ratingFilter, setRatingFilter, productSearch, setProductSearch, pagination, setCurrentPage
}: ListProps) {
  
  type BulkActionType = "approve" | "unapprove" | "delete" | "restore" | "force_delete" | "spam";

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<"" | BulkActionType>("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [localProductInput, setLocalProductInput] = useState(productSearch);

  const allReviewIds = reviews.map(r => r.id);
  const totalItems = reviews.length; 
  const isAllSelected = totalItems > 0 && selectedIds.length === totalItems;

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(allReviewIds);
    else setSelectedIds([]);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) setSelectedIds(prev => [...prev, id]);
    else setSelectedIds(prev => prev.filter(item => item !== id));
  };

  const executeBulkAction = async () => {
    if (bulkAction === "" || selectedIds.length === 0) return;
    
    setIsProcessing(true);
    const finished = await handleBulkAction(selectedIds, bulkAction);
    if (finished) {
      setSelectedIds([]); 
      setBulkAction("");
    }
    setIsProcessing(false);
  };

  const applyFilters = () => {
    setProductSearch(localProductInput);
    setCurrentPage(1); 
  };

  return (
    <div className="animate-in fade-in duration-300">
      
      {/* Filters (All | Pending | Approved | Spam | Trash) */}
      <ul className="flex flex-wrap items-center gap-1 text-[13px] mb-3 text-[#646970]">
        {[
          { key: "all", label: "All", count: counts.all },
          { key: "pending", label: "Pending", count: counts.pending },
          { key: "approved", label: "Approved", count: counts.approved },
          { key: "rejected", label: "Spam", count: counts.rejected }
        ].map((tab, idx) => (
          <li key={tab.key} className="flex items-center gap-1">
            <button 
              onClick={() => { setCurrentFilter(tab.key); setSelectedIds([]); setCurrentPage(1); }} 
              className={`${currentFilter === tab.key ? "font-semibold text-[#1d2327]" : "text-[#2271b1] hover:text-[#0a4b78]"}`}
            >
              {tab.label} <span className="text-[#646970] font-normal">({tab.count})</span>
            </button>
            {idx < 3 && <span className="text-[#c3c4c7] ml-1">|</span>}
          </li>
        ))}
        {counts.trash > 0 && (
          <>
            <li className="text-[#c3c4c7]">|</li>
            <li>
              <button 
                onClick={() => { setCurrentFilter("trash"); setSelectedIds([]); setCurrentPage(1); }} 
                className={`${currentFilter === "trash" ? "font-semibold text-[#1d2327]" : "text-[#2271b1] hover:text-[#0a4b78]"}`}
              >
                Trash <span className="text-[#646970] font-normal">({counts.trash})</span>
              </button>
            </li>
          </>
        )}
      </ul>

      {/* Actions Bar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-2 gap-2">
        
        <div className="flex flex-wrap items-center gap-1.5 w-full xl:w-auto">
          
          <div className="flex items-center gap-1 mr-1">
            <select 
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value as typeof bulkAction)}
              disabled={isProcessing || reviews.length === 0}
              className="px-2 py-[3px] bg-white border border-[#8c8f94] rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] outline-none"
            >
              <option value="">Bulk actions</option>
              {currentFilter === "trash" ? (
                <>
                  <option value="restore">Restore</option>
                  <option value="force_delete">Delete permanently</option>
                </>
              ) : (
                <>
                  <option value="unapprove">Unapprove</option>
                  <option value="approve">Approve</option>
                  <option value="spam">Mark as spam</option>
                  <option value="delete">Move to Trash</option>
                </>
              )}
            </select>
            <button 
              onClick={executeBulkAction}
              disabled={bulkAction === "" || selectedIds.length === 0 || isProcessing}
              className="px-2.5 py-[3px] border border-[#2271b1] bg-[#f6f7f7] text-[#2271b1] rounded-[3px] text-[13px] hover:bg-[#f0f6fc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>

          <select className="px-2 py-[3px] bg-white border border-[#8c8f94] rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] outline-none hidden sm:block">
            <option>All types</option>
            <option>Review</option>
          </select>

          <select 
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-2 py-[3px] bg-white border border-[#8c8f94] rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] outline-none"
          >
            <option value="all">All ratings</option>
            <option value="5">5 stars</option>
            <option value="4">4 stars</option>
            <option value="3">3 stars</option>
            <option value="2">2 stars</option>
            <option value="1">1 star</option>
          </select>

          <div className="flex items-stretch shadow-sm">
            <input 
              type="text" 
              value={localProductInput} 
              onChange={(e) => setLocalProductInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              className="w-[140px] sm:w-[180px] px-2 py-[3px] border border-[#8c8f94] text-[13px] text-[#3c434a] focus:border-[#2271b1] outline-none rounded-l-[3px]"
              placeholder="Search for a product..."
            />
            <button onClick={applyFilters} className="px-3 py-[3px] border border-l-0 border-[#8c8f94] bg-[#f6f7f7] text-[#2271b1] text-[13px] hover:bg-[#f0f0f1] transition-colors rounded-r-[3px]">
              Filter
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[13px] text-[#3c434a] ml-auto">
          <span>{pagination.totalItems} items</span>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentPage(1)} 
              disabled={pagination.currentPage === 1 || loading}
              className="px-1.5 py-[3px] bg-[#f6f7f7] border border-[#c3c4c7] rounded-[3px] text-[#a7aaad] hover:text-[#2271b1] hover:bg-white transition-colors disabled:opacity-50 disabled:bg-[#f0f0f1]"
            >
              <ChevronsLeft size={14} />
            </button>
            <button 
              onClick={() => setCurrentPage(pagination.currentPage - 1)} 
              disabled={pagination.currentPage === 1 || loading}
              className="px-1.5 py-[3px] bg-[#f6f7f7] border border-[#c3c4c7] rounded-[3px] text-[#a7aaad] hover:text-[#2271b1] hover:bg-white transition-colors disabled:opacity-50 disabled:bg-[#f0f0f1]"
            >
              <ChevronLeft size={14} />
            </button>

            <span className="mx-1">
               <input 
                 type="number" 
                 value={pagination.currentPage} 
                 readOnly 
                 className="w-10 px-1 py-[3px] text-center border border-[#8c8f94] rounded-[3px] focus:border-[#2271b1] outline-none mx-1"
               /> 
               of <span className="font-semibold">{pagination.totalPages || 1}</span>
            </span>

            <button 
              onClick={() => setCurrentPage(pagination.currentPage + 1)} 
              disabled={pagination.currentPage === pagination.totalPages || loading || pagination.totalPages === 0}
              className="px-1.5 py-[3px] bg-[#f6f7f7] border border-[#c3c4c7] rounded-[3px] text-[#a7aaad] hover:text-[#2271b1] hover:bg-white transition-colors disabled:opacity-50 disabled:bg-[#f0f0f1]"
            >
              <ChevronRight size={14} />
            </button>
            <button 
              onClick={() => setCurrentPage(pagination.totalPages)} 
              disabled={pagination.currentPage === pagination.totalPages || loading || pagination.totalPages === 0}
              className="px-1.5 py-[3px] bg-[#f6f7f7] border border-[#c3c4c7] rounded-[3px] text-[#a7aaad] hover:text-[#2271b1] hover:bg-white transition-colors disabled:opacity-50 disabled:bg-[#f0f0f1]"
            >
              <ChevronsRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* WP List Table */}
      <div className="bg-white border border-[#c3c4c7] shadow-sm">
        {/* 🚀 REMOVED min-h-[400px] to fix the white space issue */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] text-[#3c434a] border-collapse min-w-[800px]">
            
            <thead className="bg-[#f6f7f7] border-b border-[#c3c4c7] text-[13px] font-normal text-[#1d2327]">
              <tr>
                <th className="p-2 w-8 text-center border-r border-[#e2e4e7]">
                  <input 
                    type="checkbox" 
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    disabled={loading || totalItems === 0}
                    className="w-3.5 h-3.5 rounded-[2px] border-[#8c8f94] focus:ring-[#2271b1] cursor-pointer" 
                  />
                </th>
                <th className="p-2 w-16 text-center border-r border-[#e2e4e7]">Type</th>
                <th className="p-2 w-48 font-medium">Author</th>
                <th className="p-2 w-24 font-medium text-center">Rating</th>
                <th className="p-2 min-w-[250px]">Review</th>
                <th className="p-2 w-48">Product</th>
                <th className="p-2 w-32">Submitted on</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-[#f0f0f1]">
              {loading ? (
                // 🚀 Added h-[150px] so it looks balanced without breaking the table
                <tr>
                  <td colSpan={7} className="h-[150px] text-center text-[#50575e] bg-white">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="animate-spin text-[#2271b1]" size={20}/>
                      <span>Loading reviews...</span>
                    </div>
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                // 🚀 Added h-[150px] for empty state
                <tr>
                  <td colSpan={7} className="h-[150px] text-center text-[#50575e] italic bg-white">
                    No reviews found matching your filters.
                  </td>
                </tr>
              ) : (
                <ReviewRow 
                  reviews={reviews} 
                  handleStatusChange={handleStatusChange} 
                  handleDelete={handleDelete} 
                  handleRestore={handleRestore} 
                  handleForceDelete={handleForceDelete} 
                  handleReplySubmit={handleReplySubmit} 
                  selectedIds={selectedIds} 
                  handleSelectOne={handleSelectOne} 
                  currentFilter={currentFilter} 
                />
              )}
            </tbody>

            <tfoot className="bg-[#f6f7f7] border-t border-[#c3c4c7] text-[13px] font-normal text-[#1d2327]">
              <tr>
                <th className="p-2 w-8 text-center border-r border-[#e2e4e7]">
                  <input 
                    type="checkbox" 
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    disabled={loading || totalItems === 0}
                    className="w-3.5 h-3.5 rounded-[2px] border-[#8c8f94] focus:ring-[#2271b1] cursor-pointer" 
                  />
                </th>
                <th className="p-2 text-center border-r border-[#e2e4e7]">Type</th>
                <th className="p-2 font-medium">Author</th>
                <th className="p-2 text-center font-medium">Rating</th>
                <th className="p-2">Review</th>
                <th className="p-2">Product</th>
                <th className="p-2">Submitted on</th>
              </tr>
            </tfoot>

          </table>
        </div>
      </div>
      
    </div>
  );
}
