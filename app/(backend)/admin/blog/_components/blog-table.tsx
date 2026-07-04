"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { deleteBlogPost } from "@/app/actions/backend/blog/blog-actions";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  isFeatured: boolean;
  isPinned: boolean;
  viewCount: number;
  publishedAt: Date | null;
  createdAt: Date;
  category: { id: string; name: string; color: string | null } | null;
  author: { id: string; name: string | null; image: string | null } | null;
  tags: string[];
}

const STATUS_STYLES: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-700 border-green-200",
  DRAFT: "bg-gray-100 text-gray-600 border-gray-200",
  SCHEDULED: "bg-blue-100 text-blue-700 border-blue-200",
  ARCHIVED: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

export function BlogTable({ posts }: { posts: BlogPost[] }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const saveScroll = () => {
    sessionStorage.setItem("blog-scroll-y", String(window.scrollY));
    sessionStorage.setItem("blog-return-url", window.location.href);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    const res = await deleteBlogPost(id);
    setDeletingId(null);
    if (res.success) toast.success("Post deleted");
    else toast.error(res.error || "Failed to delete");
  };

  if (!posts.length) {
    return (
      <div className="bg-white rounded border border-[#c3c4c7] p-12 text-center">
        <p className="text-[#646970] text-[15px]">No posts found.</p>
        <Link
          href="/admin/blog/create"
          className="mt-4 inline-block px-4 py-2 bg-[#2271b1] text-white rounded text-[13px] hover:bg-[#135e96]"
        >
          Create your first post
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded border border-[#c3c4c7] overflow-hidden">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-[#c3c4c7] bg-[#f6f7f7]">
            <th className="text-left px-4 py-3 font-semibold text-[#1d2327]">Title</th>
            <th className="text-left px-4 py-3 font-semibold text-[#1d2327] hidden md:table-cell">Category</th>
            <th className="text-left px-4 py-3 font-semibold text-[#1d2327] hidden lg:table-cell">Author</th>
            <th className="text-left px-4 py-3 font-semibold text-[#1d2327]">Status</th>
            <th className="text-left px-4 py-3 font-semibold text-[#1d2327] hidden lg:table-cell">Views</th>
            <th className="text-left px-4 py-3 font-semibold text-[#1d2327] hidden xl:table-cell">Date</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0f0f1]">
          {posts.map((post) => (
            <tr key={post.id} className="hover:bg-[#f6f7f7] group">
              <td className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <div>
                    <Link
                      href={`/admin/blog/${post.id}/edit`}
                      onClick={saveScroll}
                      className="font-medium text-[#2271b1] hover:text-[#135e96] hover:underline line-clamp-2 leading-snug"
                    >
                      {post.isPinned && (
                        <span className="mr-1 text-[10px] bg-orange-100 text-orange-600 border border-orange-200 px-1 py-0.5 rounded font-semibold">
                          PINNED
                        </span>
                      )}
                      {post.isFeatured && (
                        <span className="mr-1 text-[10px] bg-purple-100 text-purple-600 border border-purple-200 px-1 py-0.5 rounded font-semibold">
                          FEATURED
                        </span>
                      )}
                      {post.title}
                    </Link>
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[10px] bg-[#f0f0f1] text-[#646970] px-1.5 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 hidden md:table-cell">
                {post.category ? (
                  <span
                    className="inline-flex items-center gap-1 text-[12px] px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: post.category.color ? `${post.category.color}15` : "#f0f0f1",
                      borderColor: post.category.color ?? "#c3c4c7",
                      color: post.category.color ?? "#646970",
                    }}
                  >
                    {post.category.name}
                  </span>
                ) : (
                  <span className="text-[#646970]">—</span>
                )}
              </td>
              <td className="px-4 py-3 hidden lg:table-cell text-[#646970]">
                {post.author?.name ?? "—"}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    STATUS_STYLES[post.status] ?? STATUS_STYLES.DRAFT
                  }`}
                >
                  {post.status}
                </span>
              </td>
              <td className="px-4 py-3 hidden lg:table-cell text-[#646970]">
                {post.viewCount.toLocaleString()}
              </td>
              <td className="px-4 py-3 hidden xl:table-cell text-[#646970]">
                {post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
                  : new Date(post.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 justify-end">
                  <Link
                    href={`/admin/blog/${post.id}/edit`}
                    onClick={saveScroll}
                    className="text-[#2271b1] hover:underline text-[12px]"
                  >
                    Edit
                  </Link>
                  {post.status === "PUBLISHED" && (
                    <Link
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      className="text-[#646970] hover:text-[#2271b1] text-[12px]"
                    >
                      View
                    </Link>
                  )}
                  <button
                    onClick={() => handleDelete(post.id, post.title)}
                    disabled={deletingId === post.id}
                    className="text-red-500 hover:text-red-700 text-[12px] disabled:opacity-50"
                  >
                    {deletingId === post.id ? "..." : "Delete"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
