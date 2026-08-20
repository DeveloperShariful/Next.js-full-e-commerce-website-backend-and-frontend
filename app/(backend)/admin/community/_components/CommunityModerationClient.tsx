"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  hidePostAdmin,
  unhidePostAdmin,
  deletePostAdmin,
  hideCommentAdmin,
  resolveReport,
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
}: {
  reports: ReportItem[];
  posts: PostItem[];
}) {
  const [tab, setTab] = useState<"reports" | "posts">(reports.length > 0 ? "reports" : "posts");
  const [reportList, setReportList] = useState(reports);
  const [postList, setPostList] = useState(posts);
  const [isPending, startTransition] = useTransition();

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

  return (
    <div>
      <div className="flex items-center gap-1 mb-4 border-b border-slate-200">
        <button
          onClick={() => setTab("reports")}
          className={`px-4 py-2.5 text-[13px] font-medium relative ${tab === "reports" ? "text-slate-900" : "text-slate-500 hover:text-slate-800"}`}
        >
          Reports {reportList.length > 0 && <span className="ml-1 bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full text-[11px]">{reportList.length}</span>}
          {tab === "reports" && <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-blue-600 rounded-full" />}
        </button>
        <button
          onClick={() => setTab("posts")}
          className={`px-4 py-2.5 text-[13px] font-medium relative ${tab === "posts" ? "text-slate-900" : "text-slate-500 hover:text-slate-800"}`}
        >
          All Posts
          {tab === "posts" && <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-blue-600 rounded-full" />}
        </button>
      </div>

      {tab === "reports" && (
        <div className="bg-white border border-[#c3c4c7] rounded-sm overflow-hidden">
          {reportList.length === 0 ? (
            <p className="text-center text-slate-500 py-12 text-sm">No pending reports 🎉</p>
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
                          <span className="text-[11px] uppercase text-slate-400 block mb-0.5">Post by {r.post.author.name}</span>
                          <span className="text-slate-700 line-clamp-2">{r.post.caption || "(media only)"}</span>
                        </>
                      ) : r.comment ? (
                        <>
                          <span className="text-[11px] uppercase text-slate-400 block mb-0.5">Comment by {r.comment.author.name}</span>
                          <span className="text-slate-700 line-clamp-2">{r.comment.content}</span>
                        </>
                      ) : (
                        <span className="text-slate-400">Content removed</span>
                      )}
                    </td>
                    <td className="px-3 py-3 align-top text-slate-600">{r.reporter.name}<br /><span className="text-[11px] text-slate-400">{r.reporter.email}</span></td>
                    <td className="px-3 py-3 align-top text-slate-600">{r.reason || "—"}</td>
                    <td className="px-3 py-3 align-top">
                      <div className="flex flex-col gap-1">
                        {r.post && (
                          <button disabled={isPending} onClick={() => { handleHidePost(r.post!.id, "PUBLISHED"); handleResolve(r.id, "REVIEWED"); }} className="text-red-600 hover:underline text-left">Hide post</button>
                        )}
                        {r.comment && (
                          <button disabled={isPending} onClick={() => handleHideComment(r.id, r.comment!.id)} className="text-red-600 hover:underline text-left">Hide comment</button>
                        )}
                        <button disabled={isPending} onClick={() => handleResolve(r.id, "DISMISSED")} className="text-slate-500 hover:underline text-left">Dismiss report</button>
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
        <div className="bg-white border border-[#c3c4c7] rounded-sm overflow-hidden">
          <table className="w-full text-[13px] text-left">
            <thead className="bg-[#f6f7f7] border-b border-[#c3c4c7]">
              <tr>
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
                <tr key={p.id}>
                  <td className="px-3 py-3 align-top text-slate-700">{p.author.name}</td>
                  <td className="px-3 py-3 align-top text-slate-600 max-w-[280px] truncate">{p.caption || "(media only)"}</td>
                  <td className="px-3 py-3 align-top">
                    <span className={`px-1.5 py-0.5 rounded-sm text-[11px] uppercase ${p.status === "HIDDEN" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{p.status}</span>
                  </td>
                  <td className="px-3 py-3 align-top text-slate-600">{p._count.reports}</td>
                  <td className="px-3 py-3 align-top text-slate-500">{new Date(p.createdAt).toLocaleDateString("en-AU")}</td>
                  <td className="px-3 py-3 align-top">
                    <div className="flex gap-2">
                      <button disabled={isPending} onClick={() => handleHidePost(p.id, p.status)} className="text-blue-600 hover:underline">
                        {p.status === "HIDDEN" ? "Unhide" : "Hide"}
                      </button>
                      <button disabled={isPending} onClick={() => handleDeletePost(p.id)} className="text-red-600 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
