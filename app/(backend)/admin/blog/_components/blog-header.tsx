"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

interface BlogCategory {
  id: string;
  name: string;
  color: string | null;
}

interface BlogHeaderProps {
  counts: Record<string, number>;
  categories: BlogCategory[];
}

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Draft" },
  { key: "scheduled", label: "Scheduled" },
  { key: "archived", label: "Archived" },
];

export function BlogHeader({ counts, categories }: BlogHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") || "all";
  const currentQuery = searchParams.get("query") || "";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[23px] font-normal text-[#1d2327] m-0 leading-tight">
          Blog Posts
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/blog/categories"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] bg-white border border-[#c3c4c7] text-[#2c3338] rounded hover:bg-gray-50 transition-colors"
          >
            Categories
          </Link>
          <Link
            href="/admin/blog/create"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] bg-[#2271b1] text-white rounded hover:bg-[#135e96] transition-colors font-medium"
          >
            + Add New Post
          </Link>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 flex-wrap mb-4">
        {STATUS_TABS.map((tab) => {
          const count = counts[tab.key] ?? 0;
          const isActive = currentStatus === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => updateParam("status", tab.key === "all" ? "" : tab.key)}
              className={`px-2.5 py-1 text-[13px] rounded transition-colors ${
                isActive
                  ? "bg-[#2271b1] text-white"
                  : "text-[#2271b1] hover:bg-white"
              }`}
            >
              {tab.label}
              <span className="ml-1 text-[11px] opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Search + Category Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="text"
          defaultValue={currentQuery}
          placeholder="Search posts..."
          onChange={(e) => {
            const val = e.target.value;
            const t = setTimeout(() => updateParam("query", val), 400);
            return () => clearTimeout(t);
          }}
          className="px-3 py-1.5 text-[13px] border border-[#c3c4c7] rounded bg-white focus:outline-none focus:border-[#2271b1] min-w-[200px]"
        />
        <select
          defaultValue={searchParams.get("category") || ""}
          onChange={(e) => updateParam("category", e.target.value)}
          className="px-3 py-1.5 text-[13px] border border-[#c3c4c7] rounded bg-white focus:outline-none focus:border-[#2271b1]"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
