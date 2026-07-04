"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { BlogPostStatus } from "@prisma/client";

// ==========================================
// AUTH HELPER
// ==========================================

async function getAdminUser() {
  const session = await auth();
  if (!session?.user?.email) return null;
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });
  if (!user) return null;
  const allowed = ["SUPER_ADMIN", "ADMIN", "MANAGER", "EDITOR"] as const;
  if (!(allowed as readonly string[]).includes(user.role)) return null;
  return user;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ==========================================
// AUTHOR LIST FOR BLOG
// ==========================================

export async function getAdminUsersForBlog() {
  try {
    const users = await db.user.findMany({
      where: {
        role: { in: ["SUPER_ADMIN", "ADMIN", "MANAGER", "EDITOR"] },
        isActive: true,
      },
      select: { id: true, name: true, image: true, email: true, role: true },
      orderBy: { name: "asc" },
    });
    return { success: true, data: users };
  } catch {
    return { success: false, data: [] };
  }
}

// ==========================================
// BLOG CATEGORY ACTIONS
// ==========================================

export async function getBlogCategories() {
  try {
    const categories = await db.blogCategory.findMany({
      orderBy: [{ menuOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { posts: true } } },
    });
    return { success: true, data: categories };
  } catch {
    return { success: false, error: "Failed to fetch categories" };
  }
}

export async function createBlogCategory(formData: {
  name: string;
  description?: string;
  image?: string;
  color?: string;
  isActive?: boolean;
  menuOrder?: number;
  metaTitle?: string;
  metaDesc?: string;
}) {
  const user = await getAdminUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    let slug = generateSlug(formData.name);
    const existing = await db.blogCategory.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const category = await db.blogCategory.create({
      data: {
        name: formData.name,
        slug,
        description: formData.description || null,
        image: formData.image || null,
        color: formData.color || null,
        isActive: formData.isActive ?? true,
        menuOrder: formData.menuOrder ?? 0,
        metaTitle: formData.metaTitle || null,
        metaDesc: formData.metaDesc || null,
      },
    });
    revalidatePath("/admin/blog/categories");
    return { success: true, data: category };
  } catch {
    return { success: false, error: "Failed to create category" };
  }
}

export async function updateBlogCategory(
  id: string,
  formData: {
    name: string;
    description?: string;
    image?: string;
    color?: string;
    isActive?: boolean;
    menuOrder?: number;
    metaTitle?: string;
    metaDesc?: string;
  }
) {
  const user = await getAdminUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const category = await db.blogCategory.update({
      where: { id },
      data: {
        name: formData.name,
        description: formData.description || null,
        image: formData.image || null,
        color: formData.color || null,
        isActive: formData.isActive ?? true,
        menuOrder: formData.menuOrder ?? 0,
        metaTitle: formData.metaTitle || null,
        metaDesc: formData.metaDesc || null,
      },
    });
    revalidatePath("/admin/blog/categories");
    return { success: true, data: category };
  } catch {
    return { success: false, error: "Failed to update category" };
  }
}

export async function deleteBlogCategory(id: string) {
  const user = await getAdminUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    await db.blogCategory.delete({ where: { id } });
    revalidatePath("/admin/blog/categories");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete category" };
  }
}

// ==========================================
// BLOG POST ACTIONS
// ==========================================

export async function getBlogPosts(
  page = 1,
  limit = 20,
  query = "",
  status = "all",
  categoryId = ""
) {
  try {
    const where: Record<string, unknown> = {};

    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { excerpt: { contains: query, mode: "insensitive" } },
      ];
    }

    if (status !== "all") {
      where.status = status.toUpperCase() as BlogPostStatus;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [posts, total] = await Promise.all([
      db.blogPost.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        include: {
          category: { select: { id: true, name: true, color: true } },
          author: { select: { id: true, name: true, image: true } },
        },
      }),
      db.blogPost.count({ where }),
    ]);

    const counts = await db.blogPost.groupBy({
      by: ["status"],
      _count: { _all: true },
    });

    const statusCounts = {
      all: total,
      published: 0,
      draft: 0,
      scheduled: 0,
      archived: 0,
    } as Record<string, number>;

    for (const c of counts) {
      statusCounts[c.status.toLowerCase()] = c._count._all;
    }
    statusCounts.all = await db.blogPost.count();

    return {
      success: true,
      data: posts,
      meta: { total, pages: Math.ceil(total / limit), counts: statusCounts },
    };
  } catch {
    return { success: false, data: [], meta: { total: 0, pages: 1, counts: {} } };
  }
}

export async function getBlogPost(id: string) {
  try {
    const post = await db.blogPost.findUnique({
      where: { id },
      include: {
        category: true,
        author: { select: { id: true, name: true, image: true } },
      },
    });
    if (!post) return { success: false, error: "Post not found" };
    return { success: true, data: post };
  } catch {
    return { success: false, error: "Failed to fetch post" };
  }
}

