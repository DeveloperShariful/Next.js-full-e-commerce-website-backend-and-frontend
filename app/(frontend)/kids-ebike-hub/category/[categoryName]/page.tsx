//app/kids-ebike-hub/category/[categoryName]/page.tsx

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import Image from 'next/image';
import CategoryFilter from '../_components/CategoryFilter'; // Ensure correct path
import type { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';

type Props = { params: { categoryName: string } };

function slugify(text: string) {
  return text.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^\w-]+/g, '');
}

// --- 100% ADVANCED DYNAMIC SEO METADATA ---
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoryName } = await params;
  const formattedTitle = categoryName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const canonicalUrl = `https://gobikes.au/kids-ebike-hub/category/${categoryName}`;

  return {
    title: `${formattedTitle} | Kids Electric Bike Hub | GoBike Australia`,
    description: `Explore all ${formattedTitle} for kids electric dirt bikes and balance bikes. Watch videos, read tips, and join the GoBike Australia community.`,
    keywords: [`${formattedTitle.toLowerCase()} kids ebike`, `GoBike ${formattedTitle.toLowerCase()}`, 'electric balance bike australia'],
    alternates: { canonical: canonicalUrl },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${formattedTitle} - GoBike Hub`,
      description: `Browse the best ${formattedTitle} regarding kids electric bikes in Australia.`,
      url: canonicalUrl,
      siteName: 'GoBike Australia',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@GoBikeAU',
      title: `${formattedTitle} | Kids Electric Bike Hub | GoBike Australia`,
      description: `Explore all ${formattedTitle} for kids electric dirt bikes and balance bikes.`,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { categoryName } = await params;
  const hubDir = path.join('hub-posts');
  let posts: any[] = [];
  
  if (fs.existsSync(hubDir)) {
    const files = fs.readdirSync(hubDir);
    const allPosts = files.map(filename => {
      const slug = filename.replace(/\.(md|mdx)$/, '');
      const markdownWithMeta = fs.readFileSync(path.join(hubDir, filename), 'utf-8');
      const { data: frontmatter } = matter(markdownWithMeta);
      return { slug, frontmatter };
    });

    posts = allPosts.filter(post => 
        post.frontmatter.category && slugify(post.frontmatter.category) === categoryName
    ).sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime());
  }

  const displayName = categoryName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  // --- COLLECTION PAGE JSON-LD SCHEMA ---
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': `${displayName} - GoBike Hub`,
    'url': `https://gobikes.au/kids-ebike-hub/category/${categoryName}`,
    'mainEntity': {
      '@type': 'ItemList',
      'itemListElement': posts.map((post, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'url': `https://gobikes.au/kids-ebike-hub/${post.slug}`
      }))
    }
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumbs />

      <main className="max-w-[1400px] mx-auto py-16 px-4 font-sans mb-10">
        
        <header className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-black tracking-tight">{displayName}</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Explore all content related to {displayName} for our kids e-bike community.</p>
        </header>

        <CategoryFilter />

        {posts.length === 0 ? (
            <div className="text-center py-32 bg-gray-50 rounded-3xl border border-gray-100">
               <span className="text-4xl mb-4 block" aria-hidden="true">📭</span>
               <h2 className="text-2xl font-bold text-gray-900 mb-2">No posts found</h2>
               <p className="text-gray-500 text-lg">Check back later for updates in the {displayName} category.</p>
            </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, index) => (
              <article key={post.slug} className="h-full">
                  <Link href={`/kids-ebike-hub/${post.slug}`} className="group bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                  <div className="relative w-full aspect-[16/10] bg-gray-900 overflow-hidden flex items-center justify-center">
                    {post.frontmatter.thumbnail && (
                      <Image 
                        src={post.frontmatter.thumbnail} 
                        alt={post.frontmatter.title} 
                        title={post.frontmatter.title}
                        fill 
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={index < 4}
                        className="object-cover opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700" 
                      />
                    )}
                    {post.frontmatter.video_url && (
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="w-16 h-16 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors duration-300 shadow-xl group-hover:scale-110">
                            <span className="text-2xl ml-1 text-gray-900 group-hover:text-white">▶</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-6 md:p-8 flex flex-col flex-grow bg-white">
                    <h2 className="text-xl md:text-2xl font-bold mb-3 text-gray-900 group-hover:text-blue-600 leading-snug line-clamp-2 transition-colors">
                      {post.frontmatter.title}
                    </h2>
                    <p className="text-sm md:text-base text-gray-500 mb-6 line-clamp-2 leading-relaxed">{post.frontmatter.excerpt}</p>
                    <span className="mt-auto font-bold text-black text-sm uppercase tracking-wide group-hover:text-blue-600 transition-colors flex items-center gap-2">
                      Read More <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* --- DYNAMIC CATEGORY SEO BLOCK --- */}
      <section className="bg-gray-50 border-t border-gray-200 py-16 px-4 mt-10">
         <div className="max-w-[1000px] mx-auto text-center text-gray-700 leading-relaxed">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">More About {displayName} at GoBike</h2>
            <p className="mb-4 text-lg">
               You are currently viewing our <strong>{displayName}</strong> collection. At GoBike Australia, we are passionate about creating the ultimate riding experience for children. Whether you are exploring our Stacyc alternatives or looking for the safest <strong>kids electric bike</strong>, this section provides valuable insights and real-world examples.
            </p>
            <p className="text-lg">
               Browse through the content above to learn more, or head over to our main shop to view the full range of <strong>electric balance bikes</strong> designed specifically for Aussie conditions.
            </p>
         </div>
      </section>

    </div>
  );
}