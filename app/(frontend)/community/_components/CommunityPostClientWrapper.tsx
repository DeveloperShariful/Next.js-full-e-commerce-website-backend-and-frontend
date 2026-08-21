"use client";

import { useSession } from "next-auth/react";
import PostCard, { type CommunityPostData } from "./PostCard";

export default function CommunityPostClientWrapper({ post }: { post: CommunityPostData }) {
  const { data: session } = useSession();
  const currentUserId = (session?.user as { id?: string } | undefined)?.id;
  const isLoggedIn = !!session?.user;

  return <PostCard post={post} currentUserId={currentUserId} isLoggedIn={isLoggedIn} priorityMedia />;
}
