import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import {
  getBlogPostBySlug,
  getRelatedBlogPosts,
} from "@/app/actions/backend/blog/blog-actions";
import { getBlogSettings } from "@/app/actions/backend/blog/blog-settings-actions";
import { getApprovedComments } from "@/app/actions/backend/blog/blog-comment-actions";
import { BlogViewCounter } from "../_components/BlogViewCounter";
import { BlogComments } from "../_components/BlogComments";
import { CopyLinkButton } from "../_components/CopyLinkButton";

type Props = { params: Promise<{ slug: string }> };

const FALLBACK_TAKEAWAYS = [
  "Electric balance bikes teach real motor skills in a safe, low-pressure environment — far better than training wheels.",
  "Always look for adjustable speed limiters; parent-controlled safety is essential while kids are still learning.",
  "Genuine hydraulic suspension is a must for riding on grass, dirt, or uneven surfaces — avoid hard plastic bikes.",
  "Choose Lithium-ion batteries rated for 45–60 minutes of continuous ride time on a single charge.",
  "Buy from an Australian-based retailer for reliable warranty, local customer support, and spare-parts availability.",
];

const FALLBACK_AUTHOR_BIO =
  "Australia's leading provider of premium electric balance bikes for kids — getting children outside and building real confidence.";

const SHARE_CONFIG: Record<string, { label: string; bg: string; hover: string; href: (url: string, title: string) => string }> = {
  facebook: {
    label: "Facebook",
    bg: "bg-[#1877F2]",
    hover: "hover:bg-[#166fe5]",
    href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${url}`,
  },
  twitter: {
    label: "Twitter",
    bg: "bg-[#1DA1F2]",
    hover: "hover:bg-[#1a91da]",
    href: (url, title) => `https://twitter.com/intent/tweet?url=${url}&text=${encodeURIComponent(title)}`,
  },
  linkedin: {
    label: "LinkedIn",
    bg: "bg-[#0A66C2]",
    hover: "hover:bg-[#0958a8]",
    href: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
  },
  whatsapp: {
    label: "WhatsApp",
    bg: "bg-[#25D366]",
    hover: "hover:bg-[#1ebe57]",
    href: (url, title) => `https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + url)}`,
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractHeadingsFromHtml(html: string) {
  const headings: { level: number; text: string; id: string }[] = [];
  const regex = /<h([23])[^>]*>([\s\S]*?)<\/h[23]>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1]);
    const text = match[2].replace(/<[^>]+>/g, "").trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    headings.push({ level, text, id });
  }
  return headings;
}

function addHeadingIds(html: string): string {
  return html.replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (_, level, attrs, content) => {
      const text = content.replace(/<[^>]+>/g, "").trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
      return `<h${level}${attrs} id="${id}">${content}</h${level}>`;
    }
  );
}

// ─── Metadata ────────────────────────────────────────────────────────────────

