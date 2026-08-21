"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  hidePostAdmin,
  unhidePostAdmin,
  deletePostAdmin,
  hideCommentAdmin,
  resolveReport,
  bulkHidePostsAdmin,
  bulkUnhidePostsAdmin,
  bulkDeletePostsAdmin,
} from "@/app/actions/backend/community/community-moderation";

interface ReportItem {
  id: string;
  reason: string | null;
  createdAt: string | Date;
  reporter: { id: string; name: string | null; email: string };
  post: { id: string; caption: string | null; author: { id: string; name: string | null } } | null;
  comment: { id: string; content: string; author: { id: string; name: string | null } } | null;
}

interface PostItem {
  id: string;
  caption: string | null;
  status: string;
  createdAt: string | Date;
  author: { id: string; name: string | null; email: string };
  _count: { reports: number };
}

export default function CommunityModerationClient({
  reports,
  posts,
  total,
  pages,
  initialTab,
  initialQuery,
  initialStatus,
  initialSort,
  currentPage,
}: {
  reports: ReportItem[];
  posts: PostItem[];
  total: number;
  pages: number;
  initialTab?: "reports" | "posts";
  initialQuery: string;
  initialStatus: string;
  initialSort: string;
  currentPage: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<"reports" | "posts">(initialTab ?? (reports.length > 0 ? "reports" : "posts"));
  const [reportList, setReportList] = useState(reports);
  const [postList, setPostList] = useState(posts);
  const [queryInput, setQueryInput] = useState(initialQuery);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [isPending, startTransition] = useTransition();

  // Re-sync local state whenever the server sends fresh data (search/sort/filter/page
  // change triggers a navigation + refetch upstream) — useState's initial value only
  // applies on first mount, so without this the list would go stale after filtering.
  useEffect(() => { setReportList(reports); }, [reports]);
  useEffect(() => { setPostList(posts); setSelectedIds([]); }, [posts]);

  const updateFilters = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    if (!("page" in updates)) params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const switchTab = (next: "reports" | "posts") => {
    setTab(next);
    setSelectedIds([]);
    updateFilters({ tab: next, page: undefined });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ tab: "posts", q: queryInput.trim() || undefined });
  };

  const handleResolve = (reportId: string, status: "REVIEWED" | "DISMISSED") => {
    startTransition(async () => {
      const res = await resolveReport(reportId, status);
      if (res.success) setReportList(prev => prev.filter(r => r.id !== reportId));
      else toast.error(res.message || "Failed.");
    });
  };

  const handleHidePost = (postId: string, currentStatus: string) => {
    startTransition(async () => {
      const res = currentStatus === "HIDDEN" ? await unhidePostAdmin(postId) : await hidePostAdmin(postId);
      if (res.success) {
        setPostList(prev => prev.map(p => p.id === postId ? { ...p, status: currentStatus === "HIDDEN" ? "PUBLISHED" : "HIDDEN" } : p));
        toast.success("Updated.");
      } else toast.error(res.message || "Failed.");
    });
  };

  const handleDeletePost = (postId: string) => {
    if (!confirm("Permanently delete this post?")) return;
    startTransition(async () => {
      const res = await deletePostAdmin(postId);
      if (res.success) {
        setPostList(prev => prev.filter(p => p.id !== postId));
        toast.success("Deleted.");
      } else toast.error(res.message || "Failed.");
    });
  };

  const handleHideComment = (reportId: string, commentId: string) => {
    startTransition(async () => {
      const res = await hideCommentAdmin(commentId);
      if (res.success) {
        setReportList(prev => prev.filter(r => r.id !== reportId));
        toast.success("Comment hidden.");
      } else toast.error(res.message || "Failed.");
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleSelectAll = () => {
    setSelectedIds(prev => prev.length === postList.length ? [] : postList.map(p => p.id));
  };

  const handleApplyBulkAction = () => {
    if (!bulkAction || selectedIds.length === 0) return;
    if (bulkAction === "delete" && !confirm(`Permanently delete ${selectedIds.length} post(s)?`)) return;

    startTransition(async () => {
      const ids = selectedIds;
      const res =
        bulkAction === "hide" ? await bulkHidePostsAdmin(ids)
        : bulkAction === "unhide" ? await bulkUnhidePostsAdmin(ids)
        : await bulkDeletePostsAdmin(ids);

      if (res.success) {
        if (bulkAction === "delete") setPostList(prev => prev.filter(p => !ids.includes(p.id)));
        else setPostList(prev => prev.map(p => ids.includes(p.id) ? { ...p, status: bulkAction === "hide" ? "HIDDEN" : "PUBLISHED" } : p));
        setSelectedIds([]);
        setBulkAction("");
        toast.success("Bulk action applied.");
      } else toast.error(res.message || "Bulk action failed.");
    });
  };

  const btnClass = "px-2 py-1 border border-[#c3c4c7] rounded bg-[#f6f7f7] text-[13px]";

  return (
    <div>
      <div className="flex items-center gap-1 mb-4 border-b border-[#c3c4c7]">
        <button
          onClick={() => switchTab("reports")}
          className={`px-4 py-2.5 text-[13px] font-medium relative ${tab === "reports" ? "text-[#1d2327]" : "text-[#646970] hover:text-[#1d2327]"}`}
        >
          Reports {reportList.length > 0 && <span className="ml-1 bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full text-[11px]">{reportList.length}</span>}
          {tab === "reports" && <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-[#2271b1] rounded-full" />}
        </button>
        <button
          onClick={() => switchTab("posts")}
          className={`px-4 py-2.5 text-[13px] font-medium relative ${tab === "posts" ? "text-[#1d2327]" : "text-[#646970] hover:text-[#1d2327]"}`}
        >
          All Posts
          {tab === "posts" && <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-[#2271b1] rounded-full" />}
        </button>
      </div>

      {tab === "reports" && (
        <div className="bg-white border border-[#c3c4c7] rounded-sm overflow-hidden">
          {reportList.length === 0 ? (
            <p className="text-center text-[#646970] py-12 text-sm">No pending reports 🎉</p>
          ) : (
            <table className="w-full text-[13px] text-left">
              <thead className="bg-[#f6f7f7] border-b border-[#c3c4c7]">
                <tr>
                  <th className="px-3 py-2 font-medium">Content</th>
                  <th className="px-3 py-2 font-medium">Reported by</th>
                  <th className="px-3 py-2 font-medium">Reason</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f1]">
                {reportList.map(r => (
                  <tr key={r.id}>
                    <td className="px-3 py-3 align-top max-w-[300px]">
                      {r.post ? (
                        <>
                          <span className="text-[11px] uppercase text-[#8c8f94] block mb-0.5">Post by {r.post.author.name}</span>
                          <span className="text-[#3c434a] line-clamp-2">{r.post.caption || "(media only)"}</span>
                        </>
                      ) : r.comment ? (
                        <>
                          <span className="text-[11px] uppercase text-[#8c8f94] block mb-0.5">Comment by {r.comment.author.name}</span>
                          <span className="text-[#3c434a] line-clamp-2">{r.comment.content}</span>
                        </>
                      ) : (
                        <span className="text-[#8c8f94]">Content removed</span>
                      )}
                    </td>
                    <td className="px-3 py-3 align-top text-[#646970]">{r.reporter.name}<br /><span className="text-[11px] text-[#8c8f94]">{r.reporter.email}</span></td>
                    <td className="px-3 py-3 align-top text-[#646970]">{r.reason || "—"}</td>
                    <td className="px-3 py-3 align-top">
                      <div className="flex flex-col gap-1">
                        {r.post && (
                          <button disabled={isPending} onClick={() => { handleHidePost(r.post!.id, "PUBLISHED"); handleResolve(r.id, "REVIEWED"); }} className="text-red-600 hover:underline text-left">Hide post</button>
                        )}
                        {r.comment && (
                          <button disabled={isPending} onClick={() => handleHideComment(r.id, r.comment!.id)} className="text-red-600 hover:underline text-left">Hide comment</button>
                        )}
                        <button disabled={isPending} onClick={() => handleResolve(r.id, "DISMISSED")} className="text-[#646970] hover:underline text-left">Dismiss report</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "posts" && (
        <div className={isPending ? "opacity-60 pointer-events-none" : ""}>
          {/* Search + filters */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-1">
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Search caption or author..."
                className="border border-[#8c8f94] bg-white h-[30px] px-2 text-[13px] text-[#32373c] focus:border-[#2271b1] outline-none shadow-sm rounded-sm w-[220px]"
              />
              <button type="submit" className="border border-[#8c8f94] bg-[#f6f7f7] hover:bg-[#f0f0f1] h-[30px] px-3 text-[13px] rounded-sm shadow-sm">Search</button>
            </form>

            <select
              value={initialStatus}
              onChange={(e) => updateFilters({ tab: "posts", status: e.target.value === "ALL" ? undefined : e.target.value })}
              className="border border-[#8c8f94] bg-white h-[30px] px-2 text-[13px] text-[#32373c] focus:border-[#2271b1] outline-none shadow-sm rounded-sm"
            >
              <option value="ALL">All statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="HIDDEN">Hidden</option>
            </select>

            <select
              value={initialSort}
              onChange={(e) => updateFilters({ tab: "posts", sort: e.target.value === "newest" ? undefined : e.target.value })}
              className="border border-[#8c8f94] bg-white h-[30px] px-2 text-[13px] text-[#32373c] focus:border-[#2271b1] outline-none shadow-sm rounded-sm"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="most_reported">Most reported</option>
            </select>

            <span className="text-[13px] text-[#646970] ml-auto">{total} post{total === 1 ? "" : "s"}</span>
          </div>

          {/* Bulk actions */}
          <div className="flex items-center gap-1 mb-2">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              disabled={isPending}
              className="border border-[#8c8f94] bg-white h-[30px] px-2 text-[13px] text-[#32373c] focus:border-[#2271b1] outline-none shadow-sm min-w-[150px] disabled:bg-gray-100 rounded-sm"
            >
              <option value="">Bulk actions</option>
              <option value="hide">Hide selected</option>
              <option value="unhide">Unhide selected</option>
              <option value="delete">Delete selected</option>
            </select>
            <button
              onClick={handleApplyBulkAction}
              disabled={isPending || !bulkAction || selectedIds.length === 0}
              className="border border-[#2271b1] bg-[#f6f7f7] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] h-[30px] px-3 text-[13px] rounded-[3px] font-medium transition-colors shadow-sm disabled:opacity-50 disabled:border-[#8c8f94] disabled:text-[#8c8f94] flex items-center gap-1"
            >
              {isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Applying...</> : "Apply"}
            </button>
            {selectedIds.length > 0 && <span className="text-[13px] text-[#646970]">{selectedIds.length} selected</span>}
          </div>

          <div className="bg-white border border-[#c3c4c7] rounded-sm overflow-hidden">
            {postList.length === 0 ? (
              <p className="text-center text-[#646970] py-12 text-sm">No posts match these filters.</p>
            ) : (
              <table className="w-full text-[13px] text-left">
                <thead className="bg-[#f6f7f7] border-b border-[#c3c4c7]">
                  <tr>
                    <th className="px-3 py-2 w-8">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === postList.length && postList.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-3 py-2 font-medium">Author</th>
                    <th className="px-3 py-2 font-medium">Caption</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Reports</th>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0f1]">
                  {postList.map(p => (
                    <tr key={p.id} className={selectedIds.includes(p.id) ? "bg-[#fff8e5]" : ""}>
                      <td className="px-3 py-3 align-top">
                        <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} />
                      </td>
                      <td className="px-3 py-3 align-top text-[#3c434a]">{p.author.name}</td>
                      <td className="px-3 py-3 align-top text-[#646970] max-w-[280px] truncate">{p.caption || "(media only)"}</td>
                      <td className="px-3 py-3 align-top">
                        <span className={`px-1.5 py-0.5 rounded-sm text-[11px] uppercase ${p.status === "HIDDEN" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{p.status}</span>
                      </td>
                      <td className="px-3 py-3 align-top text-[#646970]">{p._count.reports}</td>
                      <td className="px-3 py-3 align-top text-[#8c8f94]">{new Date(p.createdAt).toLocaleDateString("en-AU")}</td>
                      <td className="px-3 py-3 align-top">
                        <div className="flex gap-2">
                          <button disabled={isPending} onClick={() => handleHidePost(p.id, p.status)} className="text-[#2271b1] hover:underline">
                            {p.status === "HIDDEN" ? "Unhide" : "Hide"}
                          </button>
                          <button disabled={isPending} onClick={() => handleDeletePost(p.id)} className="text-red-600 hover:underline">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex justify-end items-center py-3 text-[13px] text-[#50575e]">
              <div className="flex items-center gap-1">
                <button className={btnClass} disabled={currentPage <= 1} onClick={() => updateFilters({ tab: "posts", page: "1" })}>«</button>
                <button className={btnClass} disabled={currentPage <= 1} onClick={() => updateFilters({ tab: "posts", page: String(currentPage - 1) })}>‹</button>
                <span className="mx-2">Page {currentPage} of {pages}</span>
                <button className={btnClass} disabled={currentPage >= pages} onClick={() => updateFilters({ tab: "posts", page: String(currentPage + 1) })}>›</button>
                <button className={btnClass} disabled={currentPage >= pages} onClick={() => updateFilters({ tab: "posts", page: String(pages) })}>»</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
