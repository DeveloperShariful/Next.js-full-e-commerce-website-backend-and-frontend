// app/blog/page.tsx

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import Image from 'next/image';
import Breadcrumbs from '../../../components/Breadcrumbs';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GoBike Blog | Kids Electric Bike Tips, Safety & News Australia',
  description: "Read expert advice on childrens electric motorbikes, safety guides, and maintenance tips. The ultimate resource for electric cycles in Australia.",
  keywords: [
    'kids electric bike blog',
    'electric cycles australia',
    'childrens electric motorbikes',
    'balancing bikes guide',
    'electric childs motorbike tips',
    'australia electric bike news',
    'kids ebike safety'
  ],
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'GoBike Blog | Kids Electric Bike Tips, Safety & News Australia',
    description: "Expert tips, safety guides, and inspiring stories for your little rider's next big adventure.",
    url: 'https://gobike.au/blog',
    siteName: 'GoBike Australia',
    images: [
      {
        url: 'https://gobikes.au/wp-content/uploads/2025/11/gobike-removable-battery-pack.jpg', 
        width: 1200,
        height: 857,
        alt: 'GoBike Australia Blog - Kids E-Bike Guides',
      },
    ],
    locale: 'en_AU',
    type: 'website',
  },
};

export default function BlogPage() {
  const blogDir = 'blogs';
  const fullPath = path.join(process.cwd(), blogDir);
  let posts: any[] = [];
  
  if (fs.existsSync(fullPath)) {
    const files = fs.readdirSync(fullPath);
    posts = files.map(filename => {
      const slug = filename.replace(/\.(md|mdx)$/, '');
      const markdownWithMeta = fs.readFileSync(path.join(blogDir, filename), 'utf-8');
      const { data: frontmatter } = matter(markdownWithMeta);

      return {
        slug,
        frontmatter,
      };
    }).sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime());
  }

  // --- Logic for Featured Post (Newest Post) and Remaining Posts ---
  const featuredPost = posts.length > 0 ? posts[0] : null;
  const remainingPosts = posts.length > 1 ? posts.slice(1) : [];

  // --- Blog Schema (Collection) ---
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    'name': 'GoBike Australia Blog',
    'description': 'Expert tips and guides about kids electric bikes and balancing bikes.',
    'url': 'https://gobike.au/blog',
    'blogPost': posts.map(post => ({
      '@type': 'BlogPosting',
      'headline': post.frontmatter.title,
      'description': post.frontmatter.excerpt,
      'url': `https://gobike.au/blog/${post.slug}`,
      'datePublished': post.frontmatter.date,
      'image': post.frontmatter.cover_image
    }))
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <Breadcrumbs />

      {/* --- 1. NEW TOP HERO BANNER (Fixed for Head-Crops) --- */}
      <div className="relative w-full h-[300px] md:h-[550px] mb-12">
        <Image 
          src="https://gobikes.au/wp-content/uploads/2025/10/best-electric-bike-for-kids-australia-gobike.webp" 
          alt="GoBike Expert Advice"
          fill
          className="object-cover object-top md:object-[center_25%]" // এখানে ফিক্স করা হয়েছে
          priority
        />
        {/* Dark Overlay for text readability */}
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight drop-shadow-lg">
            GoBike Expert Advice
          </h1>
          <p className="text-white/90 text-lg md:text-xl font-medium max-w-[600px] drop-shadow-md">
            Tips, Safety Guides, News & Reviews for Aussie Parents
          </p>
        </div>
      </div>
      
      <div className="max-w-[1400px] mx-auto mb-20 px-4 font-sans">
        <main>

          {/* --- 2. NEW FEATURED POST (Inspired by 99 Bikes) --- */}
          {featuredPost && (
            <div className="mb-16">
              <div className="mb-8 border-b border-gray-200 pb-4">
                <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Latest Post</h2>
              </div>

              <Link href={`/blog/${featuredPost.slug}`} className="group flex flex-col md:flex-row bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 transition-all duration-300 hover:shadow-xl">
                
                {/* Image Side (60% width on Desktop) */}
                <div className="relative w-full md:w-2/4 h-[300px] md:h-[450px] bg-[#f0f0f0] overflow-hidden">
                  {featuredPost.frontmatter.cover_image && (
                    <Image
                      src={featuredPost.frontmatter.cover_image}
                      alt={featuredPost.frontmatter.title}
                      fill
                      className="w-full h-auto max-h-[300px] md:max-h-[450px] object-contain transition-transform duration-700 group-hover:scale-[1.02]"
                      priority
                    />
                  )}
                </div>

                {/* Content Side (40% width on Desktop) */}
                <div className="w-full md:w-2/2 p-8 md:p-12 flex flex-col justify-center">
                  <span className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-3">
                    Latest Guide
                  </span>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-4 leading-tight group-hover:text-blue-600 transition-colors">
                    {featuredPost.frontmatter.title}
                  </h2>
                  <p className="text-sm text-gray-500 mb-6">
                    {featuredPost.frontmatter.date} • {featuredPost.frontmatter.author}
                  </p>
                  <p className="text-gray-700 text-base md:text-lg mb-8 line-clamp-3 leading-relaxed">
                    {featuredPost.frontmatter.excerpt}
                  </p>
                  <div>
                    {/* 99 Bikes Style Black Button */}
                    <span className="inline-block bg-black text-white px-8 py-3 rounded-md font-bold text-sm tracking-wide transition-colors group-hover:bg-blue-600">
                      READ MORE
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* --- Section Heading for Grid --- */}
          {remainingPosts.length > 0 && (
            <div className="mb-8 border-b border-gray-200 pb-4">
              <h3 className="text-2xl font-bold text-gray-900">All Articles</h3>
            </div>
          )}

          {/* --- 3. POSTS GRID (Your Original Premium Card UI) --- */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-8">
            {remainingPosts.map(post => (
              <Link 
                key={post.slug} 
                href={`/blog/${post.slug}`} 
                className="group no-underline text-inherit bg-white border border-[#e7e7e7] rounded-2xl overflow-hidden flex flex-col shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-[0_12px_28px_rgba(0,0,0,0.1)]"
              >
                <div className="relative w-full pt-[56.25%] bg-[#f0f0f0] overflow-hidden">
                  {post.frontmatter.cover_image && (
                    <Image
                      src={post.frontmatter.cover_image}
                      alt={post.frontmatter.title}
                      fill
                      className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  )}
                </div>

                <div className="p-6 md:px-[1.8rem] md:py-[1.5rem] flex flex-col flex-grow">
                  <h2 className="text-[1.3rem] font-bold mb-3 leading-[1.4] text-gray-900 group-hover:text-blue-600 transition-colors">
                    {post.frontmatter.title}
                  </h2>
                  <p className="text-[0.85rem] text-[#777] mb-4">
                    {post.frontmatter.date}
                  </p>
                  <p className="flex-grow mb-6 text-[#555] leading-[1.6] line-clamp-3">
                    {post.frontmatter.excerpt}
                  </p>
                  <span className="font-bold text-black no-underline transition-colors duration-200 group-hover:text-blue-600">
                    Read More →
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* --- Original SEO Content Block --- */}
          <section className="mt-24 pt-12 border-t border-gray-100">
             <div className="max-w-[900px] mx-auto text-center text-gray-600 leading-relaxed">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Guide to Kids Electric Cycles in Australia</h2>
                <p className="mb-4">
                   Welcome to the official GoBike blog! Whether you are looking for maintenance tips for your <strong>electric childs motorbike</strong> or safety advice for <strong>balancing bikes</strong>, we have got you covered.
                </p>
                <p>
                   Our goal is to educate Aussie parents on the benefits of <strong>australian electric bikes</strong>, helping you choose the perfect ride for your child, from toddlers to teens.
                </p>
             </div>
          </section>

        </main>
      </div>
    </div>
  );
}