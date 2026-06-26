//app/(backend)/admin/reviews/_components/review-view.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
// 🚀 FIXED: Added ReviewStatus import to fix the Type Error
import { ReviewData, PaginationData, ReviewStatus } from "../types";

import {
  getReviews,
  updateReviewStatus,
  deleteReview,
  restoreReview,
  forceDeleteReview,
  submitReply,
  bulkUpdateReviewStatus,
  bulkRestoreReviews,
  bulkForceDeleteReviews,
} from "@/app/actions/backend/review/actions";

import ReviewHeader from "./header";
import ReviewList from "./review-list";

export default function ReviewView() {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Advanced Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [productSearch, setProductSearch] = useState("");
  
  // Tab & Pagination States
  const [currentFilter, setCurrentFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData>({ totalItems: 0, totalPages: 1, currentPage: 1, limit: 20 });
  const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0, trash: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getReviews(currentFilter, searchQuery, ratingFilter, productSearch, currentPage);
      if (res.success) {
        setReviews(res.data);
        setCounts(res.counts);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (error) {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [currentFilter, searchQuery, ratingFilter, productSearch, currentPage]); 

  // Debounce for search inputs
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 400); 
    return () => clearTimeout(timer);
  }, [fetchData]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [currentFilter, searchQuery, ratingFilter, productSearch]);

  // --- BASIC ACTIONS ---
  
  // 🚀 FIXED: Used ReviewStatus type to match ReviewList props perfectly
  const handleStatusChange = async (id: string, status: ReviewStatus) => {
    const toastId = toast.loading("Updating status...");
    // We cast it to ensure server action accepts it without complaining about TRASH
    const res = await updateReviewStatus(id, status as "PENDING" | "APPROVED" | "SPAM");
    if (res.success) {
      toast.success(res.message as string, { id: toastId });
      fetchData();
    } else toast.error(res.error as string, { id: toastId });
  };

  const handleDelete = async (id: string) => {
    const toastId = toast.loading("Moving to trash...");
    const res = await deleteReview(id);
    if (res.success) {
      toast.success(res.message as string, { id: toastId });
      fetchData();
    } else toast.error(res.error as string, { id: toastId });
  };

  const handleRestore = async (id: string) => {
    const toastId = toast.loading("Restoring...");
    const res = await restoreReview(id);
    if (res.success) {
      toast.success(res.message as string, { id: toastId });
      fetchData();
    } else toast.error(res.error as string, { id: toastId });
  };

  const handleForceDelete = async (id: string) => {
    if (!confirm("You are about to permanently delete this review. This action cannot be undone.")) return;
    const toastId = toast.loading("Deleting permanently...");
    const res = await forceDeleteReview(id);
    if (res.success) {
      toast.success(res.message as string, { id: toastId });
      fetchData();
    } else toast.error(res.error as string, { id: toastId });
  };

  // --- ADVANCED INLINE ACTIONS (Reply) ---
  const handleReplySubmit = async (id: string, replyText: string) => {
    const toastId = toast.loading("Saving reply...");
    const res = await submitReply(id, replyText);
    if (res.success) {
      toast.success(res.message as string, { id: toastId });
      fetchData();
      return true; // Used to close the reply box on success
    } else {
      toast.error(res.error as string, { id: toastId });
      return false;
    }
  };

  // --- BULK ACTIONS ---
  const handleBulkAction = async (ids: string[], action: "approve" | "unapprove" | "spam" | "delete" | "restore" | "force_delete") => {
    if (action === "force_delete" && !confirm(`You are about to permanently delete ${ids.length} items. This action cannot be undone.`)) return false;

    const toastId = toast.loading(`Processing...`);

    let res: { success: boolean; message?: string; error?: string };

    if (action === "approve") res = await bulkUpdateReviewStatus(ids, "APPROVED");
    else if (action === "unapprove") res = await bulkUpdateReviewStatus(ids, "PENDING");
    else if (action === "spam") res = await bulkUpdateReviewStatus(ids, "SPAM");
    else if (action === "delete") res = await bulkUpdateReviewStatus(ids, "TRASH");
    else if (action === "restore") res = await bulkRestoreReviews(ids);
    else res = await bulkForceDeleteReviews(ids);

    if (res.success) {
      toast.success(res.message ?? `${ids.length} items processed.`, { id: toastId });
      fetchData();
    } else {
      toast.error(res.error ?? "Operation failed.", { id: toastId });
    }

    return res.success;
  };

  return (
    <div className="font-sans text-[#3c434a] max-w-full">
      
      <ReviewHeader 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <div className="mt-4">
        <ReviewList 
          reviews={reviews} 
          loading={loading} 
          handleStatusChange={handleStatusChange}
          handleDelete={handleDelete}
          handleRestore={handleRestore} 
          handleForceDelete={handleForceDelete} 
          handleBulkAction={handleBulkAction}
          handleReplySubmit={handleReplySubmit} 
          currentFilter={currentFilter} 
          setCurrentFilter={setCurrentFilter}
          counts={counts} 
          ratingFilter={ratingFilter}
          setRatingFilter={setRatingFilter}
          productSearch={productSearch}
          setProductSearch={setProductSearch}
          pagination={pagination}
          setCurrentPage={setCurrentPage}
        />
      </div>

    </div>
  );
}