export type BlogPostFormData = {
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  videoUrl?: string;
  videoThumbnail?: string;
  categoryId?: string;
  authorId?: string;
  tags?: string[];
  keyTakeaways?: string[];
  authorBio?: string;
  status?: BlogPostStatus;
  publishedAt?: string;
  scheduledAt?: string;
  isFeatured?: boolean;
  isPinned?: boolean;
  readTimeMinutes?: number;
  metaTitle?: string;
  metaDesc?: string;
  ogImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  robots?: string;
  focusKeyword?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterCard?: string;
  schemaType?: string;
  tableOfContents?: unknown[];
  relatedPostIds?: string[];
};

export async function createBlogPost(formData: BlogPostFormData) {
  const user = await getAdminUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    let slug = formData.slug?.trim() ? formData.slug.trim() : generateSlug(formData.title);
    const existing = await db.blogPost.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const status = formData.status ?? "DRAFT";
    const publishedAt =
      status === "PUBLISHED"
        ? formData.publishedAt
          ? new Date(formData.publishedAt)
          : new Date()
        : formData.publishedAt
        ? new Date(formData.publishedAt)
        : null;

    const post = await db.blogPost.create({
      data: {
        title: formData.title,
        slug,
        content: formData.content,
        excerpt: formData.excerpt || null,
        featuredImage: formData.featuredImage || null,
        featuredImageAlt: formData.featuredImageAlt || null,
        videoUrl: formData.videoUrl || null,
        videoThumbnail: formData.videoThumbnail || null,
        categoryId: formData.categoryId || null,
        tags: formData.tags ?? [],
        authorId: formData.authorId || user.id,
        status,
        publishedAt,
        scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt) : null,
        isFeatured: formData.isFeatured ?? false,
        isPinned: formData.isPinned ?? false,
        readTimeMinutes: formData.readTimeMinutes ?? null,
        metaTitle: formData.metaTitle || null,
        metaDesc: formData.metaDesc || null,
        ogImage: formData.ogImage || null,
        canonicalUrl: formData.canonicalUrl || null,
        noIndex: formData.noIndex ?? false,
        robots: formData.robots || null,
        focusKeyword: formData.focusKeyword || null,
        ogTitle: formData.ogTitle || null,
        ogDescription: formData.ogDescription || null,
        twitterTitle: formData.twitterTitle || null,
        twitterDescription: formData.twitterDescription || null,
        twitterCard: formData.twitterCard || "summary_large_image",
        schemaType: formData.schemaType || "BlogPosting",
        tableOfContents: (formData.tableOfContents as object[]) ?? [],
        relatedPostIds: formData.relatedPostIds ?? [],
        keyTakeaways: formData.keyTakeaways ?? [],
        authorBio: formData.authorBio || null,
      },
    });

    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    return { success: true, data: post };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Failed to create post" };
  }
}

export async function updateBlogPost(id: string, formData: BlogPostFormData) {
  const user = await getAdminUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const status = formData.status ?? "DRAFT";
    const existing = await db.blogPost.findUnique({ where: { id }, select: { publishedAt: true, status: true, slug: true } });

    let newSlug: string | undefined;
    if (formData.slug?.trim() && formData.slug.trim() !== existing?.slug) {
      const taken = await db.blogPost.findUnique({ where: { slug: formData.slug.trim() } });
      if (taken) return { success: false, error: "This slug is already in use by another post" };
      newSlug = formData.slug.trim();
    }

    let publishedAt = existing?.publishedAt ?? null;
    if (status === "PUBLISHED" && !publishedAt) {
      publishedAt = new Date();
    } else if (formData.publishedAt) {
      publishedAt = new Date(formData.publishedAt);
    }

    const post = await db.blogPost.update({
      where: { id },
      data: {
        title: formData.title,
        ...(newSlug ? { slug: newSlug } : {}),
        content: formData.content,
        excerpt: formData.excerpt || null,
        featuredImage: formData.featuredImage || null,
        featuredImageAlt: formData.featuredImageAlt || null,
        videoUrl: formData.videoUrl || null,
        videoThumbnail: formData.videoThumbnail || null,
        categoryId: formData.categoryId || null,
        authorId: formData.authorId || user.id,
        tags: formData.tags ?? [],
        status,
        publishedAt,
        scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt) : null,
        isFeatured: formData.isFeatured ?? false,
        isPinned: formData.isPinned ?? false,
        readTimeMinutes: formData.readTimeMinutes ?? null,
        metaTitle: formData.metaTitle || null,
        metaDesc: formData.metaDesc || null,
        ogImage: formData.ogImage || null,
        canonicalUrl: formData.canonicalUrl || null,
        noIndex: formData.noIndex ?? false,
        robots: formData.robots || null,
        focusKeyword: formData.focusKeyword || null,
        ogTitle: formData.ogTitle || null,
        ogDescription: formData.ogDescription || null,
        twitterTitle: formData.twitterTitle || null,
        twitterDescription: formData.twitterDescription || null,
        twitterCard: formData.twitterCard || "summary_large_image",
        schemaType: formData.schemaType || "BlogPosting",
        tableOfContents: (formData.tableOfContents as object[]) ?? [],
        relatedPostIds: formData.relatedPostIds ?? [],
        keyTakeaways: formData.keyTakeaways ?? [],
        authorBio: formData.authorBio || null,
      },
    });

    revalidatePath("/admin/blog");
    revalidatePath(`/admin/blog/${id}/edit`);
    revalidatePath("/blog");
    if (existing?.slug && existing.slug !== post.slug) revalidatePath(`/blog/${existing.slug}`);
    revalidatePath(`/blog/${post.slug}`);
    return { success: true, data: post };
  } catch {
    return { success: false, error: "Failed to update post" };
  }
}

