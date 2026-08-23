// app/actions/frontend/community/community-social.ts
"use server";

import { db } from "@/lib/prisma";
import { syncUser } from "@/lib/auth-sync";
import { revalidatePath } from "next/cache";
import { notifyFollow } from "./community-notifications";
import { attachLinkPreviews } from "@/lib/link-preview";

async function getAuthCustomer() {
  const user = await syncUser();
  if (!user) throw new Error("Unauthorized: Please sign in to continue.");
  return user;
}

const BIO_MAX_LENGTH = 160;
const NICKNAME_MAX_LENGTH = 40;
const MAX_SOCIAL_LINKS = 3;

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function updateProfileDetails(data: { bio: string; nickname: string; socialLinks: string[] }) {
  try {
    const user = await getAuthCustomer();

    const bio = data.bio.trim().slice(0, BIO_MAX_LENGTH);
    const nickname = data.nickname.trim().slice(0, NICKNAME_MAX_LENGTH);
    const socialLinks = data.socialLinks
      .map(link => link.trim())
      .filter(link => link && isValidHttpUrl(link))
      .slice(0, MAX_SOCIAL_LINKS);

    await db.user.update({
      where: { id: user.id },
      data: { bio: bio || null, nickname: nickname || null, socialLinks },
    });
    revalidatePath(`/community/profile/${user.id}`);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update profile.";
    return { success: false, message };
  }
}

export async function toggleFollow(targetUserId: string) {
  try {
    const user = await getAuthCustomer();
    if (user.id === targetUserId) return { success: false, message: "You can't follow yourself." };

    const existing = await db.follow.findUnique({
      where: { followerId_followingId: { followerId: user.id, followingId: targetUserId } },
    });

    if (existing) {
      await db.follow.delete({ where: { id: existing.id } });
      revalidatePath("/community");
      return { success: true, following: false };
    }

    await db.follow.create({ data: { followerId: user.id, followingId: targetUserId } });
    notifyFollow(targetUserId, user.id).catch(() => {});
    revalidatePath("/community");
    return { success: true, following: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update follow status.";
    return { success: false, message };
  }
}

export async function toggleSavePost(postId: string) {
  try {
    const user = await getAuthCustomer();

    const existing = await db.savedPost.findUnique({ where: { userId_postId: { userId: user.id, postId } } });
    if (existing) {
      await db.savedPost.delete({ where: { id: existing.id } });
      return { success: true, saved: false };
    }
    await db.savedPost.create({ data: { userId: user.id, postId } });
    return { success: true, saved: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save post.";
    return { success: false, message };
  }
}

const PAGE_SIZE = 10;

export async function getSavedPosts(cursor?: string) {
  try {
    const user = await getAuthCustomer();

    const saved = await db.savedPost.findMany({
      where: { userId: user.id, post: { status: "PUBLISHED", deletedAt: null } },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
                role: true,
                followers: { where: { followerId: user.id }, select: { id: true } },
              },
            },
            media: { orderBy: { order: "asc" } },
            reactions: { where: { userId: user.id }, select: { type: true } },
            comments: {
              where: { status: "VISIBLE", deletedAt: null, parentId: null },
              orderBy: { createdAt: "asc" },
              take: 3,
              include: {
                author: { select: { id: true, name: true, image: true, role: true } },
                replies: { include: { author: { select: { id: true, name: true, image: true, role: true } } } },
              },
            },
          },
        },
      },
    });

    const hasMore = saved.length > PAGE_SIZE;
    const page = hasMore ? saved.slice(0, PAGE_SIZE) : saved;
    const posts = await attachLinkPreviews(page.map(s => s.post));

    return { success: true, posts, nextCursor: hasMore ? page[page.length - 1].id : null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load saved posts.";
    return { success: false, message, posts: [], nextCursor: null };
  }
}

export async function getUserCommunityProfile(userId: string, cursor?: string) {
  try {
    const currentUser = await syncUser();

    const [profileUser, followerCount, followingCount, postCount, isFollowing, posts] = await Promise.all([
      db.user.findUnique({ where: { id: userId }, select: { id: true, name: true, image: true, bio: true, nickname: true, socialLinks: true, createdAt: true, updatedAt: true } }),
      db.follow.count({ where: { followingId: userId } }),
      db.follow.count({ where: { followerId: userId } }),
      db.communityPost.count({ where: { authorId: userId, status: "PUBLISHED", deletedAt: null } }),
      currentUser
        ? db.follow.findUnique({ where: { followerId_followingId: { followerId: currentUser.id, followingId: userId } } })
        : null,
      db.communityPost.findMany({
        where: { authorId: userId, status: "PUBLISHED", deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: PAGE_SIZE + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
              role: true,
              followers: currentUser ? { where: { followerId: currentUser.id }, select: { id: true } } : false,
            },
          },
          media: { orderBy: { order: "asc" } },
          reactions: currentUser ? { where: { userId: currentUser.id }, select: { type: true } } : false,
          comments: {
            where: { status: "VISIBLE", deletedAt: null, parentId: null },
            orderBy: { createdAt: "asc" },
            take: 3,
            include: {
              author: { select: { id: true, name: true, image: true, role: true } },
              replies: { include: { author: { select: { id: true, name: true, image: true, role: true } } } },
            },
          },
        },
      }),
    ]);

    if (!profileUser) return { success: false, profile: null, posts: [], nextCursor: null };

    const hasMore = posts.length > PAGE_SIZE;
    const page = hasMore ? posts.slice(0, PAGE_SIZE) : posts;
    const pageWithPreviews = await attachLinkPreviews(page);

    return {
      success: true,
      profile: {
        user: profileUser,
        followerCount,
        followingCount,
        postCount,
        isFollowing: !!isFollowing,
        isOwnProfile: currentUser?.id === userId,
      },
      posts: pageWithPreviews,
      nextCursor: hasMore ? page[page.length - 1].id : null,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load profile.";
    return { success: false, message, profile: null, posts: [], nextCursor: null };
  }
}
