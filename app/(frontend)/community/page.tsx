import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import CommunityFeedClient from "./_components/CommunityFeedClient";
import CommunityTopNav from "./_components/CommunityTopNav";
import ShopBikesLinks from "./_components/ShopBikesLinks";
import { getCommunityFeed } from "@/app/actions/frontend/community/community-actions";
import type { CommunityPostData } from "./_components/PostCard";

export const dynamic = "force-dynamic";

const TITLE = "GoBike Community | Share Your Ride";
const DESCRIPTION = "See what GoBike riders across Australia are up to — share your own photos and videos with the community.";
const URL = "https://gobike.au/community";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["GoBike community", "kids electric bike photos", "electric bike riders Australia", "GoBike riders"],
  alternates: { canonical: URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
    siteName: "GoBike Australia",
    type: "website",
    locale: "en_AU",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: TITLE,
  description: DESCRIPTION,
  url: URL,
  isPartOf: { "@type": "WebSite", name: "GoBike Australia", url: "https://gobike.au" },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://gobike.au" },
    { "@type": "ListItem", position: 2, name: "Community", item: URL },
  ],
};

export default async function CommunityPage() {
  const feed = await getCommunityFeed();
  const posts: CommunityPostData[] = feed.success ? feed.posts : [];

  return (
    <div className="min-h-screen pb-4 md:pb-0" style={{ backgroundColor: "#F0F2F5", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Breadcrumbs className="max-w-[1600px] mx-auto mt-1.5 mb-1.5 px-6 font-sans" />
      <CommunityTopNav />

      <div className="pt-1.5 pb-1 md:pt-4 md:pb-4">
        <div className="max-w-[680px] mx-auto px-3 sm:px-0">
          <h1 className="text-[20px] font-bold text-[#050505]">GoBike Community</h1>
          <p className="text-[14px] text-[#65676B] mt-1 mb-3">
            Real GoBike riders across Australia sharing photos and videos of their kids electric bikes in action —
            backyard laps, trail rides, and everyday adventures. See what other families are riding, or share your own.
          </p>
          <ShopBikesLinks />
        </div>
        <CommunityFeedClient initialPosts={posts} initialCursor={feed.success ? feed.nextCursor : null} loadMore={getCommunityFeed} />
      </div>
    </div>
  );
}
