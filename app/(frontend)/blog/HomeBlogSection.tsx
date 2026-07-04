import Image from "next/image";
import Link from "next/link";
import { getPublishedBlogPosts } from "@/app/actions/backend/blog/blog-actions";

export async function HomeBlogSection() {
  const { posts } = await getPublishedBlogPosts({ page: 1, limit: 3 });
  if (!posts || posts.length === 0) return null;

  return (
    <section className="py-20 px-4 bg-white border-t border-gray-100">
      <div className="max-w-[1300px] mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-2">
              From the GoBike Blog
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
              Tips, Guides & News
            </h2>
          </div>
          <Link
            href="/blog"
            className="hidden md:inline-block text-sm font-bold text-black border-b-2 border-black pb-0.5 hover:text-gray-600 hover:border-gray-600 transition-colors"
          >
            View All Posts →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                <div className="relative aspect-video bg-gray-100 overflow-hidden">
                  {post.featuredImage ? (
                    <Image
                      src={post.featuredImage}
                      alt={post.featuredImageAlt || post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <span className="text-4xl">📝</span>
                    </div>
                  )}
                  {post.category && (
                    <span
                      className="absolute top-3 left-3 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md text-white"
                      style={{ backgroundColor: post.category.color ?? "#111" }}
                    >
                      {post.category.name}
                    </span>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <p className="text-xs text-gray-400 mb-2">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString("en-AU", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : ""}
                    {post.readTimeMinutes && ` · ${post.readTimeMinutes} min read`}
                  </p>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors flex-grow">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                      {post.excerpt}
                    </p>
                  )}
                  <span className="text-sm font-bold text-black group-hover:text-blue-600 transition-colors flex items-center gap-1 mt-auto">
                    {post.videoUrl ? "Watch Video" : "Read Article"}
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center md:hidden">
          <Link
            href="/blog"
            className="inline-block bg-black text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-gray-800 transition-colors"
          >
            View All Articles
          </Link>
        </div>
      </div>
    </section>
  );
}
