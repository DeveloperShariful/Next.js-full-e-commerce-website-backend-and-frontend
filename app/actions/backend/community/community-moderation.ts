// app/actions/backend/community/community-moderation.ts
"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

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

export async function getAllCommunityPostsAdmin(page: number = 1) {
  const admin = await getAdminUser();
  if (!admin) return { success: false, posts: [], total: 0, pages: 0 };

  const limit = 20;
  const [posts, total] = await Promise.all([
    db.communityPost.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: { select: { id: true, name: true, email: true } },
        _count: { select: { reports: true } },
      },
    }),
    db.communityPost.count({ where: { deletedAt: null } }),
  ]);

  return { success: true, posts, total, pages: Math.ceil(total / limit) };
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
