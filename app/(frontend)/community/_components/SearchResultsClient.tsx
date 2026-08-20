"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Avatar } from "./PostCard";
import PostCard, { type CommunityPostData } from "./PostCard";

interface UserResult { id: string; name: string | null; image: string | null }

export default function SearchResultsClient({
  posts,
  users,
  query,
}: {
  posts: CommunityPostData[];
  users: UserResult[];
  query: string;
}) {
  const { data: session } = useSession();
  const currentUserId = (session?.user as { id?: string } | undefined)?.id;
  const isLoggedIn = !!session?.user;

  if (posts.length === 0 && users.length === 0) {
    return (
      <div className="max-w-[680px] mx-auto text-center py-20 bg-white rounded-lg border border-[#DADDE1]">
        <p className="text-[17px] font-semibold text-[#050505] mb-1">No results for &quot;{query}&quot;</p>
        <p className="text-[15px] text-[#65676B]">Try a different search term.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[680px] mx-auto space-y-4">
      {users.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-[#DADDE1] p-3">
          <h2 className="text-[13px] font-bold text-[#65676B] uppercase mb-2 px-1">People</h2>
          <div className="space-y-1">
            {users.map(u => (
              <Link key={u.id} href={`/community/profile/${u.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F2F2F2]">
                <Avatar name={u.name} image={u.image} size={40} />
                <span className="text-[15px] font-semibold text-[#050505]">{u.name || "GoBike Rider"}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {posts.length > 0 && (
        <div className="space-y-3">
          {users.length > 0 && <h2 className="text-[13px] font-bold text-[#65676B] uppercase px-1">Posts</h2>}
          {posts.map(post => (
            <PostCard key={post.id} post={post} currentUserId={currentUserId} isLoggedIn={isLoggedIn} />
          ))}
        </div>
      )}
    </div>
  );
}
