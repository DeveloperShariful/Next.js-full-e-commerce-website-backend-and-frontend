import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import BlogCategoryFilter from "./_components/BlogCategoryFilter";
import { getPublishedBlogPosts } from "@/app/actions/backend/blog/blog-actions";
import { getBlogSettings } from "@/app/actions/backend/blog/blog-settings-actions";

export const metadata: Metadata = {
  title: "GoBike Blog | Kids Electric Bike Tips, Safety & News Australia",
  description:
    "Read expert advice on childrens electric motorbikes, safety guides, and maintenance tips. The ultimate resource for electric cycles in Australia.",
  keywords: [
    "kids electric bike blog",
    "electric cycles australia",
    "childrens electric motorbikes",
    "balancing bikes guide",
    "electric childs motorbike tips",
    "australia electric bike news",
    "kids ebike safety",
  ],
  alternates: { canonical: "https://gobike.au/blog" },
  openGraph: {
    title: "GoBike Blog | Kids Electric Bike Tips, Safety & News Australia",
    description:
      "Expert tips, safety guides, and inspiring stories for your little rider's next big adventure.",
    url: "https://gobike.au/blog",
    siteName: "GoBike Australia",
    images: [
      {
        url: "https://gobikes.au/wp-content/uploads/2025/11/gobike-removable-battery-pack.jpg",
        width: 1200,
        height: 857,
        alt: "GoBike Australia Blog - Kids E-Bike Guides",
      },
    ],
    locale: "en_AU",
    type: "website",
  },
};

interface PageProps {
  searchParams: Promise<{ category?: string; page?: string }>;
}

