import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import CommunityFeedClient from "../_components/CommunityFeedClient";
import CommunityTopNav from "../_components/CommunityTopNav";
import { getSavedPosts } from "@/app/actions/frontend/community/community-social";
import type { CommunityPostData } from "../_components/PostCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Saved Posts | GoBike Community" };

export default async function SavedPostsPage() {
  const result = await getSavedPosts();
  const posts: CommunityPostData[] = result.posts || [];

  return (
    <div className="min-h-screen pb-[54px] md:pb-0" style={{ backgroundColor: "#F0F2F5", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <Breadcrumbs className="max-w-[1600px] mx-auto mt-1.5 mb-1.5 px-6 font-sans" />
      <CommunityTopNav />

      <div className="max-w-[680px] mx-auto pt-4 px-3 sm:px-0">
        <Link href="/community" className="text-[13px] text-[#65676B] hover:underline">← GoBike Community</Link>
        <h1 className="text-[20px] font-bold text-[#050505]">🔖 Saved Posts</h1>
      </div>

      <div className="py-4">
        <CommunityFeedClient
          initialPosts={posts}
          initialCursor={result.nextCursor ?? null}
          loadMore={getSavedPosts}
          showComposer={false}
          emptyTitle="No saved posts"
          emptyBody="Tap the bookmark icon on any post to save it for later."
        />
      </div>
    </div>
  );
}
