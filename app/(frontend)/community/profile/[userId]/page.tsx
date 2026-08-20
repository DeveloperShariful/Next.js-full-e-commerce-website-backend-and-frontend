import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import CommunityFeedClient from "../../_components/CommunityFeedClient";
import CommunityTopNav from "../../_components/CommunityTopNav";
import ProfileHeader from "../../_components/ProfileHeader";
import { getUserCommunityProfile } from "@/app/actions/frontend/community/community-social";
import type { CommunityPostData } from "../../_components/PostCard";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;
  const { profile } = await getUserCommunityProfile(userId);
  if (!profile) return {};
  return {
    title: `${profile.user.name || "GoBike Rider"} | GoBike Community`,
  };
}

export default async function CommunityProfilePage({ params }: Props) {
  const { userId } = await params;
  const result = await getUserCommunityProfile(userId);
  if (!result.success || !result.profile) notFound();

  const posts: CommunityPostData[] = result.posts;

  return (
    <div className="min-h-screen pb-[54px] md:pb-0" style={{ backgroundColor: "#F0F2F5", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <Breadcrumbs className="max-w-[1600px] mx-auto mt-1.5 mb-1.5 px-6 font-sans" />
      <CommunityTopNav />

      <div className="py-4 max-w-[680px] mx-auto px-3 sm:px-0">
        <Link href="/community" className="block text-[13px] text-[#65676B] hover:underline mb-2">← GoBike Community</Link>
        <ProfileHeader profile={result.profile} />
      </div>

      <CommunityFeedClient
        initialPosts={posts}
        initialCursor={result.nextCursor}
        loadMore={getUserCommunityProfile.bind(null, userId)}
        showComposer={false}
        emptyTitle="No posts yet"
        emptyBody={result.profile.isOwnProfile ? "Share your first post with the community!" : "This rider hasn't posted yet."}
      />
    </div>
  );
}
