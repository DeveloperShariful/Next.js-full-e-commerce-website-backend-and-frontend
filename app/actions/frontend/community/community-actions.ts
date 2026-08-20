// app/actions/frontend/community/community-actions.ts
"use server";

import { db } from "@/lib/prisma";
import { syncUser } from "@/lib/auth-sync";
import { stripHtml } from "@/lib/sanitize";
import { revalidatePath } from "next/cache";
import { MediaType, ReactionType, Prisma } from "@prisma/client";
import { notifyReaction, notifyComment, notifyReply, notifyMentions } from "./community-notifications";
import { prewarmLinkPreview, attachLinkPreviews, getCachedLinkPreview } from "@/lib/link-preview";

async function getAuthCustomer() {
  const user = await syncUser();
  if (!user) throw new Error("Unauthorized: Please sign in to continue.");
  return user;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generateUniquePostSlug(caption: string | null, authorName: string | null): Promise<string> {
  const base = slugify(caption?.slice(0, 60) || `post-by-${authorName || "member"}`) || "post";
  const shortId = Math.random().toString(36).slice(2, 8);
  let slug = `${base}-${shortId}`;

  let attempt = 0;
  while (await db.communityPost.findUnique({ where: { slug }, select: { id: true } })) {
    attempt++;
    slug = `${base}-${shortId}${attempt}`;
  }
  return slug;
}

function autoSeoFields(caption: string | null, firstMedia: { url: string; mediaType: MediaType } | null, authorName: string | null) {
  const cleanCaption = caption?.trim() || "";
  const metaTitle = cleanCaption
    ? (cleanCaption.length > 60 ? `${cleanCaption.slice(0, 57)}...` : cleanCaption)
    : `Community post by ${authorName || "a GoBike rider"}`;
  const metaDesc = cleanCaption
    ? (cleanCaption.length > 155 ? `${cleanCaption.slice(0, 152)}...` : cleanCaption)
    : "Shared on the GoBike Community — see what our riders are up to.";
  // Cloudinary video URLs return a poster-frame image if you swap the
  // extension to .jpg (see lib/cloudinary.ts's URL shape) — no separate
  // thumbnail generation step needed.
  const ogImage = firstMedia
    ? (firstMedia.mediaType === MediaType.VIDEO ? firstMedia.url.replace(/\.[a-zA-Z0-9]+$/, ".jpg") : firstMedia.url)
    : null;

  return { metaTitle, metaDesc, ogImage };
}

const MAX_POSTS_PER_HOUR = 5;
const MAX_CAPTION_LENGTH = 2000;
const MAX_COMMENT_LENGTH = 1000;
const MAX_MEDIA_PER_POST = 10;

const postIncludeFor = (currentUserId?: string) => ({
  author: {
    select: {
      id: true,
      name: true,
      image: true,
      role: true,
      followers: currentUserId ? { where: { followerId: currentUserId }, select: { id: true } } : false,
    },
  },
  media: { orderBy: { order: "asc" as const } },
  reactions: currentUserId ? { where: { userId: currentUserId }, select: { type: true } } : false,
  comments: {
    where: { status: "VISIBLE" as const, deletedAt: null, parentId: null },
    orderBy: { createdAt: "asc" as const },
    take: 3,
    include: {
      author: { select: { id: true, name: true, image: true, role: true } },
      replies: {
        where: { status: "VISIBLE" as const, deletedAt: null },
        orderBy: { createdAt: "asc" as const },
        include: { author: { select: { id: true, name: true, image: true, role: true } } },
      },
    },
  },
});

export async function createCommunityPost(data: {
  caption?: string;
  media?: { url: string; mediaType: "IMAGE" | "VIDEO" }[];
  tags?: string[];
  mentionedUserIds?: string[];
}) {
  try {
    const user = await getAuthCustomer();

    const caption = data.caption ? stripHtml(data.caption).slice(0, MAX_CAPTION_LENGTH) : null;
    const media = (data.media ?? []).slice(0, MAX_MEDIA_PER_POST);
    if (!caption && media.length === 0) {
      return { success: false, message: "Add a photo, video, or caption before posting." };
    }

    const recentCount = await db.communityPost.count({
      where: { authorId: user.id, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    });
    if (recentCount >= MAX_POSTS_PER_HOUR) {
      return { success: false, message: "You're posting too frequently. Please try again later." };
    }

    const slug = await generateUniquePostSlug(caption, user.name);
    const firstMedia = media[0] ? { url: media[0].url, mediaType: media[0].mediaType === "VIDEO" ? MediaType.VIDEO : MediaType.IMAGE } : null;
    const { metaTitle, metaDesc, ogImage } = autoSeoFields(caption, firstMedia, user.name);

    const tags = (data.tags ?? [])
      .map(t => stripHtml(t).trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 10);

    const post = await db.communityPost.create({
      data: {
        slug,
        caption,
        tags,
        authorId: user.id,
        metaTitle,
        metaDesc,
        ogImage,
        media: {
          create: media.map((m, i) => ({
            url: m.url,
            mediaType: m.mediaType === "VIDEO" ? MediaType.VIDEO : MediaType.IMAGE,
            order: i,
          })),
        },
      },
    });

    if (data.mentionedUserIds?.length) {
      await notifyMentions(data.mentionedUserIds, user.id, post.id, null);
    }
    prewarmLinkPreview(caption).catch(() => {});

    revalidatePath("/community");
    return { success: true, postId: post.id, slug: post.slug };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create post.";
    return { success: false, message };
  }
}

export async function editCommunityPost(postId: string, data: { caption?: string; tags?: string[] }) {
  try {
    const user = await getAuthCustomer();
    const post = await db.communityPost.findUnique({ where: { id: postId }, select: { authorId: true, media: { take: 1, orderBy: { order: "asc" } } } });
    if (!post) return { success: false, message: "Post not found." };
    if (post.authorId !== user.id) return { success: false, message: "You can only edit your own posts." };

    const caption = data.caption !== undefined ? stripHtml(data.caption).slice(0, MAX_CAPTION_LENGTH) : undefined;
    const tags = data.tags ? data.tags.map(t => stripHtml(t).trim().toLowerCase()).filter(Boolean).slice(0, 10) : undefined;

    const seo = caption !== undefined ? autoSeoFields(caption, post.media[0] ? { url: post.media[0].url, mediaType: post.media[0].mediaType } : null, user.name) : undefined;

    await db.communityPost.update({
      where: { id: postId },
      data: {
        ...(caption !== undefined ? { caption } : {}),
        ...(tags !== undefined ? { tags } : {}),
        ...(seo ? { metaTitle: seo.metaTitle, metaDesc: seo.metaDesc, ogImage: seo.ogImage } : {}),
      },
    });

    if (caption !== undefined) prewarmLinkPreview(caption).catch(() => {});

    revalidatePath("/community");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update post.";
    return { success: false, message };
  }
}

export async function toggleReaction(postId: string, type: ReactionType) {
  try {
    const user = await getAuthCustomer();

    const existing = await db.postReaction.findUnique({
      where: { postId_userId: { postId, userId: user.id } },
    });

    if (existing && existing.type === type) {
      await db.$transaction([
        db.postReaction.delete({ where: { id: existing.id } }),
        db.communityPost.update({ where: { id: postId }, data: { reactionCount: { decrement: 1 } } }),
      ]);
      revalidatePath("/community");
      return { success: true, active: false };
    }

    if (existing) {
      await db.postReaction.update({ where: { id: existing.id }, data: { type } });
      revalidatePath("/community");
      return { success: true, active: true, type };
    }

    await db.$transaction([
      db.postReaction.create({ data: { postId, userId: user.id, type } }),
      db.communityPost.update({ where: { id: postId }, data: { reactionCount: { increment: 1 } } }),
    ]);
    notifyReaction(postId, user.id).catch(() => {});
    revalidatePath("/community");
    return { success: true, active: true, type };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to react.";
    return { success: false, message };
  }
}

export async function getPostReactors(postId: string) {
  const reactions = await db.postReaction.findMany({
    where: { postId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, image: true } } },
  });
  return { success: true, reactions };
}

