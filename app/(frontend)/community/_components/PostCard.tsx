"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { MediaType, ReactionType, Role } from "@prisma/client";
import { toast } from "sonner";
import ReactionPicker, { reactionMeta } from "./ReactionPicker";
import MediaCarousel from "./MediaCarousel";
import LinkifiedText from "./LinkifiedText";
import {
  toggleReaction,
  addComment,
  editComment as editCommentAction,
  deleteOwnPost,
  deleteOwnComment,
  reportContent,
  getPostReactors,
  editCommunityPost,
  incrementShareCount,
} from "@/app/actions/frontend/community/community-actions";
import { toggleSavePost, toggleFollow } from "@/app/actions/frontend/community/community-social";

export interface CommentData {
  id: string;
  content: string;
  createdAt: string | Date;
  author: { id: string; name: string | null; image: string | null; role: Role };
  replies?: CommentData[];
}

export interface CommunityPostData {
  id: string;
  slug: string;
  caption: string | null;
  media: { id: string; url: string; mediaType: MediaType }[];
  tags: string[];
  reactionCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: string | Date;
  author: { id: string; name: string | null; image: string | null; role: Role; followers?: { id: string }[] };
  reactions?: { type: ReactionType }[];
  comments: CommentData[];
  linkPreview?: { url: string; title: string | null; description: string | null; image: string | null } | null;
}

