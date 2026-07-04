import { getBlogPosts, getBlogCategories } from "@/app/actions/backend/blog/blog-actions";
import { ScrollRestorer } from "@/app/(backend)/admin/_components/back-button";
import { BlogHeader } from "./_components/blog-header";
import { BlogTable } from "./_components/blog-table";
import { BlogPagination } from "./_components/blog-pagination";

interface BlogPageProps {
  searchParams: Promise<{
    page?: string;
    query?: string;
    status?: string;
    category?: string;
    limit?: string;
  }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 20;
  const query = params.query || "";
  const status = params.status || "all";
  const categoryId = params.category || "";

  const [postsResult, categoriesResult] = await Promise.all([
    getBlogPosts(page, limit, query, status, categoryId),
    getBlogCategories(),
  ]);

  const posts = postsResult.data ?? [];
  const meta = postsResult.meta ?? { total: 0, pages: 1, counts: {} };
  const categories = categoriesResult.data ?? [];

  return (
    <div className="max-w-[100%] mx-auto min-h-screen bg-[#f0f0f1] text-[#3c434a] font-sans pb-20">
      <ScrollRestorer scrollKey="blog-scroll-y" />
      <BlogHeader counts={meta.counts} categories={categories} />
      <BlogTable posts={posts} />
      <BlogPagination
        currentPage={page}
        totalPages={meta.pages}
        totalItems={meta.total}
      />
    </div>
  );
}
