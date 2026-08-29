import { notFound } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import {
  getBlogPost,
  getBlogCategories,
  getAdminUsersForBlog,
  getAllPostsForPicker,
} from "@/app/actions/backend/blog/blog-actions";
import { getStoreTimezone } from "@/lib/get-store-timezone";
import { BlogForm } from "../../_components/blog-form";

interface EditBlogPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBlogPostPage({ params }: EditBlogPostPageProps) {
  const { id } = await params;

  const [postResult, categoriesResult, authorsResult, postsResult, tz] = await Promise.all([
    getBlogPost(id),
    getBlogCategories(),
    getAdminUsersForBlog(),
    getAllPostsForPicker(),
    getStoreTimezone(),
  ]);

  if (!postResult.success || !postResult.data) notFound();

  const post = postResult.data;
  const categories = categoriesResult.data ?? [];
  const authors = authorsResult.data ?? [];
  // Exclude current post from the related posts picker
  const allPosts = (postsResult.data ?? []).filter((p) => p.id !== id);

  return (
    <BlogForm
      categories={categories}
      authors={authors}
      allPosts={allPosts}
      storeTimezone={tz}
      isEdit
      initialData={{
        id: post.id,
        slug: post.slug,
        title: post.title,
        content: post.content,
        excerpt: post.excerpt ?? "",
        featuredImage: post.featuredImage ?? "",
        featuredImageAlt: post.featuredImageAlt ?? "",
        videoUrl: post.videoUrl ?? "",
        videoThumbnail: post.videoThumbnail ?? "",
        categoryId: post.categoryId ?? "",
        authorId: post.authorId ?? "",
        tags: post.tags,
        status: post.status,
        isFeatured: post.isFeatured,
        isPinned: post.isPinned,
        readTimeMinutes: post.readTimeMinutes ?? undefined,
        // Basic SEO
        metaTitle: post.metaTitle ?? "",
        metaDesc: post.metaDesc ?? "",
        ogImage: post.ogImage ?? "",
        canonicalUrl: post.canonicalUrl ?? "",
        noIndex: post.noIndex,
        // Advanced SEO — previously not passed, now fixed
        robots: post.robots ?? "",
        focusKeyword: post.focusKeyword ?? "",
        ogTitle: post.ogTitle ?? "",
        ogDescription: post.ogDescription ?? "",
        twitterTitle: post.twitterTitle ?? "",
        twitterDescription: post.twitterDescription ?? "",
        twitterCard: post.twitterCard ?? "summary_large_image",
        schemaType: post.schemaType ?? "BlogPosting",
        // Dates — convert UTC → store timezone for datetime-local input
        publishedAt: post.publishedAt
          ? formatInTimeZone(new Date(post.publishedAt), tz, "yyyy-MM-dd'T'HH:mm")
          : "",
        scheduledAt: post.scheduledAt
          ? formatInTimeZone(new Date(post.scheduledAt), tz, "yyyy-MM-dd'T'HH:mm")
          : undefined,
        // Extras
        relatedPostIds: post.relatedPostIds,
        keyTakeaways: post.keyTakeaways ?? [],
        faqs: (post.faqs as { question: string; answer: string }[] | null) ?? [],
        authorBio: post.authorBio ?? "",
        // UI only
        viewCount: post.viewCount,
        author: post.author,
      }}
    />
  );
}