export async function incrementShareCount(postId: string) {
  try {
    const post = await db.communityPost.update({
      where: { id: postId },
      data: { shareCount: { increment: 1 } },
      select: { shareCount: true },
    });
    return { success: true, shareCount: post.shareCount };
  } catch {
    return { success: false };
  }
}

export async function addComment(postId: string, content: string, parentId?: string, mentionedUserIds?: string[]) {
  try {
    const user = await getAuthCustomer();

    const clean = stripHtml(content).slice(0, MAX_COMMENT_LENGTH).trim();
    if (!clean) return { success: false, message: "Comment can't be empty." };

    const [comment] = await db.$transaction([
      db.postComment.create({
        data: { postId, authorId: user.id, content: clean, parentId: parentId || null },
        include: { author: { select: { id: true, name: true, image: true, role: true } } },
      }),
      db.communityPost.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } }),
    ]);

    if (parentId) notifyReply(parentId, postId, user.id).catch(() => {});
    else notifyComment(postId, user.id).catch(() => {});
    if (mentionedUserIds?.length) notifyMentions(mentionedUserIds, user.id, postId, comment.id).catch(() => {});

    revalidatePath("/community");
    return { success: true, comment };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to add comment.";
    return { success: false, message };
  }
}

export async function editComment(commentId: string, content: string) {
  try {
    const user = await getAuthCustomer();
    const comment = await db.postComment.findUnique({ where: { id: commentId }, select: { authorId: true } });
    if (!comment) return { success: false, message: "Comment not found." };
    if (comment.authorId !== user.id) return { success: false, message: "You can only edit your own comments." };

    const clean = stripHtml(content).slice(0, MAX_COMMENT_LENGTH).trim();
    if (!clean) return { success: false, message: "Comment can't be empty." };

    await db.postComment.update({ where: { id: commentId }, data: { content: clean } });
    revalidatePath("/community");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to edit comment.";
    return { success: false, message };
  }
}

