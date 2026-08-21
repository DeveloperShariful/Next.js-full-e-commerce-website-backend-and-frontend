import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { CommunityPostData } from "../_components/PostCard";
import CommunityPostClientWrapper from "../_components/CommunityPostClientWrapper";
import ShopBikesLinks from "../_components/ShopBikesLinks";
import { getCommunityPostBySlug, getMorePostsByAuthor } from "@/app/actions/frontend/community/community-actions";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { post } = await getCommunityPostBySlug(slug);
  if (!post) return {};

  const url = `https://gobike.au/community/${slug}`;
  const title = post.metaTitle || "GoBike Community Post";
  const description = post.metaDesc || "Shared on the GoBike Community — see what our riders are up to.";
  const images = post.ogImage ? [{ url: post.ogImage, width: 1200, height: 630 }] : undefined;

  return {
    title,
    description,
    keywords: post.tags.length > 0 ? post.tags : undefined,
    authors: post.author.name ? [{ name: post.author.name }] : undefined,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "GoBike Australia",
      type: "article",
      locale: "en_AU",
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: post.author.name ? [post.author.name] : undefined,
      tags: post.tags.length > 0 ? post.tags : undefined,
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images: post.ogImage ? [post.ogImage] : undefined,
    },
  };
}

function jsonLdSafe(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export default async function CommunityPostPage({ params }: Props) {
  const { slug } = await params;
  const { post } = await getCommunityPostBySlug(slug);
  if (!post) notFound();
  const postData: CommunityPostData = post;

  const morePosts = (await getMorePostsByAuthor(post.author.id, post.id)).posts;

  const url = `https://gobike.au/community/${slug}`;
  const postSchema = {
    "@context": "https://schema.org",
    "@type": "SocialMediaPosting",
    headline: post.metaTitle || "GoBike Community Post",
    text: post.caption || undefined,
    image: post.ogImage || undefined,
    url,
    datePublished: post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Person", name: post.author.name || "GoBike Rider" },
    interactionStatistic: [
      { "@type": "InteractionCounter", interactionType: "https://schema.org/LikeAction", userInteractionCount: post.reactionCount },
      { "@type": "InteractionCounter", interactionType: "https://schema.org/CommentAction", userInteractionCount: post.commentCount },
      { "@type": "InteractionCounter", interactionType: "https://schema.org/ShareAction", userInteractionCount: post.shareCount },
    ],
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://gobike.au" },
      { "@type": "ListItem", position: 2, name: "Community", item: "https://gobike.au/community" },
      { "@type": "ListItem", position: 3, name: post.metaTitle || "Post", item: url },
    ],
  };

  // Google indexes VideoObject separately from the generic SocialMediaPosting type
  // above (it's the type that's actually eligible for Google Video search results),
  // so any post with a video gets its own entry pointing at the same clip.
  const videoMedia = post.media.find(m => m.mediaType === "VIDEO");
  const videoSchema = videoMedia
    ? {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: post.metaTitle || "GoBike Community Post",
        description: post.metaDesc || "Shared on the GoBike Community.",
        thumbnailUrl: [videoMedia.url.replace(/\.[a-zA-Z0-9]+$/, ".jpg")],
        uploadDate: post.createdAt.toISOString(),
        contentUrl: videoMedia.url,
        publisher: { "@type": "Organization", name: "GoBike Australia", url: "https://gobike.au" },
      }
    : null;

  return (
    <div className="min-h-screen pb-[54px] md:pb-0" style={{ backgroundColor: "#F0F2F5", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSafe(postSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSafe(breadcrumbSchema) }} />
      {videoSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSafe(videoSchema) }} />}
      <h1 className="sr-only">{post.metaTitle || "GoBike Community Post"}</h1>
      <Breadcrumbs className="max-w-[1600px] mx-auto mt-1.5 mb-1.5 px-6 font-sans" />
      <div className="max-w-[680px] mx-auto px-3 sm:px-0 py-6">
        <CommunityPostClientWrapper post={postData} />

        {morePosts.length > 0 && (
          <div className="bg-white rounded-lg border border-[#DADDE1] p-4 mt-4">
            <p className="text-[13px] font-bold text-[#65676B] uppercase tracking-wide mb-2.5">More from {post.author.name || "this rider"}</p>
            <ul className="space-y-2">
              {morePosts.map(p => (
                <li key={p.slug}>
                  <Link href={`/community/${p.slug}`} className="text-[14px] font-medium hover:underline" style={{ color: "#1877F2" }}>
                    {p.metaTitle || p.caption || "View post"}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href={`/community/profile/${post.author.id}`} className="inline-block mt-3 text-[13px] font-semibold text-[#65676B] hover:underline">
              See all posts from {post.author.name || "this rider"} →
            </Link>
          </div>
        )}

        <ShopBikesLinks />
      </div>
    </div>
  );
}
