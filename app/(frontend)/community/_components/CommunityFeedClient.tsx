"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import PostComposer from "./PostComposer";
import PostCard, { type CommunityPostData } from "./PostCard";

interface FeedResult {
  success: boolean;
  posts: CommunityPostData[];
  nextCursor: string | null;
}

export default function CommunityFeedClient({
  initialPosts,
  initialCursor,
  loadMore,
  showComposer = true,
  emptyTitle = "No posts yet",
  emptyBody = "Be the first to share something with the community!",
}: {
  initialPosts: CommunityPostData[];
  initialCursor: string | null;
  loadMore: (cursor: string) => Promise<FeedResult>;
  showComposer?: boolean;
  emptyTitle?: string;
  emptyBody?: string;
}) {
  const { data: session } = useSession();
  const [posts, setPosts] = useState(initialPosts);
  const [cursor, setCursor] = useState(initialCursor);
  const [isPending, startTransition] = useTransition();

  const currentUserId = (session?.user as { id?: string } | undefined)?.id;
  const isLoggedIn = !!session?.user;

  const handleLoadMore = () => {
    if (!cursor) return;
    startTransition(async () => {
      const res = await loadMore(cursor);
      if (res.success) {
        setPosts(prev => [...prev, ...res.posts]);
        setCursor(res.nextCursor);
      }
    });
  };

  return (
    <div className="max-w-[680px] mx-auto px-3 sm:px-0">
      {showComposer && <PostComposer onPosted={(post) => setPosts(prev => [post, ...prev])} />}

      {posts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-[#DADDE1]">
          <p className="text-[17px] font-semibold text-[#050505] mb-1">{emptyTitle}</p>
          <p className="text-[15px] text-[#65676B]">{emptyBody}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <PostCard key={post.id} post={post} currentUserId={currentUserId} isLoggedIn={isLoggedIn} />
          ))}
        </div>
      )}

      {cursor && (
        <div className="text-center py-5">
          <button
            onClick={handleLoadMore}
            disabled={isPending}
            className="bg-white border border-[#DADDE1] rounded-full px-6 py-2 text-[14px] font-semibold text-[#050505] hover:bg-[#F2F2F2] disabled:opacity-50"
          >
            {isPending ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
