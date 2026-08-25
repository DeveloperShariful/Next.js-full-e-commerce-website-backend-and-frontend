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
  const title = `Posts Tagged #${tag} | GoBike Community`;
  const description = `Posts tagged #${tag} on the GoBike Community.`;
  const url = `https://gobike.au/community/tag/${tag}`;
  return {
    title,
    description,
    keywords: [tag, "GoBike community", "GoBike riders"],
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "GoBike Australia", type: "website", locale: "en_AU" },
    twitter: { card: "summary", title, description },
  };
}

export default async function CommunityTagPage({ params }: Props) {
  const { tag } = await params;
  const feed = await getCommunityFeedByTag(tag);
  const posts: CommunityPostData[] = feed.success ? feed.posts : [];
  const url = `https://gobike.au/community/tag/${tag}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Posts Tagged #${tag} | GoBike Community`,
    description: `Posts tagged #${tag} on the GoBike Community.`,
    url,
    isPartOf: { "@type": "WebSite", name: "GoBike Australia", url: "https://gobike.au" },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://gobike.au" },
      { "@type": "ListItem", position: 2, name: "Community", item: "https://gobike.au/community" },
      { "@type": "ListItem", position: 3, name: `#${tag}`, item: url },
    ],
  };

  return (
    <div className="min-h-screen pb-[54px] md:pb-0" style={{ backgroundColor: "#F0F2F5", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
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
