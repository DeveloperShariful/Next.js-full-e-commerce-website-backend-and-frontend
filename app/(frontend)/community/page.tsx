import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import CommunityFeedClient from "./_components/CommunityFeedClient";
import CommunityTopNav from "./_components/CommunityTopNav";
import { getCommunityFeed } from "@/app/actions/frontend/community/community-actions";
import type { CommunityPostData } from "./_components/PostCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "GoBike Community | Share Your Ride",
  description: "See what GoBike riders across Australia are up to — share your own photos and videos with the community.",
  alternates: { canonical: "https://gobike.au/community" },
  openGraph: {
    title: "GoBike Community | Share Your Ride",
    description: "See what GoBike riders across Australia are up to — share your own photos and videos with the community.",
    url: "https://gobike.au/community",
    siteName: "GoBike Australia",
    type: "website",
  },
};

export default async function CommunityPage() {
  const feed = await getCommunityFeed();
  const posts: CommunityPostData[] = feed.success ? feed.posts : [];

  return (
    <div className="min-h-screen pb-[54px] md:pb-0" style={{ backgroundColor: "#F0F2F5", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <Breadcrumbs className="max-w-[1600px] mx-auto mt-1.5 mb-1.5 px-6 font-sans" />
      <CommunityTopNav />

      <div className="pt-1.5 pb-4 md:pt-4">
        <CommunityFeedClient initialPosts={posts} initialCursor={feed.success ? feed.nextCursor : null} loadMore={getCommunityFeed} />
      </div>
    </div>
  );
}
