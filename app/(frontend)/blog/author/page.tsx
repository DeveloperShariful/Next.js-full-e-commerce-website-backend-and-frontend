import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getAllBlogAuthors } from "@/app/actions/backend/blog/blog-actions";

const SITE_URL = "https://gobike.au";

export const metadata: Metadata = {
  title: "Our Authors — GoBike Blog",
  description: "Meet the writers behind the GoBike Australia blog — buying guides, safety tips and news for parents of kids' electric bikes.",
  alternates: { canonical: `${SITE_URL}/blog/author` },
  openGraph: {
    title: "Our Authors — GoBike Blog",
    description: "Meet the writers behind the GoBike Australia blog — buying guides, safety tips and news for parents of kids' electric bikes.",
    url: `${SITE_URL}/blog/author`,
    siteName: "GoBike Australia",
    type: "website",
  },
};

function jsonLdSafe(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export default async function AuthorsIndexPage() {
  const authors = await getAllBlogAuthors();
  const totalArticles = authors.reduce((sum, a) => sum + a._count.blogPosts, 0);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: "Authors", item: `${SITE_URL}/blog/author` },
    ],
  };

  // ItemList of Person entities — same @id ("#person") each author's own
  // profile page defines, so Google/AI systems resolve this list against the
  // richer Person node instead of treating each entry as a bare name.
  const authorsWithSlug = authors.filter((a) => a.slug);
  const itemListSchema = authorsWithSlug.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/blog/author#webpage`,
        url: `${SITE_URL}/blog/author`,
        name: "Our Authors — GoBike Blog",
        description: "Meet the writers behind the GoBike Australia blog.",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: authorsWithSlug.map((author, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "Person",
              "@id": `${SITE_URL}/blog/author/${author.slug}#person`,
              name: author.name || "GoBike Author",
              url: `${SITE_URL}/blog/author/${author.slug}`,
              ...(author.image ? { image: author.image } : {}),
            },
          })),
        },
      }
    : null;

  return (
    <div className="pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSafe(breadcrumbSchema) }} />
      {itemListSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSafe(itemListSchema) }} />
      )}

      <div className="max-w-[1300px] mx-auto px-4 pt-4">
        <Breadcrumbs pageTitle="Authors" />
      </div>

      {/* Hero banner — same dark gradient treatment as the individual author
          profile pages, for a consistent, professional look across the two */}
      <div className="max-w-[1300px] mx-auto px-4">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black px-6 py-14 md:py-20 text-center">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, #fff 0%, transparent 40%), radial-gradient(circle at 80% 70%, #fff 0%, transparent 40%)",
            }}
          />
          <div className="relative">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">GoBike Australia</span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mt-2 mb-3">Our Authors</h1>
            <p className="text-gray-300 text-base leading-relaxed max-w-[700px] mx-auto">
              Every guide on the GoBike blog is written by people who actually work on the product — not
              outsourced content. Meet the team behind the buying guides, safety tips and maintenance advice.
            </p>
            {totalArticles > 0 && (
              <div className="flex items-center justify-center gap-8 mt-8 pt-6 border-t border-white/10 max-w-[360px] mx-auto">
                <div>
                  <div className="text-2xl font-extrabold text-white">{authors.length}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Author{authors.length !== 1 ? "s" : ""}</div>
                </div>
                <div className="border-l border-white/10 pl-8">
                  <div className="text-2xl font-extrabold text-white">{totalArticles}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Article{totalArticles !== 1 ? "s" : ""} Published</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Why these bylines matter — real, generic-but-true editorial-trust
          content (E-E-A-T signal), not a fabricated formal editorial board */}
      <div className="max-w-[860px] mx-auto px-4 text-center mt-10 mb-4">
        <p className="text-sm text-gray-500 leading-relaxed">
          We name a real author on every post because we stand behind what we publish. Our writers work
          directly with GoBike&apos;s products, customers and support team, so what you read here comes from
          first-hand experience, not a content mill.
        </p>
      </div>

      <div className="max-w-[1300px] mx-auto px-4 mt-8">
        {authors.length === 0 ? (
          <p className="text-center text-gray-500">No authors found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[900px] mx-auto">
            {authors.map((author) => {
              const initials = (author.name || "GB")
                .split(" ")
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              const card = (
                <div className="relative flex flex-col items-center text-center p-6 pt-8 rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] group-hover:-translate-y-1 transition-all duration-300 bg-white h-full overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-gray-900 to-gray-600" />
                  {author.image ? (
                    <Image
                      src={author.image}
                      alt={author.name || "Author"}
                      width={76}
                      height={76}
                      className="rounded-full object-cover border-2 border-gray-200 mb-3"
                    />
                  ) : (
                    <div className="w-[76px] h-[76px] bg-black rounded-full flex items-center justify-center text-white text-xl font-bold mb-3">
                      {initials}
                    </div>
                  )}
                  <h2 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {author.name || "GoBike Author"}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {author._count.blogPosts} article{author._count.blogPosts !== 1 ? "s" : ""}
                  </p>
                  {author.bio && (
                    <p className="text-sm text-gray-600 mt-3 line-clamp-3 leading-relaxed">{author.bio}</p>
                  )}
                  {author.slug && (
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      View Profile
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                  )}
                </div>
              );

              return author.slug ? (
                <Link key={author.id} href={`/blog/author/${author.slug}`} className="group">
                  {card}
                </Link>
              ) : (
                <div key={author.id}>{card}</div>
              );
            })}
          </div>
        )}
      </div>

      {/* Outbound CTA — consistent with the individual author pages, sends
          real link equity from this listing page into the shop */}
      <div className="text-center mt-14">
        <Link
          href="/bikes"
          className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-blue-600 transition-colors"
        >
          Shop GoBike Electric Balance Bikes
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
