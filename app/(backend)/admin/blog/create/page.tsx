import { getBlogCategories, getAdminUsersForBlog, getAllPostsForPicker } from "@/app/actions/backend/blog/blog-actions";
import { getStoreTimezone } from "@/lib/get-store-timezone";
import { BlogForm } from "../_components/blog-form";

export default async function CreateBlogPostPage() {
  const [{ data: categories }, { data: authors }, { data: allPosts }, tz] = await Promise.all([
    getBlogCategories(),
    getAdminUsersForBlog(),
    getAllPostsForPicker(),
    getStoreTimezone(),
  ]);
  return (
    <BlogForm
      categories={categories ?? []}
      authors={authors ?? []}
      allPosts={allPosts ?? []}
      storeTimezone={tz}
      isEdit={false}
    />
  );
}