export async function deleteBlogPost(id: string) {
  const user = await getAdminUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    await db.blogPost.delete({ where: { id } });
    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete post" };
  }
}

export async function incrementBlogPostView(id: string) {
  try {
    await db.blogPost.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  } catch {}
}

// ==========================================
// FRONTEND PUBLIC ACTIONS
// ==========================================

export async function getPublishedBlogPosts(options: {
  page?: number;
  limit?: number;
  categorySlug?: string;
} = {}) {
  const { page = 1, limit = 12, categorySlug } = options;
  try {
    const where = {
      status: BlogPostStatus.PUBLISHED,
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    };

    const [posts, total, categories] = await Promise.all([
      db.blogPost.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ isPinned: "desc" }, { isFeatured: "desc" }, { publishedAt: "desc" }],
        select: {
          id: true, title: true, slug: true, excerpt: true,
          featuredImage: true, featuredImageAlt: true,
          videoUrl: true, videoThumbnail: true,
          publishedAt: true, readTimeMinutes: true, viewCount: true,
          isFeatured: true, isPinned: true, tags: true,
          category: { select: { id: true, name: true, slug: true, color: true } },
          author: { select: { id: true, name: true, image: true } },
        },
      }),
      db.blogPost.count({ where }),
      db.blogCategory.findMany({
        where: { isActive: true },
        orderBy: [{ menuOrder: "asc" }, { name: "asc" }],
        select: { id: true, name: true, slug: true, color: true },
      }),
    ]);

    return {
      success: true,
      posts,
      categories,
      total,
      pages: Math.ceil(total / limit),
    };
  } catch {
    return { success: false, posts: [], categories: [], total: 0, pages: 1 };
  }
}

export async function getBlogPostBySlug(slug: string) {
  try {
    const post = await db.blogPost.findUnique({
      where: { slug },
      include: {
        category: { select: { id: true, name: true, slug: true, color: true } },
        author: { select: { id: true, name: true, image: true } },
      },
    });
    if (!post || post.status !== BlogPostStatus.PUBLISHED) return null;
    return post;
  } catch {
    return null;
  }
}

export async function getAllPostsForPicker() {
  try {
    const posts = await db.blogPost.findMany({
      where: { status: BlogPostStatus.PUBLISHED },
      select: { id: true, title: true, slug: true },
      orderBy: { publishedAt: "desc" },
      take: 500,
    });
    return { success: true, data: posts };
  } catch {
    return { success: false, data: [] as { id: string; title: string; slug: string }[] };
  }
}

export async function getRelatedBlogPosts(
  currentId: string,
  categoryId: string | null,
  relatedPostIds: string[] = [],
  limit = 3
) {
  const select = {
    id: true, title: true, slug: true, excerpt: true,
    featuredImage: true, featuredImageAlt: true,
    readTimeMinutes: true, publishedAt: true,
    category: { select: { name: true, color: true } },
    author: { select: { name: true } },
  };

  try {
    // Use curated list first if admin has set specific related posts
    if (relatedPostIds.length > 0) {
      const posts = await db.blogPost.findMany({
        where: { status: BlogPostStatus.PUBLISHED, id: { in: relatedPostIds } },
        take: limit,
        orderBy: { publishedAt: "desc" },
        select,
      });
      if (posts.length > 0) return posts;
    }

    // Fallback: auto-fetch from same category
    const posts = await db.blogPost.findMany({
      where: {
        status: BlogPostStatus.PUBLISHED,
        id: { not: currentId },
        ...(categoryId ? { categoryId } : {}),
      },
      take: limit,
      orderBy: { publishedAt: "desc" },
      select,
    });
    return posts;
  } catch {
    return [];
  }
}
