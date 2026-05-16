// app/blog/[slug]/page.tsx

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import type { Metadata } from 'next';

type Props = {
  params: { slug: string };
};

function getPostContent(slug: string) {
    const filePath = path.join('blogs', `${slug}.md`);
    if (!fs.existsSync(filePath)) {
        return null;
    }
    const markdownWithMeta = fs.readFileSync(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(markdownWithMeta);
    return { frontmatter, content };
}

function getRelatedPosts(currentSlug: string) {
    const blogDir = path.join('blogs');
    const files = fs.readdirSync(blogDir);
    
    const posts = files
        .map(filename => {
            const slug = filename.replace(/\.(md|mdx)$/, '');
            const markdownWithMeta = fs.readFileSync(path.join(blogDir, filename), 'utf-8');
            const { data: frontmatter } = matter(markdownWithMeta);
            return { slug, frontmatter };
        })
        .filter(post => post.slug !== currentSlug) 
        .slice(0, 3); 

    return posts;
} 

// --- 100% SEO OPTIMIZED METADATA ---
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params; 
  const post = getPostContent(slug);

  if (!post) {
      return { title: 'Post Not Found | GoBike Blog' };
  }
  const { frontmatter } = post;
  const pageTitle = `${frontmatter.title} | GoBike Australia`;

  return {
    title: pageTitle,
    description: frontmatter.excerpt,
    keywords: frontmatter.tags || ['kids electric bike', 'electric balance bike australia', 'GoBike'], 
    alternates: {
      canonical: `https://gobike.au/blog/${slug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: pageTitle,
      description: frontmatter.excerpt,
      url: `https://gobike.au/blog/${slug}`,
      siteName: 'GoBike Australia',
      images: [
        {
          url: frontmatter.cover_image || 'https://gobikes.au/wp-content/uploads/2025/09/Gobike-kids-electric-bike-ebike-for-kids-scaled.webp',
          width: 1200,
          height: 630,
          alt: frontmatter.title,
        },
      ],
      locale: 'en_AU',
      type: 'article',
      publishedTime: frontmatter.date,
      authors: [frontmatter.author || 'GoBike Team'],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: frontmatter.excerpt,
      images: [frontmatter.cover_image || 'https://gobikes.au/wp-content/uploads/2025/09/Gobike-kids-electric-bike-ebike-for-kids-scaled.webp'],
    },
  };
}

export async function generateStaticParams() {
  const blogDir = path.join('blogs');
  if (!fs.existsSync(blogDir)) return [];
  
  const files = fs.readdirSync(blogDir);
  const paths = files.map(filename => ({
    slug: filename.replace(/\.(md|mdx)$/, ''),
  }));
  return paths;
}