function timeAgo(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

const FB_BLUE = "#1877F2";

export function Avatar({ name, image, size = 40 }: { name?: string | null; image?: string | null; size?: number }) {
  if (image) {
    return (
      <Image
        src={image}
        alt={name || "User"}
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
        unoptimized
      />
    );
  }
  return (
    <div
      className="rounded-full bg-[#E4E6EB] flex items-center justify-center font-bold text-[#65676B] shrink-0"
      style={{ width: size, height: size, fontSize: size / 2.2 }}
    >
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

function CommentRow({
  comment,
  postId,
  currentUserId,
  isLoggedIn,
  onDelete,
  onReplyPosted,
  depth = 0,
}: {
  comment: CommentData;
  postId: string;
  currentUserId?: string;
  isLoggedIn: boolean;
  onDelete: (id: string) => void;
  onReplyPosted: (parentId: string, reply: CommentData) => void;
  depth?: number;
}) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyInput, setReplyInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(comment.content);
  const [content, setContent] = useState(comment.content);
  const [isPending, startTransition] = useTransition();

  const handleReply = () => {
    if (!isLoggedIn) { toast.error("Please sign in to reply."); return; }
    const text = replyInput.trim();
    if (!text) return;
    setReplyInput("");
    setShowReplyBox(false);
    startTransition(async () => {
      const res = await addComment(postId, text, comment.id);
      if (res.success && res.comment) {
        onReplyPosted(comment.id, res.comment as CommentData);
      } else {
        toast.error(res.message || "Failed to reply.");
      }
    });
  };

  const handleSaveEdit = () => {
    const text = editValue.trim();
    if (!text) return;
    startTransition(async () => {
      const res = await editCommentAction(comment.id, text);
      if (res.success) {
        setContent(text);
        setIsEditing(false);
      } else {
        toast.error(res.message || "Failed to edit comment.");
      }
    });
  };

  return (
    <div className={`flex items-start gap-2 group ${depth > 0 ? "ml-9 mt-2" : ""}`}>
      <Avatar name={comment.author.name} image={comment.author.image} size={depth > 0 ? 28 : 32} />
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(); }}
              className="flex-1 bg-[#F0F2F5] rounded-full px-3 py-1.5 text-[14px] outline-none"
              autoFocus
            />
            <button onClick={handleSaveEdit} disabled={isPending} className="text-[13px] font-bold" style={{ color: FB_BLUE }}>Save</button>
            <button onClick={() => setIsEditing(false)} className="text-[13px] text-[#65676B]">Cancel</button>
          </div>
        ) : (
          <div className="bg-[#F0F2F5] rounded-2xl px-3 py-2 inline-block max-w-full">
            <p className="text-[13px] font-semibold text-[#050505]">{comment.author.name || "GoBike Rider"}</p>
            <p className="text-[15px] text-[#050505] whitespace-pre-wrap break-words">
              <LinkifiedText text={content} authorRole={comment.author.role} />
            </p>
          </div>
        )}

        {!isEditing && (
          <div className="flex items-center gap-3 mt-0.5 pl-3 text-[12px] font-semibold text-[#65676B]">
            <span>{timeAgo(comment.createdAt)}</span>
            {depth === 0 && <button onClick={() => setShowReplyBox(v => !v)} className="hover:underline">Reply</button>}
            {currentUserId === comment.author.id && (
              <>
                <button onClick={() => setIsEditing(true)} className="hover:underline">Edit</button>
                <button onClick={() => onDelete(comment.id)} className="hover:underline hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
              </>
            )}
          </div>
        )}

        {showReplyBox && (
          <div className="flex items-center gap-2 mt-2">
            <Avatar size={26} />
            <input
              value={replyInput}
              onChange={(e) => setReplyInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleReply(); }}
              placeholder={`Reply to ${comment.author.name?.split(" ")[0] || "this comment"}...`}
              disabled={isPending}
              className="flex-1 bg-[#F0F2F5] rounded-full px-3 py-1.5 text-[14px] outline-none"
              autoFocus
            />
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-2 mt-1">
            {comment.replies.map(r => (
              <CommentRow
                key={r.id}
                comment={r}
                postId={postId}
                currentUserId={currentUserId}
                isLoggedIn={isLoggedIn}
                onDelete={onDelete}
                onReplyPosted={onReplyPosted}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReactorsModal({ postId, onClose }: { postId: string; onClose: () => void }) {
  const [reactors, setReactors] = useState<{ id: string; type: ReactionType; user: { id: string; name: string | null; image: string | null } }[] | null>(null);

  useState(() => {
    getPostReactors(postId).then(res => { if (res.success) setReactors(res.reactions); });
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-[400px] max-h-[70vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="relative flex items-center justify-center py-3 border-b border-[#DADDE1]">
          <h2 className="text-[17px] font-bold text-[#050505]">Reactions</h2>
          <button onClick={onClose} className="absolute right-3 w-7 h-7 rounded-full bg-[#E4E6EB] hover:bg-[#D8DADF] flex items-center justify-center">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {!reactors ? (
            <p className="text-center text-[#65676B] py-6 text-sm">Loading...</p>
          ) : reactors.length === 0 ? (
            <p className="text-center text-[#65676B] py-6 text-sm">No reactions yet.</p>
          ) : (
            reactors.map(r => {
              const meta = reactionMeta(r.type);
              return (
                <div key={r.id} className="flex items-center gap-3 px-3 py-2 hover:bg-[#F2F2F2] rounded-lg">
                  <div className="relative">
                    <Avatar name={r.user.name} image={r.user.image} />
                    <span className="absolute -bottom-1 -right-1 text-base leading-none">{meta?.emoji}</span>
                  </div>
                  <span className="text-[14px] font-semibold text-[#050505]">{r.user.name || "GoBike Rider"}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function PostCard({
  post,
  currentUserId,
  isLoggedIn,
}: {
  post: CommunityPostData;
  currentUserId?: string;
  isLoggedIn: boolean;
}) {
  const [reaction, setReaction] = useState<ReactionType | null>(post.reactions?.[0]?.type ?? null);
  const [reactionCount, setReactionCount] = useState(post.reactionCount);
  const [comments, setComments] = useState<CommentData[]>(post.comments);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [shareCount, setShareCount] = useState(post.shareCount);
  const [commentInput, setCommentInput] = useState("");
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [captionValue, setCaptionValue] = useState(post.caption || "");
  const [caption, setCaption] = useState(post.caption);
  const [isSaved, setIsSaved] = useState(false);
  const [showReactors, setShowReactors] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState((post.author.followers?.length ?? 0) > 0);
  const [isFollowPending, startFollowTransition] = useTransition();
  const [isPending, startTransition] = useTransition();

  const requireAuth = () => {
    if (!isLoggedIn) {
      toast.error("Please sign in to do that.");
      return false;
    }
    return true;
  };

  const handleReact = (type: ReactionType) => {
    if (!requireAuth()) return;
    const wasActive = reaction === type;
    const prevReaction = reaction;
    const prevCount = reactionCount;

    if (wasActive) {
      setReaction(null);
      setReactionCount(c => Math.max(0, c - 1));
    } else if (reaction) {
      setReaction(type);
    } else {
      setReaction(type);
      setReactionCount(c => c + 1);
    }

    startTransition(async () => {
      const res = await toggleReaction(post.id, type);
      if (!res.success) {
        setReaction(prevReaction);
        setReactionCount(prevCount);
        toast.error(res.message || "Failed to react.");
      }
    });
  };

  const handleComment = () => {
    if (!requireAuth()) return;
    const content = commentInput.trim();
    if (!content) return;
    setCommentInput("");

    startTransition(async () => {
      const res = await addComment(post.id, content);
      if (res.success && res.comment) {
        setComments(prev => [...prev, res.comment as CommentData]);
        setCommentCount(c => c + 1);
        setCommentsOpen(true);
      } else {
        toast.error(res.message || "Failed to add comment.");
      }
    });
  };

  const handleReplyPosted = (parentId: string, reply: CommentData) => {
    setComments(prev => prev.map(c => c.id === parentId ? { ...c, replies: [...(c.replies || []), reply] } : c));
    setCommentCount(c => c + 1);
  };

  const handleDeletePost = () => {
    if (!confirm("Delete this post?")) return;
    startTransition(async () => {
      const res = await deleteOwnPost(post.id);
      if (res.success) setIsDeleted(true);
      else toast.error(res.message || "Failed to delete post.");
    });
  };

  const handleSaveEditPost = () => {
    startTransition(async () => {
      const res = await editCommunityPost(post.id, { caption: captionValue });
      if (res.success) {
        setCaption(captionValue);
        setIsEditingPost(false);
      } else {
        toast.error(res.message || "Failed to update post.");
      }
    });
  };

  const handleDeleteComment = (commentId: string) => {
    startTransition(async () => {
      const res = await deleteOwnComment(commentId);
      if (res.success) {
        setComments(prev =>
          prev
            .filter(c => c.id !== commentId)
            .map(c => ({ ...c, replies: c.replies?.filter(r => r.id !== commentId) }))
        );
        setCommentCount(c => Math.max(0, c - 1));
      } else {
        toast.error(res.message || "Failed to delete comment.");
      }
    });
  };

  const handleReport = () => {
    if (!requireAuth()) return;
    const reason = prompt("Why are you reporting this post? (optional)") ?? "";
    startTransition(async () => {
      const res = await reportContent({ postId: post.id, reason });
      toast[res.success ? "success" : "error"](res.message || "Something went wrong.");
    });
  };

  const recordShare = () => {
    setShareCount(c => c + 1);
    incrementShareCount(post.id).catch(() => {});
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/community/${post.slug}`;

    // Mobile/OS-level native share sheet — shows WhatsApp, Messenger, Facebook, etc.
    // automatically for whatever's installed on the device, no app registration needed.
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "GoBike Community", text: caption || "Check out this post on GoBike Community", url });
        recordShare();
        return;
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
        // fall through to the desktop menu below on any other failure
      }
    }

    setShowShareMenu(v => !v);
  };

  const shareToWhatsApp = () => {
    const url = `${window.location.origin}/community/${post.slug}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer");
    recordShare();
    setShowShareMenu(false);
  };

  const shareToFacebook = () => {
    const url = `${window.location.origin}/community/${post.slug}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer");
    recordShare();
    setShowShareMenu(false);
  };

  const copyShareLink = async () => {
    const url = `${window.location.origin}/community/${post.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
      recordShare();
    } catch {
      toast.error("Couldn't copy link.");
    }
    setShowShareMenu(false);
  };

  const handleSave = () => {
    if (!requireAuth()) return;
    setIsSaved(v => !v);
    startTransition(async () => {
      const res = await toggleSavePost(post.id);
      if (res.success) toast.success(res.saved ? "Saved" : "Removed from saved");
      else { setIsSaved(v => !v); toast.error(res.message || "Failed."); }
    });
  };

  const handleFollowAuthor = () => {
    if (!requireAuth()) return;
    const wasFollowing = isFollowingAuthor;
    setIsFollowingAuthor(!wasFollowing);
    startFollowTransition(async () => {
      const res = await toggleFollow(post.author.id);
      if (!res.success) {
        setIsFollowingAuthor(wasFollowing);
        toast.error(res.message || "Failed to update follow status.");
      }
    });
  };

  if (isDeleted) return null;

  const visibleComments = showAllComments ? comments : comments.slice(-3);
  const active = reactionMeta(reaction);

  return (
    <article className="bg-white rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.1)] border border-[#DADDE1] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <Link href={`/community/profile/${post.author.id}`}>
            <Avatar name={post.author.name} image={post.author.image} />
          </Link>
          <div>
            <div className="flex items-center gap-1.5">
              <Link href={`/community/profile/${post.author.id}`} className="font-semibold text-[#050505] text-[15px] leading-tight hover:underline">
                {post.author.name || "GoBike Rider"}
              </Link>
              {currentUserId !== post.author.id && (
                <>
                  <span className="text-[#65676B] text-[13px]">·</span>
                  <button
                    onClick={handleFollowAuthor}
                    disabled={isFollowPending}
                    className="text-[13px] font-semibold hover:underline disabled:opacity-50"
                    style={{ color: isFollowingAuthor ? "#65676B" : "#1877F2" }}
                  >
                    {isFollowingAuthor ? "Following" : "Follow"}
                  </button>
                </>
              )}
            </div>
            <Link href={`/community/${post.slug}`} className="block text-[13px] text-[#65676B] hover:underline">
              {timeAgo(post.createdAt)} · 🌐
            </Link>
          </div>
        </div>
        <div className="relative shrink-0">
          <button onClick={() => setShowMenu(v => !v)} disabled={isPending} className="w-8 h-8 rounded-full hover:bg-[#F2F2F2] text-[#65676B] flex items-center justify-center" title="More options">
            ⋯
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg shadow-lg border border-[#DADDE1] py-1.5 z-20">
                <button
                  onClick={() => { setShowMenu(false); handleSave(); }}
                  disabled={isPending}
                  className="w-full text-left px-3 py-2 text-[14px] font-semibold text-[#050505] hover:bg-[#F2F2F2] flex items-center gap-2.5"
                >
                  <span className="text-lg leading-none">{isSaved ? "🔖" : "📑"}</span> {isSaved ? "Unsave post" : "Save post"}
                </button>
                {currentUserId === post.author.id && (
                  <>
                    <button
                      onClick={() => { setShowMenu(false); setIsEditingPost(v => !v); }}
                      disabled={isPending}
                      className="w-full text-left px-3 py-2 text-[14px] font-semibold text-[#050505] hover:bg-[#F2F2F2] flex items-center gap-2.5"
                    >
                      <span className="text-lg leading-none">✏️</span> Edit post
                    </button>
                    <button
                      onClick={() => { setShowMenu(false); handleDeletePost(); }}
                      disabled={isPending}
                      className="w-full text-left px-3 py-2 text-[14px] font-semibold text-red-600 hover:bg-[#F2F2F2] flex items-center gap-2.5"
                    >
                      <span className="text-lg leading-none">🗑️</span> Delete post
                    </button>
                  </>
                )}
                <button
                  onClick={() => { setShowMenu(false); handleReport(); }}
                  disabled={isPending}
                  className="w-full text-left px-3 py-2 text-[14px] font-semibold text-[#050505] hover:bg-[#F2F2F2] flex items-center gap-2.5"
                >
                  <span className="text-lg leading-none">🚩</span> Report post
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Caption / edit box */}
      {isEditingPost ? (
        <div className="px-4 pb-2 pt-1">
          <textarea
            value={captionValue}
            onChange={(e) => setCaptionValue(e.target.value)}
            rows={3}
            className="w-full resize-none border border-[#DADDE1] rounded-lg p-2 text-[15px] outline-none"
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-1.5">
            <button onClick={() => { setIsEditingPost(false); setCaptionValue(caption || ""); }} className="text-[13px] text-[#65676B] px-3 py-1">Cancel</button>
            <button onClick={handleSaveEditPost} disabled={isPending} className="text-[13px] font-bold text-white px-3 py-1 rounded-md" style={{ backgroundColor: FB_BLUE }}>Save</button>
          </div>
        </div>
      ) : (
        caption && (
          <div className="px-4 pb-2 pt-1 text-[15px] text-[#050505] whitespace-pre-wrap leading-[1.35]">
            <LinkifiedText text={caption} authorRole={post.author.role} allowEmbed suppressUrl={post.linkPreview?.url} />
          </div>
        )
      )}

      {/* Facebook link preview card */}
      {post.linkPreview && (post.linkPreview.title || post.linkPreview.image) && (
        <a
          href={post.linkPreview.url}
          target="_blank"
          rel="noopener noreferrer ugc nofollow"
          className="block mx-4 mb-2 rounded-lg overflow-hidden border border-[#DADDE1] hover:bg-[#F2F2F2] transition-colors"
        >
          {post.linkPreview.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.linkPreview.image} alt="" className="w-full aspect-[1.91/1] object-cover bg-black" />
          )}
          <div className="p-3">
            <p className="text-[11px] uppercase text-[#65676B] tracking-wide">facebook.com</p>
            {post.linkPreview.title && <p className="text-[15px] font-semibold text-[#050505] line-clamp-2">{post.linkPreview.title}</p>}
            {post.linkPreview.description && post.linkPreview.description !== post.linkPreview.title && (
              <p className="text-[13px] text-[#65676B] line-clamp-2 mt-0.5">{post.linkPreview.description}</p>
            )}
          </div>
        </a>
      )}

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {post.tags.map(tag => (
            <Link key={tag} href={`/community/tag/${tag}`} className="text-[13px] font-medium hover:underline" style={{ color: FB_BLUE }}>
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* Media */}
      {post.media.length > 0 && <MediaCarousel media={post.media} caption={caption} />}

      {/* Reaction / comment / share counts */}
      {(reactionCount > 0 || commentCount > 0 || shareCount > 0) && (
        <div className="flex items-center justify-between px-4 pt-2.5 pb-1 text-[13px] sm:text-[15px] text-[#65676B]">
          <button onClick={() => setShowReactors(true)} className="flex items-center gap-1 hover:underline disabled:no-underline" disabled={reactionCount === 0}>
            {active && <span className="text-base leading-none">{active.emoji}</span>}
            {reactionCount > 0 ? reactionCount : ""}
          </button>
          <div className="flex items-center gap-2.5">
            {commentCount > 0 && (
              <button onClick={() => setCommentsOpen(v => !v)} className="font-semibold hover:underline" style={{ color: "#45BD62" }}>
                {commentCount} comment{commentCount === 1 ? "" : "s"}
              </button>
            )}
            {shareCount > 0 && <span>{shareCount} share{shareCount === 1 ? "" : "s"}</span>}
          </div>
        </div>
      )}

      {/* Action bar — Like | Comment | Share, exactly 3 equal buttons */}
      <div className="grid grid-cols-3 gap-1 px-1 py-1 mt-1 border-t border-[#DADDE1]">
        <ReactionPicker activeType={reaction} onPick={handleReact} disabled={isPending} fullWidth />
        <button
          onClick={() => { setCommentsOpen(true); document.getElementById(`comment-input-${post.id}`)?.focus(); }}
          className="flex items-center justify-center gap-1 px-1 py-2 rounded-md text-[13px] sm:text-[15px] font-semibold text-[#65676B] hover:bg-[#F2F2F2] transition-colors whitespace-nowrap"
        >
          💬 Comment
        </button>
        <div className="relative">
          <button
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-1 px-1 py-2 rounded-md text-[13px] sm:text-[15px] font-semibold text-[#65676B] hover:bg-[#F2F2F2] transition-colors whitespace-nowrap"
          >
            ↗ Share
          </button>
          {showShareMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowShareMenu(false)} />
              <div className="absolute right-0 bottom-full mb-1 w-48 bg-white rounded-lg shadow-lg border border-[#DADDE1] py-1.5 z-20">
                <button onClick={shareToWhatsApp} className="w-full text-left px-3 py-2 text-[14px] font-semibold text-[#050505] hover:bg-[#F2F2F2] flex items-center gap-2.5">
                  <span className="text-lg leading-none">💬</span> WhatsApp
                </button>
                <button onClick={shareToFacebook} className="w-full text-left px-3 py-2 text-[14px] font-semibold text-[#050505] hover:bg-[#F2F2F2] flex items-center gap-2.5">
                  <span className="text-lg leading-none">📘</span> Facebook
                </button>
                <button onClick={copyShareLink} className="w-full text-left px-3 py-2 text-[14px] font-semibold text-[#050505] hover:bg-[#F2F2F2] flex items-center gap-2.5">
                  <span className="text-lg leading-none">🔗</span> Copy link
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Comments — visually collapsed by default (CSS only, not unmounted) so the
          text still renders in the HTML for search engines; opens on tap of the
          comment count or Comment button. */}
      {comments.length > 0 && (
        <div className={`px-4 pb-2 pt-2 space-y-2 border-t border-[#F0F2F5] ${commentsOpen ? "" : "hidden"}`}>
          {comments.length > 3 && !showAllComments && (
            <button onClick={() => setShowAllComments(true)} className="text-[13px] font-semibold text-[#65676B] hover:underline">
              View all {commentCount} comments
            </button>
          )}
          {visibleComments.map(c => (
            <CommentRow
              key={c.id}
              comment={c}
              postId={post.id}
              currentUserId={currentUserId}
              isLoggedIn={isLoggedIn}
              onDelete={handleDeleteComment}
              onReplyPosted={handleReplyPosted}
            />
          ))}
        </div>
      )}

      {/* Add comment */}
      <div className="flex items-center gap-2 px-4 pb-3 pt-2">
        <Avatar size={32} />
        <input
          id={`comment-input-${post.id}`}
          type="text"
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleComment(); }}
          placeholder={isLoggedIn ? "Write a comment..." : "Sign in to comment"}
          disabled={!isLoggedIn || isPending}
          className="flex-1 bg-[#F0F2F5] rounded-full px-4 py-2 text-[15px] outline-none focus:ring-2 disabled:opacity-60"
          style={{ ["--tw-ring-color" as string]: FB_BLUE }}
        />
        {commentInput.trim() && (
          <button
            onClick={handleComment}
            disabled={!isLoggedIn || isPending}
            className="text-[14px] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ color: FB_BLUE }}
          >
            Post
          </button>
        )}
      </div>

      {showReactors && <ReactorsModal postId={post.id} onClose={() => setShowReactors(false)} />}
    </article>
  );
}
