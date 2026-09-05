import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getAuthorBySlug } from "@/app/actions/backend/blog/blog-actions";
import { getBlogSettings } from "@/app/actions/backend/blog/blog-settings-actions";

type Props = { params: Promise<{ slug: string }> };

const SITE_URL = "https://gobike.au";
// Same fallback used on the blog post page's "About the Author" box
// (post.authorBio || settings.defaultAuthorBio || this) — kept in sync so an
// author with no bio filled in on their User profile doesn't show one thing
// on the post and a blank profile page.
const FALLBACK_AUTHOR_BIO =
  "Australia's leading provider of premium electric balance bikes for kids — getting children outside and building real confidence.";

function socialPlatformLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("facebook.com")) return "Facebook";
    if (host.includes("instagram.com")) return "Instagram";
    if (host.includes("twitter.com") || host.includes("x.com")) return "X (Twitter)";
    if (host.includes("linkedin.com")) return "LinkedIn";
    if (host.includes("youtube.com")) return "YouTube";
    if (host.includes("tiktok.com")) return "TikTok";
    return host;
  } catch {
    return "Link";
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getAuthorBySlug(slug);
  if (!result) return { title: "Author Not Found | GoBike Blog" };

  const { author } = result;
  const settings = await getBlogSettings();
  const bio = author.bio || settings?.data?.defaultAuthorBio || FALLBACK_AUTHOR_BIO;
  const title = `${author.name || "Author"} — GoBike Blog`;
  const description = bio;
  const url = `${SITE_URL}/blog/author/${slug}`;

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
      images: author.image ? [{ url: author.image }] : undefined,
    },
  };
}

