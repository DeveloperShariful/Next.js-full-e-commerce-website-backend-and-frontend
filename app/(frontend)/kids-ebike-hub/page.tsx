// app/kids-ebike-hub/page.tsx

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import Image from 'next/image';
import CategoryFilter from './category/_components/CategoryFilter';
import type { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';

// --- 100% SEO OPTIMIZED METADATA ---
export const metadata: Metadata = {
  title: 'GoBike Hub | Kids Electric Bike Videos, News & Tips Australia',
  description: "Explore the GoBike community. Watch customer videos, team rider action, track days, and read expert sizing guides for kids electric dirt bikes in Australia.",
  keywords: [
    'kids electric bike videos',
    'kids ebike australia news',
    'electric balance bike tips',
    'Stacyc alternative videos',
    'GoBike community',
    'childrens electric dirt bike'
  ],
  alternates: { 
    canonical: 'https://gobikes.au/kids-ebike-hub' 
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'GoBike Hub | Kids Electric Bike Videos & News',
    description: "Watch the latest GoBike customer videos, team rider action, and read expert sizing guides.",
    url: 'https://gobikes.au/kids-ebike-hub',
    siteName: 'GoBike Australia',
    images: [
      {
        url: 'https://gobikes.au/wp-content/uploads/2025/06/GOBIKE-Electric-Bike-for-kids-1.webp', // ব্র্যান্ডের একটি ভালো লোগো বা ব্যানার দিন
        width: 1200,
        height: 630,
        alt: 'GoBike Australia Hub - Kids E-Bike Videos',
      },
    ],
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GoBike Hub | Kids Electric Bike Videos & News',
    description: "Watch the latest GoBike customer videos, team rider action, and read expert sizing guides.",
  },
};

export default function HubFeedPage() {
  const hubDir = 'hub-posts';
  const fullPath = path.join(process.cwd(), hubDir);
  let posts: any[] = [];
  
  if (fs.existsSync(fullPath)) {
    const files = fs.readdirSync(fullPath);
    posts = files.map(filename => {
      const slug = filename.replace(/\.(md|mdx)$/, '');
      const markdownWithMeta = fs.readFileSync(path.join(hubDir, filename), 'utf-8');
      const { data: frontmatter } = matter(markdownWithMeta);
      return { slug, frontmatter };
    }).sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime());
  }

  // --- JSON-LD SCHEMA FOR GOOGLE (ItemList & CollectionPage) ---
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': 'GoBike Australia Hub',
    'description': 'A collection of videos, news, and guides about kids electric bikes.',
    'url': 'https://gobikes.au/kids-ebike-hub',
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
      {/* Inject Schema securely */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      <Breadcrumbs />
      
      <main className="max-w-[1400px] mx-auto py-16 px-4 font-sans mb-10">
        
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-black tracking-tight">The GoBike Hub</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Watch our latest customer videos, team rider highlights, track days, and expert sizing guides.</p>
        </header>

        {/* Responsive Filter (Mobile Dropdown & Desktop Pills) */}
        <CategoryFilter />

        {/* Grid Feed (Wrapped in Semantic HTML) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <article key={post.slug} className="h-full">
                <Link href={`/kids-ebike-hub/${post.slug}`} className="group bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                
                <div className="relative w-full aspect-[16/10] bg-gray-900 overflow-hidden flex items-center justify-center">
                    {post.frontmatter.thumbnail && (
                    <Image 
                        src={post.frontmatter.thumbnail} 
                        alt={post.frontmatter.title} 
                        title={post.frontmatter.title} // SEO Image Title
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
                    {post.frontmatter.category && (
                    <span className="absolute top-4 left-4 bg-black/80 backdrop-blur-md text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg z-20 shadow-sm border border-white/10">
                        {post.frontmatter.category}
                    </span>
                    )}
                </div>

                <div className="p-6 md:p-8 flex flex-col flex-grow bg-white">
                    <h2 className="text-xl md:text-2xl font-bold mb-3 text-gray-900 group-hover:text-blue-600 leading-snug line-clamp-2 transition-colors">
                    {post.frontmatter.title}
                    </h2>
                    {post.frontmatter.original_caption ? (
                    <p className="text-sm md:text-base text-gray-500 mb-6 line-clamp-2 italic leading-relaxed">"{post.frontmatter.original_caption}"</p>
                    ) : (
                    <p className="text-sm md:text-base text-gray-500 mb-6 line-clamp-2 leading-relaxed">{post.frontmatter.excerpt}</p>
                    )}
                    <span className="mt-auto font-bold text-black text-sm uppercase tracking-wide group-hover:text-blue-600 transition-colors flex items-center gap-2">
                    {post.frontmatter.video_url ? 'Watch Video' : 'Read Article'} <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                </div>
                </Link>
            </article>
          ))}
        </div>
      </main>

      {/* --- SEO CONTENT BLOCK AT THE BOTTOM (Crucial for ranking) --- */}
      <section className="bg-gray-50 border-t border-gray-200 py-16 px-4 mt-10">
         <div className="max-w-[1000px] mx-auto text-center text-gray-700 leading-relaxed">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Your Ultimate Hub for Kids Electric Bikes in Australia</h2>
            <p className="mb-4 text-lg">
               Welcome to the official <strong>GoBike Hub</strong>! This is where our community comes alive. Whether you are searching for real-life <strong>customer videos</strong>, action-packed track days from our team riders, or expert <strong>size guides</strong>, you will find it all right here. 
            </p>
            <p className="text-lg">
               Our mission is to help Australian parents make informed decisions when upgrading from a standard balance bike to a premium <strong>childrens electric dirt bike</strong>. Explore the feed above to see the **best kids electric bikes** in action, and join thousands of families building confidence on two wheels safely!
            </p>
         </div>
      </section>

    </div>
  );
}