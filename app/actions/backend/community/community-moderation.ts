// app/actions/backend/community/community-moderation.ts
"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";

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

export async function getPendingReports() {
  const admin = await getAdminUser();
  if (!admin) return { success: false, reports: [] };

  const reports = await db.postReport.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      reporter: { select: { id: true, name: true, email: true } },
      post: { include: { author: { select: { id: true, name: true } } } },
      comment: { include: { author: { select: { id: true, name: true } } } },
    },
  });
  return { success: true, reports };
}

export type CommunityPostSort = "newest" | "oldest" | "most_reported";
export type CommunityPostStatusFilter = "ALL" | "PUBLISHED" | "HIDDEN";

export async function getAllCommunityPostsAdmin(params: {
  page?: number;
  query?: string;
  status?: CommunityPostStatusFilter;
  sort?: CommunityPostSort;
} = {}) {
  const admin = await getAdminUser();
  if (!admin) return { success: false, posts: [], total: 0, pages: 0 };

  const { page = 1, query, status = "ALL", sort = "newest" } = params;
  const limit = 20;

  const where: Prisma.CommunityPostWhereInput = { deletedAt: null };
  if (status !== "ALL") where.status = status;
  if (query?.trim()) {
    where.OR = [
      { caption: { contains: query.trim(), mode: "insensitive" } },
      { author: { name: { contains: query.trim(), mode: "insensitive" } } },
      { author: { email: { contains: query.trim(), mode: "insensitive" } } },
    ];
  }

  const orderBy: Prisma.CommunityPostOrderByWithRelationInput =
    sort === "oldest" ? { createdAt: "asc" }
    : sort === "most_reported" ? { reports: { _count: "desc" } }
    : { createdAt: "desc" };

  const [posts, total] = await Promise.all([
    db.communityPost.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: { select: { id: true, name: true, email: true } },
        _count: { select: { reports: true } },
      },
    }),
    db.communityPost.count({ where }),
  ]);

  return { success: true, posts, total, pages: Math.ceil(total / limit) };
}

export async function bulkHidePostsAdmin(postIds: string[]) {
  const admin = await getAdminUser();
  if (!admin) return { success: false, message: "Unauthorized." };
  if (postIds.length === 0) return { success: false, message: "No posts selected." };

  await db.communityPost.updateMany({ where: { id: { in: postIds } }, data: { status: "HIDDEN" } });
  revalidatePath("/admin/community");
  revalidatePath("/community");
  return { success: true };
}

export async function bulkUnhidePostsAdmin(postIds: string[]) {
  const admin = await getAdminUser();
  if (!admin) return { success: false, message: "Unauthorized." };
  if (postIds.length === 0) return { success: false, message: "No posts selected." };

  await db.communityPost.updateMany({ where: { id: { in: postIds } }, data: { status: "PUBLISHED" } });
  revalidatePath("/admin/community");
  revalidatePath("/community");
  return { success: true };
}

export async function bulkDeletePostsAdmin(postIds: string[]) {
  const admin = await getAdminUser();
  if (!admin) return { success: false, message: "Unauthorized." };
  if (postIds.length === 0) return { success: false, message: "No posts selected." };

  await db.communityPost.updateMany({ where: { id: { in: postIds } }, data: { deletedAt: new Date() } });
  revalidatePath("/admin/community");
  revalidatePath("/community");
  return { success: true };
}

export async function hidePostAdmin(postId: string) {
  const admin = await getAdminUser();
  if (!admin) return { success: false, message: "Unauthorized." };

  await db.communityPost.update({ where: { id: postId }, data: { status: "HIDDEN" } });
  revalidatePath("/admin/community");
  revalidatePath("/community");
  return { success: true };
}

export async function unhidePostAdmin(postId: string) {
  const admin = await getAdminUser();
  if (!admin) return { success: false, message: "Unauthorized." };

  await db.communityPost.update({ where: { id: postId }, data: { status: "PUBLISHED" } });
  revalidatePath("/admin/community");
  revalidatePath("/community");
  return { success: true };
}

export async function deletePostAdmin(postId: string) {
  const admin = await getAdminUser();
  if (!admin) return { success: false, message: "Unauthorized." };

  await db.communityPost.update({ where: { id: postId }, data: { deletedAt: new Date() } });
  revalidatePath("/admin/community");
  revalidatePath("/community");
  return { success: true };
}

export async function hideCommentAdmin(commentId: string) {
  const admin = await getAdminUser();
  if (!admin) return { success: false, message: "Unauthorized." };

  await db.postComment.update({ where: { id: commentId }, data: { status: "HIDDEN" } });
  revalidatePath("/admin/community");
  revalidatePath("/community");
  return { success: true };
}

export async function resolveReport(reportId: string, status: "REVIEWED" | "DISMISSED") {
  const admin = await getAdminUser();
  if (!admin) return { success: false, message: "Unauthorized." };

  await db.postReport.update({ where: { id: reportId }, data: { status } });
  revalidatePath("/admin/community");
  return { success: true };
}
