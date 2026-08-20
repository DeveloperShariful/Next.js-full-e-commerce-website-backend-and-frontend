// app/actions/frontend/community/community-notifications.ts
"use server";

import { db } from "@/lib/prisma";
import { syncUser } from "@/lib/auth-sync";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { getStoreTimezone } from "@/lib/get-store-timezone";

/** Lets the client-side notification scheduler know which timezone's 10am/6pm to fire on. */
export async function getCommunityTimezone(): Promise<string> {
  return getStoreTimezone();
}

async function getAuthCustomer() {
  const user = await syncUser();
  if (!user) throw new Error("Unauthorized: Please sign in to continue.");
  return user;
}

// --- internal helpers, called from community-actions.ts — never notify
// someone about their own activity on their own content.

export async function notifyReaction(postId: string, actorId: string) {
  const post = await db.communityPost.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (!post || post.authorId === actorId) return;
  await db.communityNotification.create({
    data: { recipientId: post.authorId, actorId, type: "REACTION", postId },
  });
}

export async function notifyComment(postId: string, actorId: string) {
  const post = await db.communityPost.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (!post || post.authorId === actorId) return;
  await db.communityNotification.create({
    data: { recipientId: post.authorId, actorId, type: "COMMENT", postId },
  });
}

export async function notifyReply(parentCommentId: string, postId: string, actorId: string) {
  const parent = await db.postComment.findUnique({ where: { id: parentCommentId }, select: { authorId: true } });
  if (!parent || parent.authorId === actorId) return;
  await db.communityNotification.create({
    data: { recipientId: parent.authorId, actorId, type: "REPLY", postId, commentId: parentCommentId },
  });
}

export async function notifyFollow(targetUserId: string, actorId: string) {
  if (targetUserId === actorId) return;
  await db.communityNotification.create({
    data: { recipientId: targetUserId, actorId, type: "FOLLOW" },
  });
}

export async function notifyMentions(mentionedUserIds: string[], actorId: string, postId: string, commentId: string | null) {
  const uniqueIds = [...new Set(mentionedUserIds)].filter(id => id !== actorId);
  if (uniqueIds.length === 0) return;
  await db.communityNotification.createMany({
    data: uniqueIds.map(recipientId => ({ recipientId, actorId, type: "MENTION" as const, postId, commentId })),
  });
}

// --- customer-facing actions

const NOTIFICATION_PAGE_SIZE = 20;

export async function getNotifications(cursor?: string) {
  try {
    const user = await getAuthCustomer();

    const notifications = await db.communityNotification.findMany({
      where: { recipientId: user.id },
      orderBy: { createdAt: "desc" },
      take: NOTIFICATION_PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        actor: { select: { id: true, name: true, image: true } },
        post: { select: { id: true, slug: true, caption: true } },
        comment: { select: { id: true, content: true } },
      },
    });

    const hasMore = notifications.length > NOTIFICATION_PAGE_SIZE;
    const page = hasMore ? notifications.slice(0, NOTIFICATION_PAGE_SIZE) : notifications;

    return { success: true, notifications: page, nextCursor: hasMore ? page[page.length - 1].id : null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load notifications.";
    return { success: false, message, notifications: [], nextCursor: null };
  }
}

export async function getUnreadNotificationCount() {
  // This is polled on an interval by the client, so it deliberately skips syncUser()'s
  // extra db.user lookup and reads the id straight off the session/JWT — one query
  // instead of two, since a badge count doesn't need up-to-the-second account freshness.
  const session = await auth();
  const userId = session?.user?.id as string | undefined;
  if (!userId) return { success: true, count: 0 };
  const count = await db.communityNotification.count({ where: { recipientId: userId, isRead: false } });
  return { success: true, count };
}

export async function markAllNotificationsRead() {
  try {
    const user = await getAuthCustomer();
    await db.communityNotification.updateMany({ where: { recipientId: user.id, isRead: false }, data: { isRead: true } });
    revalidatePath("/community/notifications");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update notifications.";
    return { success: false, message };
  }
}