export default async function NewBlogPage({ searchParams }: PageProps) {
  const { category, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));

  const settingsResult = await getBlogSettings();
  const settings = settingsResult?.data;
  const { posts, categories, pages } = await getPublishedBlogPosts({
    page,
    limit: settings?.postsPerPage ?? 12,
    categorySlug: category,
  });

  const heroImage =
    settings?.heroImage ||
    "https://gobikes.au/wp-content/uploads/2025/10/best-electric-bike-for-kids-australia-gobike.webp";

  const featuredPost = page === 1 && !category ? posts[0] ?? null : null;
  const gridPosts = page === 1 && !category ? posts.slice(1) : posts;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "GoBike Australia Blog",
      description: "Expert tips and guides about kids electric bikes and balancing bikes.",
      url: "https://gobike.au/blog",
      publisher: { "@id": "https://gobike.au/#organization" },
      blogPost: posts.map((p) => ({
        "@type": "BlogPosting",
        headline: p.title,
        description: p.excerpt,
        url: `https://gobike.au/blog/${p.slug}`,
        datePublished: p.publishedAt,
        image: p.featuredImage,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://gobike.au" },
        { "@type": "ListItem", position: 2, name: "Blog", item: "https://gobike.au/blog" },
      ],
    },
  ];

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumbs />

      {/* Hero Banner */}
      <div className="relative w-full h-[260px] md:h-[480px] mb-0 md:mb-12">
        <Image
          src={heroImage}
          alt="GoBike Blog"
          fill
          className="object-cover object-top md:object-[center_25%]"
          priority
        />
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight drop-shadow-lg">
            GoBike Expert Advice
          </h1>
          <p className="text-white/90 text-base md:text-xl font-medium max-w-[600px] drop-shadow-md">
            Tips, Safety Guides, News &amp; Reviews for Aussie Parents
          </p>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto mb-20 px-0 md:px-4 font-sans">

        {/* SEO Intro — only shown on page 1 with no category filter */}
        {page === 1 && !category && (
          <div className="mb-10 bg-gray-50 border border-gray-100 rounded-2xl p-2 md:p-8">
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-3">Kids Electric Bike Tips, Guides & News</h2>
            <p className="text-gray-600 leading-relaxed text-sm md:text-base mb-4">
              Welcome to the GoBike Australia blog — your go-to resource for everything about kids electric bikes, balance bikes and family riding adventures across Australia. Our expert team publishes in-depth safety guides, age-by-age buying advice, maintenance tips and real-world product reviews to help Australian parents make confident decisions. Whether you're choosing between the GoBike 12 and GoBike 16, learning how to care for a lithium-ion battery, or looking for the best riding locations near you, you'll find practical, well-researched content here.
            </p>
            <p className="text-gray-600 leading-relaxed text-sm md:text-base">
              From beginner balance bikes for toddlers aged 2–5, to high-performance electric dirt bikes for teenagers, our articles cover every stage of a young rider's journey. Browse by category to find guides on safety gear, skill progression, trail recommendations and how to get the most out of your GoBike electric bike. New articles are published regularly — bookmark this page or subscribe to our newsletter to stay up to date with the latest from GoBike Australia.
            </p>
          </div>
        )}

        {/* Category Filter — /shop-এর মতোই professional toolbar/dropdown filter */}
        {categories.length > 0 && <BlogCategoryFilter categories={categories} />}

        {posts.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-2xl font-bold text-gray-600 mb-4">No posts yet</p>
            <p className="text-gray-500">Check back soon for expert tips and guides.</p>
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {featuredPost && (
              <div className="mb-14">
                <div className="mb-6 border-b border-gray-200 pb-3">
                  <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-tight text-center">
                    Latest Post
                  </h2>
                </div>
                <Link
                  href={`/blog/${featuredPost.slug}`}
                  className="group flex flex-col md:flex-row bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 transition-all duration-300 hover:shadow-xl"
                >
                  {/* Image */}
                  <div className="relative w-full md:w-1/2 h-[280px] md:h-[420px] bg-gray-100 overflow-hidden">
                    {featuredPost.featuredImage ? (
                      <Image
                        src={featuredPost.featuredImage}
                        alt={featuredPost.featuredImageAlt || featuredPost.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        priority
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <span className="text-6xl">📝</span>
                      </div>
                    )}
                    {featuredPost.videoUrl && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-xl group-hover:bg-red-600 transition-colors duration-300">
                          <span className="text-2xl ml-1 text-gray-900 group-hover:text-white">▶</span>
                        </div>
                      </div>
                    )}
                    {featuredPost.category && (
                      <span
                        className="absolute top-4 left-4 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg text-white shadow-sm"
                        style={{
                          backgroundColor: featuredPost.category.color ?? "#111",
                          backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5))",
                          backgroundBlendMode: "multiply",
                        }}
                      >
                        {featuredPost.category.name}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                    <span className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-3">
                      {featuredPost.isPinned ? "Pinned Post" : "Latest Guide"}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-4 leading-tight group-hover:text-blue-600 transition-colors">
                      {featuredPost.title}
                    </h2>
                    <p className="text-sm text-gray-500 mb-5">
                      {featuredPost.publishedAt
                        ? new Date(featuredPost.publishedAt).toLocaleDateString("en-AU", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : ""}
                      {featuredPost.author?.name && ` • ${featuredPost.author.name}`}
                      {featuredPost.readTimeMinutes && ` • ${featuredPost.readTimeMinutes} min read`}
                    </p>
                    {featuredPost.excerpt && (
                      <p className="text-gray-700 text-base md:text-lg mb-8 line-clamp-3 leading-relaxed">
                        {featuredPost.excerpt}
                      </p>
                    )}
                    <div>
                      <span className="inline-block bg-black text-white px-8 py-3 rounded-md font-bold text-sm tracking-wide group-hover:bg-blue-600 transition-colors">
                        {featuredPost.videoUrl ? "WATCH VIDEO" : "READ MORE"}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Grid */}
            {gridPosts.length > 0 && (
              <>
                <div className="mb-8 border-b border-gray-200 pb-3">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {category ? "Posts" : "All Articles"}
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {gridPosts.map((post, index) => (
                    <article key={post.id}>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="group bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                      >
                        {/* Thumbnail */}
                        <div className="relative w-full aspect-[16/10] bg-gray-100 overflow-hidden">
                          {post.featuredImage ? (
                            <Image
                              src={post.featuredImage}
                              alt={post.featuredImageAlt || post.title}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              priority={index < 3}
                              className="object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                              <span className="text-4xl">📝</span>
                            </div>
                          )}
                          {post.videoUrl && (
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                              <div className="w-14 h-14 bg-white/95 rounded-full flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors duration-300 shadow-xl group-hover:scale-110">
                                <span className="text-xl ml-1 text-gray-900 group-hover:text-white">▶</span>
                              </div>
                            </div>
                          )}
                          {post.category && (
                            <span
                              className="absolute top-3 left-3 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md text-white z-20"
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

                        {/* Content */}
                        <div className="p-6 flex flex-col flex-grow bg-white">
                          <h2 className="text-lg md:text-xl font-bold mb-2 text-gray-900 group-hover:text-blue-600 leading-snug line-clamp-2 transition-colors">
                            {post.title}
                          </h2>
                          <p className="text-xs text-gray-600 mb-3">
                            {post.publishedAt
                              ? new Date(post.publishedAt).toLocaleDateString("en-AU", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : ""}
                            {post.readTimeMinutes && ` · ${post.readTimeMinutes} min read`}
                          </p>
                          {post.excerpt && (
                            <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed flex-grow">
                              {post.excerpt}
                            </p>
                          )}
                          <span className="mt-auto font-bold text-black text-sm uppercase tracking-wide group-hover:text-blue-600 transition-colors flex items-center gap-2">
                            {post.videoUrl ? "Watch Video" : "Read Article"}
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                          </span>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              </>
            )}

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex justify-center gap-2 mt-14">
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={`/blog?${category ? `category=${category}&` : ""}page=${p}`}
                    className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-sm border transition-colors ${
                      p === page
                        ? "bg-black text-white border-black"
                        : "bg-white text-gray-700 border-gray-300 hover:border-black"
                    }`}
                  >
                    {p}
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* SEO Content Block */}
        <section className="mt-24 pt-12 border-t border-gray-100">
          <div className="max-w-[900px] mx-auto text-center text-gray-600 leading-relaxed">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Your Guide to Kids Electric Cycles in Australia
            </h2>
            <p className="mb-4">
              Welcome to the official GoBike blog! Whether you are looking for maintenance tips for
              your <strong>electric childs motorbike</strong> or safety advice for{" "}
              <strong>balancing bikes</strong>, we have got you covered.
            </p>
            <p>
              Our goal is to educate Aussie parents on the benefits of{" "}
              <strong>australian electric bikes</strong>, helping you choose the perfect ride for
              your child, from toddlers to teens.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
