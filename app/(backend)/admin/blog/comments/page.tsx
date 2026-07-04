import { getAllComments } from "@/app/actions/backend/blog/blog-comment-actions";
import { CommentsClient } from "./_components/comments-client";

interface PageProps {
  searchParams: Promise<{ filter?: string; page?: string }>;
}

export default async function BlogCommentsPage({ searchParams }: PageProps) {
  const { filter, page: pageParam } = await searchParams;
  const validFilter = ["all", "pending", "approved", "spam"].includes(filter ?? "")
    ? (filter as "all" | "pending" | "approved" | "spam")
    : "all";
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));

  const result = await getAllComments(validFilter, page);

  return (
    <div className="max-w-[100%] mx-auto min-h-screen bg-[#f0f0f1] text-[#3c434a] font-sans pb-20">
      <div className="mb-5">
        <h1 className="text-[23px] font-normal text-[#1d2327] m-0 leading-tight">Comments</h1>
      </div>
      <CommentsClient
        comments={result.data ?? []}
        counts={(result.counts ?? {}) as Record<string, number>}
        total={result.total ?? 0}
        pages={result.pages ?? 1}
        currentPage={page}
        currentFilter={validFilter}
      />
    </div>
  );
}