export default async function SingleBlogPage({ params }: Props) {
  const { slug } = await params; 
  const post = getPostContent(slug);

  if (!post) {
    return <div className="text-center py-20 text-xl font-bold">Blog post not found.</div>;
  }
  const { frontmatter, content } = post;
  const relatedPosts = getRelatedPosts(slug);
  const shareUrl = `https://gobike.au/blog/${slug}`;
  
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'headline': frontmatter.title,
    'description': frontmatter.excerpt,
    'image': frontmatter.cover_image ? [frontmatter.cover_image] : [],
    'datePublished': new Date(frontmatter.date).toISOString(),
    'dateModified': new Date(frontmatter.date).toISOString(), 
    'author': {
      '@type': 'Organization', 
      'name': frontmatter.author || 'GoBike Team',
      'url': 'https://gobike.au'
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'GoBike Australia',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://gobikes.au/wp-content/uploads/2025/06/cropped-GOBIKE-Electric-Bike-for-kids-1.webp'
      }
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `https://gobike.au/blog/${slug}`
    }
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      
      <Breadcrumbs />
      
      <article className="max-w-[1000px] mx-auto mb-16 px-4 font-sans">
        
        <header className="text-center mb-8 pt-4">
          <h1 className="text-3xl md:text-4xl leading-tight mb-4 font-extrabold text-gray-900">
            {frontmatter.title}
          </h1>
          <p className="text-[#555] text-sm md:text-base font-medium mb-8">
            By <span className="font-bold text-black">{frontmatter.author}</span> on {frontmatter.date}
          </p>
        </header>

        {frontmatter.cover_image && (
          <div className="w-full h-auto mb-12 rounded-xl overflow-hidden bg-[#f0f0f0] shadow-sm">
             <Image 
              src={frontmatter.cover_image}
              alt={frontmatter.title}
              title={frontmatter.title} // Added title for better Image SEO
              width={1000}
              height={500}
              className="w-full h-auto object-cover max-h-[550px]"
              priority
            />
          </div>
        )}
 
        <div className={`
            text-[#333] text-[1.1rem] leading-[1.8]
            
            /* Headings */
            [&_h1]:font-bold [&_h1]:mt-10 [&_h1]:mb-4 [&_h1]:leading-[1.3]
            [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:leading-[1.3]
            [&_h3]:font-bold [&_h3]:mt-10 [&_h3]:mb-4 [&_h3]:leading-[1.3]

            /* H2 specific */
            [&_h2]:text-[1.8rem] [&_h2]:border-b [&_h2]:border-[#eee] [&_h2]:pb-2
            
            /* H3 specific */
            [&_h3]:text-[1.5rem]

            /* Paragraphs */
            [&_p]:mb-6

            /* ★★★ UX FIX: Anchor Tags (Links) ★★★ */
            /* এখন ব্লগের যেকোনো জায়গায় লিংক থাকলে সেটা সুন্দর নীল দেখাবে এবং হোভার করলে আন্ডারলাইন হবে */
            [&_a]:text-[#0056b3] [&_a]:font-semibold [&_a]:underline [&_a]:decoration-2 [&_a]:underline-offset-4 [&_a]:transition-colors
            hover:[&_a]:text-[#003d82] hover:[&_a]:decoration-[#003d82]

            /* Strong */
            [&_strong]:font-bold

            /* Lists */
            [&_ul]:pl-6 [&_ul]:mb-6 [&_ul]:list-disc
            [&_ol]:pl-6 [&_ol]:mb-6 [&_ol]:list-decimal
            
            /* List Item */
            [&_li]:mb-3 [&_li>p]:inline /* Fixes spacing issues in markdown lists */

            /* Blockquote */
            [&_blockquote]:ml-0 [&_blockquote]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-black 
            [&_blockquote]:text-[#444] [&_blockquote]:italic [&_blockquote]:bg-gray-50 [&_blockquote]:py-2 [&_blockquote]:rounded-r-lg

            /* Code */
            [&_code]:bg-[#f5f5f5] [&_code]:px-[0.4em] [&_code]:py-[0.2em] [&_code]:rounded [&_code]:font-mono [&_code]:text-red-600
        `}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
        
        {/* Share Section */}
        <div className="mt-16 py-8 border-y border-gray-200 flex flex-col md:flex-row items-center justify-between gap-6">
            <span className="text-lg font-bold text-gray-900">Share this article:</span>
            <div className="flex gap-3 w-full md:w-auto">
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noopener noreferrer" className="flex-1 md:flex-none text-center px-6 py-2.5 bg-[#1877F2] text-white rounded-lg text-sm font-semibold hover:bg-[#166fe5] shadow-sm transition-all">Facebook</a>
                <a href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${frontmatter.title}`} target="_blank" rel="noopener noreferrer" className="flex-1 md:flex-none text-center px-6 py-2.5 bg-[#1DA1F2] text-white rounded-lg text-sm font-semibold hover:bg-[#1a91da] shadow-sm transition-all">Twitter</a>
                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`} target="_blank" rel="noopener noreferrer" className="flex-1 md:flex-none text-center px-6 py-2.5 bg-[#0A66C2] text-white rounded-lg text-sm font-semibold hover:bg-[#0958a8] shadow-sm transition-all">LinkedIn</a>
            </div>
        </div>

        {/* CTA Section */}
        <div className="my-16 p-8 md:p-12 bg-black rounded-3xl text-center text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
                <h3 className="text-3xl md:text-4xl font-extrabold mb-4">Ready to start the adventure?</h3>
                <p className="text-gray-300 mb-8 max-w-[500px] mx-auto text-lg">Shop Australia&apos;s best-rated electric bikes for kids. Built for safety, engineered for fun.</p>
                <Link href="/bikes" className="inline-block bg-white text-black px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-200 transition-all hover:scale-105 shadow-lg">Shop All Bikes →</Link>
            </div>
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/20 blur-3xl rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/20 blur-3xl rounded-full"></div>
        </div>

        {/* Author Section */}
        <div className="mt-16 p-8 bg-gray-50 rounded-2xl flex flex-col md:flex-row items-center gap-6 border border-gray-200 shadow-sm">
            <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">GB</div>
            <div className="text-center md:text-left">
                <h4 className="text-xl font-bold text-gray-900 mb-2">Written by {frontmatter.author || 'GoBike Team'}</h4>
                <p className="text-gray-600 leading-relaxed">GoBike is Australia&apos;s leading provider of premium electric balance bikes for kids. Our mission is to get kids outdoors and help them develop confidence on two wheels safely.</p>
            </div>
        </div>
      </article>

      {/* Related Posts Section */}
      {relatedPosts.length > 0 && (
        <section className="bg-gray-50 py-20 px-4 border-t border-gray-200">
            <div className="max-w-[1100px] mx-auto">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Recommended Reading</h2>
                        <p className="text-gray-600 text-lg">Explore more tips and guides for young riders.</p>
                    </div>
                    <Link href="/blog" className="text-blue-600 font-bold hover:underline mb-1 hidden md:block text-lg">View all posts →</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {relatedPosts.map((post) => (
                        <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                            <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm transition-all hover:shadow-xl hover:-translate-y-2 h-full flex flex-col">
                                <div className="relative aspect-video">
                                    <Image src={post.frontmatter.cover_image} alt={post.frontmatter.title} fill className="object-cover" />
                                </div>
                                <div className="p-6 flex flex-col flex-grow">
                                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors leading-snug">{post.frontmatter.title}</h3>
                                    <p className="text-gray-600 text-sm line-clamp-3 mb-6">{post.frontmatter.excerpt}</p>
                                    <span className="text-sm font-bold text-blue-600 mt-auto flex items-center gap-1 group-hover:gap-2 transition-all">Read Full Article <span>→</span></span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
                
                {/* Mobile View All Button */}
                <div className="mt-10 text-center md:hidden">
                    <Link href="/blog" className="inline-block bg-white border border-gray-300 text-black px-8 py-3 rounded-full font-bold shadow-sm">View All Articles</Link>
                </div>
            </div>
        </section>
      )}
    </div>
  );
}