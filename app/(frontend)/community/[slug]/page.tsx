import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { CommunityPostData } from "../_components/PostCard";
import CommunityPostClientWrapper from "../_components/CommunityPostClientWrapper";
import { getCommunityPostBySlug } from "@/app/actions/frontend/community/community-actions";

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

  return (
    <div className="min-h-screen pb-[54px] md:pb-0" style={{ backgroundColor: "#F0F2F5", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSafe(postSchema) }} />
      <Breadcrumbs className="max-w-[1600px] mx-auto mt-1.5 mb-1.5 px-6 font-sans" />
      <div className="max-w-[680px] mx-auto px-3 sm:px-0 py-6">
        <CommunityPostClientWrapper post={postData} />
      </div>
    </div>
  );
}
