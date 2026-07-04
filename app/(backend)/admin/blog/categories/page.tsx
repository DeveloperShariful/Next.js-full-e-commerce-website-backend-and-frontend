import { getBlogCategories } from "@/app/actions/backend/blog/blog-actions";
import { BlogCategoriesClient } from "./_components/blog-categories-client";

export default async function BlogCategoriesPage() {
  const { data: categories } = await getBlogCategories();
  return <BlogCategoriesClient categories={categories ?? []} />;
}
