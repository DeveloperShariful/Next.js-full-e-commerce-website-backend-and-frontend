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
  const { profile, posts } = await getUserCommunityProfile(userId);
  if (!profile) return {};

  const name = profile.user.name || "GoBike Rider";
  const title = `${name} | GoBike Community`;
  const description = `See ${name}'s photos and videos on the GoBike Community — ${profile.followerCount} followers, ${profile.followingCount} following.`;
  const url = `https://gobike.au/community/profile/${userId}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "GoBike Australia",
      type: "profile",
      locale: "en_AU",
      images: profile.user.image ? [{ url: profile.user.image }] : undefined,
    },
    twitter: { card: "summary", title, description },
    // A profile with no posts is a thin, near-empty page — no reason for it to
    // compete for search visibility (it's still perfectly reachable/linkable).
    robots: { index: (posts?.length ?? 0) > 0, follow: true },
  };
}

export default async function CommunityProfilePage({ params }: Props) {
  const { userId } = await params;
  const result = await getUserCommunityProfile(userId);
  if (!result.success || !result.profile) notFound();

  const posts: CommunityPostData[] = result.posts;
  const name = result.profile.user.name || "GoBike Rider";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    dateCreated: result.profile.user.createdAt,
    mainEntity: {
      "@type": "Person",
      name,
      image: result.profile.user.image || undefined,
      url: `https://gobike.au/community/profile/${userId}`,
      interactionStatistic: [
        { "@type": "InteractionCounter", interactionType: "https://schema.org/FollowAction", userInteractionCount: result.profile.followerCount },
      ],
    },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://gobike.au" },
      { "@type": "ListItem", position: 2, name: "Community", item: "https://gobike.au/community" },
      { "@type": "ListItem", position: 3, name, item: `https://gobike.au/community/profile/${userId}` },
    ],
  };

  return (
    <div className="min-h-screen pb-[54px] md:pb-0" style={{ backgroundColor: "#F0F2F5", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
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
