"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

async function getAdminUser() {
  const session = await auth();
  if (!session?.user?.email) return null;
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });
  if (!user) return null;
  if (!["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(user.role)) return null;
  return user;
}

// ── Frontend ──────────────────────────────────────────────────────────────────

export async function getApprovedComments(postId: string) {
  try {
    const comments = await db.blogComment.findMany({
      where: { postId, isApproved: true, isSpam: false, parentId: null },
      orderBy: { createdAt: "asc" },
      include: {
        replies: {
          where: { isApproved: true, isSpam: false },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    return { success: true, data: comments };
  } catch {
    return { success: false, data: [] };
  }
}

export async function submitComment(data: {
  postId: string;
  parentId?: string;
  authorName: string;
  authorEmail: string;
  authorUrl?: string;
  content: string;
}) {
  if (!data.authorName.trim() || !data.authorEmail.trim() || !data.content.trim()) {
    return { success: false, error: "Name, email and comment are required." };
  }
  if (data.content.trim().length < 5) {
    return { success: false, error: "Comment is too short." };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.authorEmail.trim())) {
    return { success: false, error: "Please enter a valid email address." };
  }

  try {
    const settings = await db.blogSettings.findUnique({ where: { id: "singleton" } });
    if (settings && !settings.commentsEnabled) {
      return { success: false, error: "Comments are disabled for this blog." };
    }
    const requireApproval = settings?.commentModeration ?? true;

    await db.blogComment.create({
      data: {
        postId: data.postId,
        parentId: data.parentId ?? null,
        authorName: data.authorName.trim(),
        authorEmail: data.authorEmail.trim().toLowerCase(),
        authorUrl: data.authorUrl?.trim() || null,
        content: data.content.trim(),
        isApproved: !requireApproval,
      },
    });

    const post = await db.blogPost.findUnique({
      where: { id: data.postId },
      select: { slug: true },
    });
    if (post) revalidatePath(`/blog/${post.slug}`);

    return {
      success: true,
      message: requireApproval
        ? "Your comment has been submitted and is awaiting moderation. Thank you!"
        : "Your comment has been posted!",
    };
  } catch {
    return { success: false, error: "Failed to submit comment. Please try again." };
  }
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function getAllComments(
  filter: "all" | "pending" | "approved" | "spam" = "all",
  page = 1,
  limit = 25
) {
  const admin = await getAdminUser();
  if (!admin) return { success: false, data: [], total: 0, pages: 1 };

  try {
    const where =
      filter === "pending"
        ? { isApproved: false, isSpam: false }
        : filter === "approved"
        ? { isApproved: true, isSpam: false }
        : filter === "spam"
        ? { isSpam: true }
        : {};

    const [comments, total] = await Promise.all([
      db.blogComment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          post: { select: { id: true, title: true, slug: true } },
        },
      }),
      db.blogComment.count({ where }),
    ]);

    const counts = await db.blogComment.groupBy({
      by: ["isApproved", "isSpam"],
      _count: { _all: true },
    });

    const pending = counts.find((c) => !c.isApproved && !c.isSpam)?._count._all ?? 0;
    const approved = counts.find((c) => c.isApproved && !c.isSpam)?._count._all ?? 0;
    const spam = counts.find((c) => c.isSpam)?._count._all ?? 0;

    return {
      success: true,
      data: comments,
      total,
      pages: Math.ceil(total / limit),
      counts: { all: total, pending, approved, spam },
    };
  } catch {
    return { success: false, data: [], total: 0, pages: 1, counts: {} };
  }
}

export async function approveComment(id: string) {
  const admin = await getAdminUser();
  if (!admin) return { success: false, error: "Unauthorized" };
  try {
    const comment = await db.blogComment.update({
      where: { id },
      data: { isApproved: true, isSpam: false },
      include: { post: { select: { slug: true } } },
    });
    revalidatePath("/admin/blog/comments");
    revalidatePath(`/blog/${comment.post?.slug}`);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to approve" };
  }
}

export async function rejectComment(id: string) {
  const admin = await getAdminUser();
  if (!admin) return { success: false, error: "Unauthorized" };
  try {
    const comment = await db.blogComment.update({
      where: { id },
      data: { isApproved: false },
      include: { post: { select: { slug: true } } },
    });
    revalidatePath("/admin/blog/comments");
    revalidatePath(`/blog/${comment.post?.slug}`);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to reject" };
  }
}

export async function markAsSpam(id: string) {
  const admin = await getAdminUser();
  if (!admin) return { success: false, error: "Unauthorized" };
  try {
    await db.blogComment.update({ where: { id }, data: { isSpam: true, isApproved: false } });
    revalidatePath("/admin/blog/comments");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to mark as spam" };
  }
}

export async function deleteComment(id: string) {
  const admin = await getAdminUser();
  if (!admin) return { success: false, error: "Unauthorized" };
  try {
    await db.blogComment.delete({ where: { id } });
    revalidatePath("/admin/blog/comments");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete" };
  }
}
