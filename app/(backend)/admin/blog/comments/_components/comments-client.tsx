"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { approveComment, rejectComment, markAsSpam, deleteComment } from "@/app/actions/backend/blog/blog-comment-actions";

interface Comment {
  id: string;
  authorName: string;
  authorEmail: string;
  content: string;
  isApproved: boolean;
  isSpam: boolean;
  createdAt: Date;
  parentId: string | null;
  post: { id: string; title: string; slug: string } | null;
}

interface Props {
  comments: Comment[];
  counts: Record<string, number>;
  total: number;
  pages: number;
  currentPage: number;
  currentFilter: string;
}

const FILTERS = [
  { key: "all",      label: "All" },
  { key: "pending",  label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "spam",     label: "Spam" },
];

export function CommentsClient({ comments, counts, total, pages, currentPage, currentFilter }: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const act = async (fn: () => Promise<{ success: boolean; error?: string }>, id: string, successMsg: string) => {
    setLoadingId(id);
    const res = await fn();
    setLoadingId(null);
    if (res.success) {
      toast.success(successMsg);
      router.refresh();
    } else {
      toast.error(res.error ?? "Failed");
    }
  };

  const statusBadge = (c: Comment) => {
    if (c.isSpam) return <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">Spam</span>;
    if (c.isApproved) return <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">Approved</span>;
    return <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded bg-yellow-50 text-yellow-700 border border-yellow-200">Pending</span>;
  };

  return (
    <div className="w-full">

      {/* Top bar: filter tabs + count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        {/* Filter tabs */}
        <div className="flex flex-wrap gap-x-0 border border-[#c3c4c7] rounded bg-white overflow-hidden w-fit">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={`/admin/blog/comments?filter=${f.key}&page=1`}
              className={`flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium border-r border-[#c3c4c7] last:border-r-0 transition-colors whitespace-nowrap ${
                currentFilter === f.key
                  ? "bg-[#2271b1] text-white"
                  : "text-[#646970] hover:text-[#2271b1] hover:bg-[#f6f7f7]"
              }`}
            >
              {f.label}
              {counts[f.key] !== undefined && (
                <span className={`text-[11px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 font-bold ${
                  currentFilter === f.key
                    ? "bg-white/25 text-white"
                    : "bg-[#e0e0e0] text-[#646970]"
                }`}>
                  {counts[f.key]}
                </span>
              )}
            </Link>
          ))}
        </div>
        {total > 0 && (
          <p className="text-[13px] text-[#646970]">
            {total} comment{total !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Empty state */}
      {comments.length === 0 ? (
        <div className="bg-white border border-[#c3c4c7] rounded p-16 text-center">
          <p className="text-[#646970] text-[14px]">No comments found.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#c3c4c7] rounded overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-[13px] border-collapse table-fixed">
              <thead>
                <tr className="bg-[#f6f7f7] border-b border-[#c3c4c7]">
                  <th className="text-left px-4 py-3 font-semibold text-[#1d2327] w-[22%] lg:w-[18%]">Author</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#1d2327] w-[48%] lg:w-[36%]">Comment</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#1d2327] hidden lg:table-cell lg:w-[24%]">In Response To</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#1d2327] w-[17%] lg:w-[13%]">Submitted</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#1d2327] w-[13%] lg:w-[9%]">Status</th>
                </tr>
              </thead>
              <tbody>
                {comments.map((comment, i) => (
                  <tr
                    key={comment.id}
                    className={`border-b border-[#f0f0f1] hover:bg-[#f6f7f7] group align-top ${
                      comment.isSpam ? "opacity-60" : ""
                    } ${!comment.isApproved && !comment.isSpam ? "bg-[#fffbf0]" : ""}`}
                  >
                    {/* Author */}
                    <td className="px-4 py-3 overflow-hidden">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#2271b1] flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 mt-0.5">
                          {comment.authorName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1d2327] truncate">{comment.authorName}</p>
                          <p className="text-[11px] text-[#646970] truncate">{comment.authorEmail}</p>
                          {comment.parentId && (
                            <span className="text-[10px] text-[#2271b1] font-medium">↳ Reply</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Comment + row actions */}
                    <td className="px-4 py-3 overflow-hidden">
                      <p className="text-[#3c434a] leading-snug line-clamp-3 mb-2 break-words">{comment.content}</p>
                      {/* WP-style row actions */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
                        {!comment.isApproved && !comment.isSpam && (
                          <>
                            <button
                              onClick={() => act(() => approveComment(comment.id), comment.id, "Comment approved")}
                              disabled={loadingId === comment.id}
                              className="text-[#2271b1] hover:text-[#135e96] font-medium disabled:opacity-40 hover:underline"
                            >
                              Approve
                            </button>
                            <span className="text-[#c3c4c7]">|</span>
                          </>
                        )}
                        {comment.isApproved && (
                          <>
                            <button
                              onClick={() => act(() => rejectComment(comment.id), comment.id, "Comment unapproved")}
                              disabled={loadingId === comment.id}
                              className="text-[#646970] hover:text-[#1d2327] disabled:opacity-40 hover:underline"
                            >
                              Unapprove
                            </button>
                            <span className="text-[#c3c4c7]">|</span>
                          </>
                        )}
                        {!comment.isSpam && (
                          <>
                            <button
                              onClick={() => act(() => markAsSpam(comment.id), comment.id, "Marked as spam")}
                              disabled={loadingId === comment.id}
                              className="text-[#646970] hover:text-[#1d2327] disabled:opacity-40 hover:underline"
                            >
                              Spam
                            </button>
                            <span className="text-[#c3c4c7]">|</span>
                          </>
                        )}
                        <button
                          onClick={() => {
                            if (!confirm("Delete this comment permanently?")) return;
                            act(() => deleteComment(comment.id), comment.id, "Comment deleted");
                          }}
                          disabled={loadingId === comment.id}
                          className="text-red-500 hover:text-red-700 disabled:opacity-40 hover:underline"
                        >
                          {loadingId === comment.id ? "..." : "Trash"}
                        </button>
                      </div>
                    </td>

                    {/* Post */}
                    <td className="px-4 py-3 hidden lg:table-cell overflow-hidden">
                      {comment.post ? (
                        <Link
                          href={`/admin/blog/${comment.post.id}/edit`}
                          className="text-[#2271b1] hover:underline text-[13px] leading-snug line-clamp-2"
                        >
                          {comment.post.title}
                        </Link>
                      ) : (
                        <span className="text-[#646970]">—</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-[#646970] whitespace-nowrap">
                      {new Date(comment.createdAt).toLocaleDateString("en-AU", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {statusBadge(comment)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-[#f0f0f1]">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={`p-4 ${comment.isSpam ? "opacity-60" : ""} ${
                  !comment.isApproved && !comment.isSpam ? "bg-[#fffbf0]" : ""
                }`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#2271b1] flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                      {comment.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[13px] text-[#1d2327] truncate">{comment.authorName}</p>
                      <p className="text-[11px] text-[#646970] truncate">{comment.authorEmail}</p>
                    </div>
                  </div>
                  {statusBadge(comment)}
                </div>

                {/* Comment text */}
                <p className="text-[13px] text-[#3c434a] leading-snug mb-2 line-clamp-4">{comment.content}</p>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#646970] mb-3">
                  {comment.parentId && <span className="text-[#2271b1]">↳ Reply</span>}
                  {comment.post && (
                    <Link href={`/admin/blog/${comment.post.id}/edit`} className="text-[#2271b1] hover:underline truncate max-w-[200px]">
                      {comment.post.title}
                    </Link>
                  )}
                  <span>
                    {new Date(comment.createdAt).toLocaleDateString("en-AU", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {!comment.isApproved && !comment.isSpam && (
                    <button
                      onClick={() => act(() => approveComment(comment.id), comment.id, "Comment approved")}
                      disabled={loadingId === comment.id}
                      className="px-3 py-1.5 text-[12px] font-semibold bg-[#2271b1] text-white rounded hover:bg-[#135e96] disabled:opacity-50"
                    >
                      Approve
                    </button>
                  )}
                  {comment.isApproved && (
                    <button
                      onClick={() => act(() => rejectComment(comment.id), comment.id, "Comment unapproved")}
                      disabled={loadingId === comment.id}
                      className="px-3 py-1.5 text-[12px] bg-white text-[#646970] border border-[#c3c4c7] rounded hover:border-[#2271b1] disabled:opacity-50"
                    >
                      Unapprove
                    </button>
                  )}
                  {!comment.isSpam && (
                    <button
                      onClick={() => act(() => markAsSpam(comment.id), comment.id, "Marked as spam")}
                      disabled={loadingId === comment.id}
                      className="px-3 py-1.5 text-[12px] bg-white text-[#646970] border border-[#c3c4c7] rounded hover:border-yellow-400 disabled:opacity-50"
                    >
                      Spam
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (!confirm("Delete this comment permanently?")) return;
                      act(() => deleteComment(comment.id), comment.id, "Comment deleted");
                    }}
                    disabled={loadingId === comment.id}
                    className="px-3 py-1.5 text-[12px] bg-white text-red-500 border border-[#c3c4c7] rounded hover:border-red-400 disabled:opacity-50"
                  >
                    {loadingId === comment.id ? "..." : "Trash"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex flex-wrap justify-center gap-1.5 mt-6">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/blog/comments?filter=${currentFilter}&page=${p}`}
              className={`min-w-[34px] h-[34px] flex items-center justify-center px-2 rounded border text-[13px] font-medium transition-colors ${
                p === currentPage
                  ? "bg-[#2271b1] text-white border-[#2271b1]"
                  : "bg-white text-[#646970] border-[#c3c4c7] hover:border-[#2271b1] hover:text-[#2271b1]"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