function jsonLdSafe(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params;
  const result = await getAuthorBySlug(slug);
  if (!result) notFound();

  const { author, posts } = result;
  const settings = await getBlogSettings();
  const bio = author.bio || settings?.data?.defaultAuthorBio || FALLBACK_AUTHOR_BIO;
  const authorUrl = `${SITE_URL}/blog/author/${slug}`;

  // Real, data-derived "expertise" signal — the topics this author actually
  // writes about, ranked by how many posts fall in each category. No
  // fabricated credentials, just what's true from their published work.
  const categoryCounts = new Map<string, { name: string; slug: string; count: number }>();
  posts.forEach((p) => {
    if (!p.category) return;
    const existing = categoryCounts.get(p.category.slug);
    if (existing) existing.count += 1;
    else categoryCounts.set(p.category.slug, { name: p.category.name, slug: p.category.slug, count: 1 });
  });
  const topCategories = Array.from(categoryCounts.values()).sort((a, b) => b.count - a.count);

  // Article schema (blog post pages) links its author.@id here by URL — same
  // entity, so Google connects the two instead of treating them as separate
  // unverified mentions. sameAs/jobTitle only included when actually true.
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${authorUrl}#person`,
    name: author.name || "GoBike Author",
    url: authorUrl,
    ...(author.image ? { image: author.image } : {}),
    description: bio,
    ...(author.socialLinks.length > 0 ? { sameAs: author.socialLinks } : {}),
    worksFor: { "@type": "Organization", name: "GoBike Australia", url: SITE_URL },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: "Authors", item: `${SITE_URL}/blog/author` },
      { "@type": "ListItem", position: 4, name: author.name || "Author", item: authorUrl },
    ],
  };

  return (
    <div className="pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdSafe([personSchema, breadcrumbSchema]) }}
      />

      <div className="max-w-[1300px] mx-auto px-4 pt-4">
        <Breadcrumbs pageTitle={author.name || "Author"} />
      </div>

      {/* Profile header — gradient banner with an overlapping avatar card */}
      <div className="max-w-[1300px] mx-auto px-4">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black h-32 md:h-40">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, #fff 0%, transparent 40%), radial-gradient(circle at 80% 70%, #fff 0%, transparent 40%)",
            }}
          />
        </div>

        <div className="flex flex-col items-center text-center -mt-14 md:-mt-16 px-4">
          <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
            {author.image ? (
              <Image src={author.image} alt={author.name || "Author"} fill className="object-cover" sizes="128px" />
            ) : (
              <div className="w-full h-full bg-black flex items-center justify-center text-white text-3xl font-bold">
                {(author.name || "GB")
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
            )}
          </div>

          <span className="mt-4 text-xs font-bold uppercase tracking-widest text-gray-400">
            GoBike Author
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-1 mb-3">
            {author.name || "GoBike Author"}
          </h1>
          <p className="text-gray-600 text-base leading-relaxed max-w-[700px]">{bio}</p>

          {author.socialLinks.length > 0 && (
            <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
              {author.socialLinks.map((link) => (
                <a
                  key={link}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-full hover:border-gray-900 hover:text-gray-900 transition-colors"
                >
                  {socialPlatformLabel(link)}
                </a>
              ))}
            </div>
          )}

          {/* Stats strip */}
          <div className="flex items-center justify-center gap-8 mt-8 pt-6 border-t border-gray-200 w-full max-w-[420px]">
            <div>
              <div className="text-2xl font-extrabold text-gray-900">{posts.length}</div>
              <div className="text-xs text-gray-500 mt-0.5">Article{posts.length !== 1 ? "s" : ""} Published</div>
            </div>
            {topCategories.length > 0 && (
              <div className="border-l border-gray-200 pl-8">
                <div className="text-2xl font-extrabold text-gray-900">{topCategories.length}</div>
                <div className="text-xs text-gray-500 mt-0.5">Topic{topCategories.length !== 1 ? "s" : ""} Covered</div>
              </div>
            )}
          </div>

          {/* Real, data-derived expertise text + topic links — not fabricated,
              just what their published posts actually show */}
          {topCategories.length > 0 && (
            <div className="mt-6 max-w-[700px]">
              <p className="text-sm text-gray-500">
                {author.name || "This author"} writes mainly about{" "}
                {topCategories.map((c, i) => (
                  <span key={c.slug}>
                    <Link href={`/blog?category=${c.slug}`} className="font-semibold text-gray-700 hover:text-blue-600 hover:underline">
                      {c.name}
                    </Link>
                    {i < topCategories.length - 2 ? ", " : i === topCategories.length - 2 ? " and " : ""}
                  </span>
                ))}{" "}
                on the GoBike blog.
              </p>
            </div>
          )}

          {/* Outbound CTA — sends real link equity from the author page into
              the shop, not just a decorative button */}
          <Link
            href="/bikes"
            className="inline-flex items-center gap-2 mt-8 bg-black text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-blue-600 transition-colors"
          >
            Shop GoBike Electric Balance Bikes
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* Their articles */}
      <div className="max-w-[1300px] mx-auto px-4 mt-14">
        <div className="mb-8 border-b border-gray-200 pb-3">
          <h2 className="text-2xl font-bold text-gray-900">
            Articles by {author.name || "this author"}
          </h2>
        </div>

        {posts.length === 0 ? (
          <p className="text-gray-500">No published articles yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow bg-white"
              >
                <div className="relative w-full aspect-[16/10] bg-gray-100 overflow-hidden">
                  {post.featuredImage ? (
                    <Image
                      src={post.featuredImage}
                      alt={post.featuredImageAlt || post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100" />
                  )}
                  {post.category && (
                    <span
                      className="absolute top-3 left-3 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md text-white z-10"
                      style={{
                        backgroundColor: post.category.color ?? "#111",
                        backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5))",
                        backgroundBlendMode: "multiply",
                      }}
                    >
                      {post.category.name}
                    </span>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-bold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
                      : ""}
                    {post.readTimeMinutes && ` · ${post.readTimeMinutes} min read`}
                  </p>
                  {post.excerpt && (
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{post.excerpt}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