const SITE_URL = "https://gobike.au";
const DEFAULT_IMAGE = "https://gobikes.au/wp-content/uploads/2025/09/Gobike-kids-electric-bike-ebike-for-kids-scaled.webp";
const PUBLISHER_LOGO = "https://gobikes.au/wp-content/uploads/2025/06/cropped-GOBIKE-Electric-Bike-for-kids-1.webp";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Post Not Found | GoBike Blog" };

  const postUrl = `${SITE_URL}/blog/${slug}`;
  const metaTitle  = post.metaTitle  || `${post.title} | GoBike Australia`;
  const metaDesc   = post.metaDesc   || post.excerpt || "";
  const ogImage    = post.ogImage    || post.featuredImage || DEFAULT_IMAGE;
  const ogTitle    = (post as Record<string, unknown>).ogTitle    as string | null || metaTitle;
  const ogDesc     = (post as Record<string, unknown>).ogDescription as string | null || metaDesc;
  const twTitle    = (post as Record<string, unknown>).twitterTitle as string | null || metaTitle;
  const twDesc     = (post as Record<string, unknown>).twitterDescription as string | null || metaDesc;
  const twCard     = ((post as Record<string, unknown>).twitterCard as string) || "summary_large_image";
  const canonical  = post.canonicalUrl || postUrl;
  const customRobots = (post as Record<string, unknown>).robots as string | null;

  return {
    title: metaTitle,
    description: metaDesc,
    keywords: post.tags?.length ? post.tags : undefined,
    alternates: { canonical },
    robots: post.noIndex
      ? { index: false, follow: false }
      : customRobots
        ? customRobots
        : { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large", "max-video-preview": -1 },
    openGraph: {
      title: ogTitle,
      description: ogDesc,
      url: postUrl,
      siteName: "GoBike Australia",
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
      locale: "en_AU",
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt?.toISOString(),
      authors: [post.author?.name || "GoBike Team"],
      tags: post.tags ?? [],
      section: (post.category as { name?: string } | null)?.name,
    },
    twitter: {
      card: twCard as "summary_large_image" | "summary",
      title: twTitle,
      description: twDesc,
      images: [ogImage],
    },
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function NewBlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const [relatedPosts, settingsResult, commentsResult] = await Promise.all([
    getRelatedBlogPosts(post.id, post.categoryId, post.relatedPostIds ?? [], 3),
    getBlogSettings(),
    getApprovedComments(post.id),
  ]);
  const settings = settingsResult?.data;
  const approvedComments = commentsResult.data ?? [];

  const keyTakeaways =
    post.keyTakeaways && post.keyTakeaways.length > 0
      ? post.keyTakeaways
      : settings?.defaultKeyTakeaways && settings.defaultKeyTakeaways.length > 0
      ? settings.defaultKeyTakeaways
      : FALLBACK_TAKEAWAYS;

  const authorBio =
    post.authorBio ||
    settings?.defaultAuthorBio ||
    FALLBACK_AUTHOR_BIO;

  const sharePlatforms: string[] =
    settings?.sharePlatforms && settings.sharePlatforms.length > 0
      ? settings.sharePlatforms
      : ["facebook", "twitter", "linkedin"];

  const shareEnabled = settings?.shareEnabled !== false;
  const commentsEnabled = settings?.commentsEnabled !== false;

  const postUrl = `${SITE_URL}/blog/${slug}`;
  const publishDate = post.publishedAt?.toISOString() ?? new Date().toISOString();
  const modifiedDate = post.updatedAt?.toISOString() ?? publishDate;

  const authorName = post.author?.name ?? "GoBike Team";
  const authorImage = post.author?.image ?? null;
  const authorInitials = authorName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const contentWithIds = addHeadingIds(post.content);
  const headings = extractHeadingsFromHtml(post.content);

  const metaTitle  = post.metaTitle  || `${post.title} | GoBike Australia`;
  const metaDesc   = post.metaDesc   || post.excerpt || "";
  const ogImage    = post.ogImage    || post.featuredImage || DEFAULT_IMAGE;
  const schemaType = (post as Record<string, unknown>).schemaType as string || "BlogPosting";
  const wordCount  = post.content.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;

  const mainSchema = {
    "@context": "https://schema.org",
    "@type": schemaType,
    headline: metaTitle,
    description: metaDesc,
    image: ogImage ? [{ "@type": "ImageObject", url: ogImage, width: 1200, height: 630 }] : [],
    datePublished: publishDate,
    dateModified: modifiedDate,
    author: { "@type": "Person", name: authorName, url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "GoBike Australia",
      logo: { "@type": "ImageObject", url: PUBLISHER_LOGO, width: 600, height: 60 },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
    url: postUrl,
    keywords: post.tags?.join(", ") || undefined,
    wordCount,
    inLanguage: "en-AU",
    articleSection: (post.category as { name?: string } | null)?.name || undefined,
    isPartOf: { "@id": `${SITE_URL}/blog` },
    // Read time as ISO 8601 duration
    ...(post.readTimeMinutes ? { timeRequired: `PT${post.readTimeMinutes}M` } : {}),
    // Comment count
    commentCount: approvedComments.length,
    // View count interaction
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/ViewAction",
      userInteractionCount: post.viewCount ?? 0,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: postUrl },
    ],
  };

  const videoSchema = post.videoUrl ? {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: post.title,
    description: metaDesc,
    thumbnailUrl: post.videoThumbnail || ogImage,
    uploadDate: publishDate,
    contentUrl: post.videoUrl,
    publisher: { "@type": "Organization", name: "GoBike Australia" },
  } : null;

  return (
    <div>
      {/* Separate <script> per schema — most compatible with Google */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(mainSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {videoSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }} />
      )}

      {/* Preload video */}
      {post.videoUrl && (
        <link rel="preload" as="video" href={post.videoUrl} type="video/mp4" />
      )}

      {/* View counter (client) */}
      <BlogViewCounter postId={post.id} />

      <Breadcrumbs pageTitle={post.title} />

      <div className="max-w-[1300px] mx-auto px-4 pb-16">

        {/* Title + meta */}
        <header className="max-w-[860px] mx-auto text-center pt-8 mb-8">
          {post.category && (
            <Link
              href={`/blog?category=${post.category.slug}`}
              className="inline-block mb-4 px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-full text-white"
              style={{
                backgroundColor: post.category.color ?? "#111",
                backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5))",
                backgroundBlendMode: "multiply",
              }}
            >
              {post.category.name}
            </Link>
          )}
          <h1 className="text-3xl md:text-4xl leading-tight mb-4 font-extrabold text-gray-900">
            {post.title}
          </h1>
          <p className="text-gray-500 text-sm md:text-base font-medium">
            By <span className="font-bold text-black">{authorName}</span>
            {post.publishedAt && (
              <>
                {" "}
                on{" "}
                {new Date(post.publishedAt).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </>
            )}
            {post.readTimeMinutes && (
              <span className="ml-2 text-gray-600">· {post.readTimeMinutes} min read</span>
            )}
          </p>
        </header>

        {/* Video or Featured Image */}
        {post.videoUrl ? (
          <div className="w-full mb-10 flex justify-center">
            <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-200 w-full max-h-[70vh] flex justify-center items-center">
              <video
                controls
                playsInline
                className="w-full max-h-[70vh] object-contain bg-black"
                poster={post.videoThumbnail || post.featuredImage || undefined}
                preload="auto"
              >
                <source src={post.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        ) : post.featuredImage ? (
          <div className="w-full mb-10 rounded-xl overflow-hidden bg-[#f0f0f0] shadow-sm">
            <Image
              src={post.featuredImage}
              alt={post.featuredImageAlt || post.title}
              title={post.title}
              width={1300}
              height={600}
              className="w-full h-auto max-h-[70vh] object-contain"
              priority
            />
          </div>
        ) : null}

        {/* 3-column layout */}
        <div className="flex gap-6 items-start">

          {/* LEFT: Table of Contents */}
          {headings.length > 0 && (
            <aside className="hidden lg:block w-[220px] xl:w-[240px] flex-shrink-0">
              <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm sticky top-24">
                <div className="bg-black px-4 py-3">
                  <p className="text-white text-[11px] font-bold tracking-widest uppercase">
                    Table of Contents
                  </p>
                </div>
                <nav className="bg-white px-4 py-4">
                  <ol className="space-y-2">
                    {headings.map((h, i) => (
                      <li key={i} className={h.level === 3 ? "pl-4" : ""}>
                        <a
                          href={`#${h.id}`}
                          className="flex gap-2 text-[13px] text-gray-700 hover:text-black transition-colors leading-snug group"
                        >
                          <span className="font-bold text-yellow-500 group-hover:text-black flex-shrink-0 w-5">
                            {i + 1}.
                          </span>
                          <span className="group-hover:underline">{h.text}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              </div>
            </aside>
          )}

          {/* CENTER: Content */}
          <article className="flex-1 min-w-0">

            {/* TOC mobile */}
            {headings.length > 0 && (
              <div className="lg:hidden mb-8 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <div className="bg-black px-4 py-3">
                  <p className="text-white text-[11px] font-bold tracking-widest uppercase">
                    Table of Contents
                  </p>
                </div>
                <nav className="bg-white px-4 py-4">
                  <ol className="space-y-2">
                    {headings.map((h, i) => (
                      <li key={i} className={h.level === 3 ? "pl-4" : ""}>
                        <a
                          href={`#${h.id}`}
                          className="flex gap-2 text-[13px] text-gray-700 hover:text-black transition-colors leading-snug group"
                        >
                          <span className="font-bold text-yellow-500 flex-shrink-0 w-5">{i + 1}.</span>
                          <span className="group-hover:underline">{h.text}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {post.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Key Takeaways */}
            {keyTakeaways.length > 0 && (
              <div className="mb-10 border-l-4 border-yellow-400 bg-white rounded-r-xl px-6 py-5 shadow-sm">
                <p className="text-[11px] font-bold tracking-widest uppercase text-yellow-600 mb-4">
                  Key Takeaways
                </p>
                <ul className="space-y-3">
                  {keyTakeaways.map((point: string, i: number) => (
                    <li key={i} className="flex gap-3 text-[15px] text-gray-800 leading-snug">
                      <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0 mt-[7px]" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Article Content */}
            <div
              className="
                prose prose-lg max-w-none
                text-[#333] text-[1.05rem] leading-[1.85]
                [&_h1]:font-extrabold [&_h1]:text-gray-900 [&_h1]:mt-10 [&_h1]:mb-4 [&_h1]:text-3xl
                [&_h2]:font-extrabold [&_h2]:text-gray-900 [&_h2]:mt-12 [&_h2]:mb-5 [&_h2]:text-2xl [&_h2]:border-b [&_h2]:border-gray-100 [&_h2]:pb-2
                [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-8 [&_h3]:mb-4 [&_h3]:text-xl
                [&_p]:mb-6
                [&_a]:text-blue-600 [&_a]:font-semibold [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-blue-800
                [&_strong]:font-bold [&_strong]:text-black
                [&_ul]:pl-6 [&_ul]:mb-6 [&_ul]:list-disc
                [&_ol]:pl-6 [&_ol]:mb-6 [&_ol]:list-decimal
                [&_li]:mb-2
                [&_blockquote]:ml-0 [&_blockquote]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-black [&_blockquote]:italic [&_blockquote]:bg-gray-50 [&_blockquote]:py-2 [&_blockquote]:rounded-r-lg [&_blockquote]:text-gray-700
                [&_img]:rounded-xl [&_img]:shadow-sm [&_img]:max-w-full
                [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-gray-200 [&_td]:px-4 [&_td]:py-2 [&_th]:border [&_th]:border-gray-200 [&_th]:px-4 [&_th]:py-2 [&_th]:bg-gray-50 [&_th]:font-bold
              "
              dangerouslySetInnerHTML={{ __html: contentWithIds }}
            />

            {/* Share */}
            {shareEnabled && sharePlatforms.length > 0 && (
              <div className="mt-16 py-8 border-y border-gray-200 flex flex-col md:flex-row items-center justify-between gap-6">
                <span className="text-lg font-bold text-gray-900">Share this article:</span>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                  {sharePlatforms.filter((p) => SHARE_CONFIG[p]).map((platform) => {
                    const cfg = SHARE_CONFIG[platform];
                    return (
                      <a
                        key={platform}
                        href={cfg.href(postUrl, post.title)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex-1 md:flex-none text-center px-6 py-2.5 ${cfg.bg} text-white rounded-lg text-sm font-semibold ${cfg.hover} transition-colors`}
                      >
                        {cfg.label}
                      </a>
                    );
                  })}
                  {sharePlatforms.includes("copy") && (
                    <CopyLinkButton url={postUrl} />
                  )}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="my-16 p-8 md:p-12 bg-black rounded-3xl text-center text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10">
                <h3 className="text-3xl md:text-4xl font-extrabold mb-4">
                  Ready to start the adventure?
                </h3>
                <p className="text-gray-300 mb-8 max-w-[500px] mx-auto text-lg">
                  Shop Australia&apos;s best-rated electric bikes for kids. Built for safety,
                  engineered for fun.
                </p>
                <Link
                  href="/bikes"
                  className="inline-block bg-white text-black px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-200 transition-all hover:scale-105 shadow-lg"
                >
                  Shop All Bikes →
                </Link>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/20 blur-3xl rounded-full" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/20 blur-3xl rounded-full" />
            </div>

            {/* Author — mobile */}
            <div className="mt-8 lg:hidden p-6 bg-gray-50 rounded-2xl flex flex-col sm:flex-row items-center gap-5 border border-gray-200">
              {authorImage ? (
                <Image
                  src={authorImage}
                  alt={authorName}
                  width={64}
                  height={64}
                  className="rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {authorInitials}
                </div>
              )}
              <div className="text-center sm:text-left">
                <h4 className="text-lg font-bold text-gray-900 mb-0.5">{authorName}</h4>
                <p className="text-sm text-gray-500 mb-2">GoBike Australia</p>
                <p className="text-sm text-gray-600 leading-relaxed">{authorBio}</p>
              </div>
            </div>
            {/* Comments */}
            <BlogComments
              postId={post.id}
              comments={approvedComments}
              commentsEnabled={commentsEnabled}
            />
          </article>

          {/* RIGHT: Author */}
          <aside className="hidden lg:block w-[220px] xl:w-[240px] flex-shrink-0">
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm sticky top-24">
              <div className="bg-black px-4 py-3">
                <p className="text-white text-[11px] font-bold tracking-widest uppercase">
                  About the Author
                </p>
              </div>
              <div className="bg-white px-4 py-6 flex flex-col items-center text-center gap-3">
                {authorImage ? (
                  <Image
                    src={authorImage}
                    alt={authorName}
                    width={64}
                    height={64}
                    className="rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {authorInitials}
                  </div>
                )}
                <div>
                  <p className="font-bold text-gray-900 text-[15px]">{authorName}</p>
                  <p className="text-[12px] text-gray-500 mt-0.5 mb-2">GoBike Australia</p>
                  <p className="text-[12px] text-gray-600 leading-relaxed">{authorBio}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="bg-gray-50 py-20 px-4 border-t border-gray-200">
          <div className="max-w-[1100px] mx-auto">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Recommended Reading</h2>
                <p className="text-gray-600 text-lg">Explore more tips and guides for young riders.</p>
              </div>
              <Link
                href="/blog"
                className="text-blue-600 font-bold hover:underline mb-1 hidden md:block text-lg"
              >
                View all posts →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedPosts.map((rp) => (
                <Link key={rp.id} href={`/blog/${rp.slug}`} className="group">
                  <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all h-full flex flex-col">
                    <div className="relative aspect-video bg-gray-100">
                      {rp.featuredImage ? (
                        <Image
                          src={rp.featuredImage}
                          alt={rp.featuredImageAlt || rp.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-3xl">📝</span>
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                        {rp.title}
                      </h3>
                      {rp.excerpt && (
                        <p className="text-gray-600 text-sm line-clamp-3 mb-6 flex-grow">{rp.excerpt}</p>
                      )}
                      <span className="text-sm font-bold text-blue-600 mt-auto flex items-center gap-1 group-hover:gap-2 transition-all">
                        Read Full Article <span>→</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-10 text-center md:hidden">
              <Link
                href="/blog"
                className="inline-block bg-white border border-gray-300 text-black px-8 py-3 rounded-full font-bold shadow-sm"
              >
                View All Articles
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
