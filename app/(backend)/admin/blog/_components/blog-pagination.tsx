"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface BlogPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export function BlogPagination({ currentPage, totalPages, totalItems }: BlogPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goTo = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <p className="text-[13px] text-[#646970]">
        {totalItems} post{totalItems !== 1 ? "s" : ""} total
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => goTo(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-3 py-1.5 text-[13px] border border-[#c3c4c7] rounded bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Prev
        </button>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          const page = i + 1;
          return (
            <button
              key={page}
              onClick={() => goTo(page)}
              className={`px-3 py-1.5 text-[13px] border rounded ${
                page === currentPage
                  ? "bg-[#2271b1] text-white border-[#2271b1]"
                  : "border-[#c3c4c7] bg-white hover:bg-gray-50"
              }`}
            >
              {page}
            </button>
          );
        })}
        <button
          onClick={() => goTo(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-3 py-1.5 text-[13px] border border-[#c3c4c7] rounded bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