export async function deleteOwnPost(postId: string) {
  try {
    const user = await getAuthCustomer();
    const post = await db.communityPost.findUnique({ where: { id: postId }, select: { authorId: true } });
    if (!post) return { success: false, message: "Post not found." };
    if (post.authorId !== user.id) return { success: false, message: "You can only delete your own posts." };

    await db.communityPost.update({ where: { id: postId }, data: { deletedAt: new Date() } });
    revalidatePath("/community");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete post.";
    return { success: false, message };
  }
}

export async function deleteOwnComment(commentId: string) {
  try {
    const user = await getAuthCustomer();
    const comment = await db.postComment.findUnique({ where: { id: commentId }, select: { authorId: true, postId: true } });
    if (!comment) return { success: false, message: "Comment not found." };
    if (comment.authorId !== user.id) return { success: false, message: "You can only delete your own comments." };

    await db.$transaction([
      db.postComment.update({ where: { id: commentId }, data: { deletedAt: new Date() } }),
      db.communityPost.update({ where: { id: comment.postId }, data: { commentCount: { decrement: 1 } } }),
    ]);
    revalidatePath("/community");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete comment.";
    return { success: false, message };
  }
}

export async function reportContent(data: { postId?: string; commentId?: string; reason?: string }) {
  try {
    const user = await getAuthCustomer();
    if (!data.postId && !data.commentId) return { success: false, message: "Nothing to report." };

    await db.postReport.create({
      data: {
        postId: data.postId,
        commentId: data.commentId,
        reporterId: user.id,
        reason: data.reason ? stripHtml(data.reason).slice(0, 500) : null,
      },
    });
    return { success: true, message: "Thanks — our team will review this." };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to submit report.";
    return { success: false, message };
  }
}

const FEED_PAGE_SIZE = 10;

export async function getCommunityFeed(cursor?: string) {
  try {
    const currentUser = await syncUser();

    const posts = await db.communityPost.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: FEED_PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: postIncludeFor(currentUser?.id),
    });

    const hasMore = posts.length > FEED_PAGE_SIZE;
    const page = hasMore ? posts.slice(0, FEED_PAGE_SIZE) : posts;
    const pageWithPreviews = await attachLinkPreviews(page);

    return { success: true, posts: pageWithPreviews, nextCursor: hasMore ? page[page.length - 1].id : null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load feed.";
    return { success: false, message, posts: [], nextCursor: null };
  }
}

export async function getCommunityFeedByTag(tag: string, cursor?: string) {
  try {
    const currentUser = await syncUser();
    const cleanTag = tag.toLowerCase().trim();

    const posts = await db.communityPost.findMany({
      where: { status: "PUBLISHED", deletedAt: null, tags: { has: cleanTag } },
      orderBy: { createdAt: "desc" },
      take: FEED_PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: postIncludeFor(currentUser?.id),
    });

    const hasMore = posts.length > FEED_PAGE_SIZE;
    const page = hasMore ? posts.slice(0, FEED_PAGE_SIZE) : posts;
    const pageWithPreviews = await attachLinkPreviews(page);

    return { success: true, posts: pageWithPreviews, nextCursor: hasMore ? page[page.length - 1].id : null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load feed.";
    return { success: false, message, posts: [], nextCursor: null };
  }
}

export async function getCommunityPostBySlug(slug: string) {
  try {
    const currentUser = await syncUser();
    const post = await db.communityPost.findFirst({
      where: { slug, status: "PUBLISHED", deletedAt: null },
      include: {
        ...postIncludeFor(currentUser?.id),
        comments: {
          where: { status: "VISIBLE", deletedAt: null, parentId: null },
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, name: true, image: true, role: true } },
            replies: {
              where: { status: "VISIBLE", deletedAt: null },
              orderBy: { createdAt: "asc" },
              include: { author: { select: { id: true, name: true, image: true, role: true } } },
            },
          },
        },
      },
    });
    if (!post) return { success: false, post: null };

    db.communityPost.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
    const linkPreview = await getCachedLinkPreview(post.caption);
    return { success: true, post: { ...post, linkPreview } };
  } catch {
    return { success: false, post: null };
  }
}

export async function searchCommunity(query: string) {
  const q = query.trim();
  if (!q) return { success: true, posts: [], users: [] };

  const currentUser = await syncUser();

  const [posts, users] = await Promise.all([
    db.communityPost.findMany({
      where: {
        status: "PUBLISHED",
        deletedAt: null,
        OR: [
          { caption: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { tags: { has: q.toLowerCase() } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: postIncludeFor(currentUser?.id),
    }),
    db.user.findMany({
      where: { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
      select: { id: true, name: true, image: true },
      take: 10,
    }),
  ]);

  const postsWithPreviews = await attachLinkPreviews(posts);
  return { success: true, posts: postsWithPreviews, users };
}

export async function searchUsersForMention(query: string) {
  const q = query.trim();
  if (q.length < 1) return { success: true, users: [] };

  const users = await db.user.findMany({
    where: { name: { contains: q, mode: Prisma.QueryMode.insensitive }, isActive: true },
    select: { id: true, name: true, image: true },
    take: 8,
  });
  return { success: true, users };
}
