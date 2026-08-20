import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import CommunityFeedClient from "../../_components/CommunityFeedClient";
import CommunityTopNav from "../../_components/CommunityTopNav";
import { getCommunityFeedByTag } from "@/app/actions/frontend/community/community-actions";
import type { CommunityPostData } from "../../_components/PostCard";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ tag: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  return {
    title: `#${tag} | GoBike Community`,
    description: `Posts tagged #${tag} on the GoBike Community.`,
    alternates: { canonical: `https://gobike.au/community/tag/${tag}` },
  };
}

export default async function CommunityTagPage({ params }: Props) {
  const { tag } = await params;
  const feed = await getCommunityFeedByTag(tag);
  const posts: CommunityPostData[] = feed.success ? feed.posts : [];

  return (
    <div className="min-h-screen pb-[54px] md:pb-0" style={{ backgroundColor: "#F0F2F5", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <Breadcrumbs className="max-w-[1600px] mx-auto mt-1.5 mb-1.5 px-6 font-sans" />
      <CommunityTopNav />

      <div className="max-w-[680px] mx-auto pt-4 px-3 sm:px-0">
        <Link href="/community" className="text-[13px] text-[#65676B] hover:underline">← GoBike Community</Link>
        <h1 className="text-[20px] font-bold text-[#050505]">#{tag}</h1>
      </div>

      <div className="py-4">
        <CommunityFeedClient
          initialPosts={posts}
          initialCursor={feed.success ? feed.nextCursor : null}
          loadMore={getCommunityFeedByTag.bind(null, tag)}
          showComposer={false}
          emptyTitle={`No posts tagged #${tag} yet`}
          emptyBody="Be the first to post with this tag!"
        />
      </div>
    </div>
  );
}
