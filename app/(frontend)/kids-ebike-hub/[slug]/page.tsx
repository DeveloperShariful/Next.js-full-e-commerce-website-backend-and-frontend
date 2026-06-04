// app/kids-ebike-hub/[slug]/page.tsx

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import ReactMarkdown from 'react-markdown';
import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';

type Props = { params: { slug: string } };

function getHubContent(slug: string) {
    const filePath = path.join('hub-posts', `${slug}.md`);
    if (!fs.existsSync(filePath)) return null;
    const markdownWithMeta = fs.readFileSync(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(markdownWithMeta);
    return { frontmatter, content };
}

// --- 100% ADVANCED SEO METADATA ---
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getHubContent(slug);
  if (!post) return { title: 'Not Found | GoBike Hub' };
  
  const siteUrl = 'https://gobikes.au';
  const postUrl = `${siteUrl}/kids-ebike-hub/${slug}`;
  
  return {
    title: `${post.frontmatter.title} | GoBike Australia`,
    description: post.frontmatter.excerpt,
    keywords: post.frontmatter.tags || ['kids electric bike', 'kids ebike australia', 'GoBike'],
    alternates: { canonical: postUrl },
    robots: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large' },
    openGraph: {
      title: post.frontmatter.title,
      description: post.frontmatter.excerpt,
      url: postUrl,
      siteName: 'GoBike Australia',
      images: [{ url: post.frontmatter.thumbnail, width: 1200, height: 630, alt: post.frontmatter.title }],
      locale: 'en_AU',
      type: 'article',
      publishedTime: post.frontmatter.date || new Date().toISOString(),
      section: post.frontmatter.category || 'Kids Electric Bikes',
    },
    twitter: {
      card: post.frontmatter.video_url ? 'player' : 'summary_large_image',
      title: post.frontmatter.title,
      description: post.frontmatter.excerpt,
      images: [post.frontmatter.thumbnail],
    },
  };
}

export async function generateStaticParams() {
  const hubDir = path.join('hub-posts');
  if (!fs.existsSync(hubDir)) return [];
  return fs.readdirSync(hubDir).map(filename => ({ slug: filename.replace(/\.(md|mdx)$/, '') }));
}

export default async function SingleHubPage({ params }: Props) {
  const { slug } = await params;
  const post = getHubContent(slug);

  if (!post) {
    return <div className="text-center py-32 font-bold text-2xl text-gray-400">Content not found.</div>;
  }

  const { frontmatter, content } = post;
  const siteUrl = 'https://gobikes.au';
  const postUrl = `${siteUrl}/kids-ebike-hub/${slug}`;
  const publishDate = frontmatter.date ? new Date(frontmatter.date).toISOString() : new Date().toISOString();

  // --- ADVANCED JSON-LD SCHEMA (Article + VideoObject) ---
  const schemaOrgJSONLD: any[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': frontmatter.title,
      'description': frontmatter.excerpt,
      'image': frontmatter.thumbnail,
      'datePublished': publishDate,
      'dateModified': publishDate,
      'author': { '@type': 'Organization', 'name': 'GoBike Team', 'url': siteUrl },
      'publisher': {
        '@type': 'Organization',
        'name': 'GoBike Australia',
        'logo': { '@type': 'ImageObject', 'url': `${siteUrl}/wp-content/uploads/2025/06/GOBIKE-Electric-Bike-for-kids-1.webp` }
      },
      'mainEntityOfPage': { '@type': 'WebPage', '@id': postUrl }
    }
  ];

  if (frontmatter.video_url) {
    schemaOrgJSONLD.push({
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      'name': frontmatter.title,
      'description': frontmatter.excerpt,
      'thumbnailUrl': [frontmatter.thumbnail],
      'uploadDate': publishDate,
      'contentUrl': frontmatter.video_url,
      'embedUrl': postUrl,
      'publisher': { '@type': 'Organization', 'name': 'GoBike Australia', 'logo': { '@type': 'ImageObject', 'url': `${siteUrl}/wp-content/uploads/2025/06/GOBIKE-Electric-Bike-for-kids-1.webp` } }
    });
  }

  return (
    <div>
      {/* 🚀 PERFORMANCE UPGRADE: Preload Video for Instant Playback 🚀 */}
      {frontmatter.video_url && (
        <link rel="preload" as="video" href={frontmatter.video_url} type="video/mp4" />
      )}

      {/* Inject SEO Schemas */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrgJSONLD) }} />
      
      <Breadcrumbs />

      <main>
        <article className="max-w-[900px] mx-auto mb-20 px-4 pt-8 font-sans">
          
          <header className="mb-10 text-center">
            {frontmatter.category && (
              <Link href={`/kids-ebike-hub`} className="bg-black text-white px-5 py-1.5 text-xs font-bold uppercase tracking-widest rounded-full mb-6 inline-block hover:scale-105 transition-transform shadow-md">
                ← Back to {frontmatter.category}
              </Link>
            )}
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight">
              {frontmatter.title}
            </h1>
            {frontmatter.date && <time dateTime={publishDate} className="block text-gray-500 mt-5 text-sm font-semibold uppercase tracking-wider">{frontmatter.date}</time>}
          </header>

          {/* Media Section */}
          <section aria-label="Media Content">
            {frontmatter.video_url ? (
              <div className="flex justify-center mb-12">
                {/* 
                  ★ FIX: max-h-[70vh] Ensures it never crosses the screen height
                  w-full sm:w-auto makes it full width on mobile but fitted on desktop 
                */}
                <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-200 flex justify-center items-center w-full sm:w-auto max-h-[70vh]">
                  <video 
                    controls 
                    playsInline 
                    className="w-full h-full max-h-[70vh] object-contain bg-black" /* object-contain ensures no cropping */
                    poster={frontmatter.thumbnail}
                    preload="auto"
                  >
                    <source src={frontmatter.video_url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            ) : frontmatter.thumbnail && (
              <div className="w-full rounded-3xl overflow-hidden shadow-xl mb-12 border border-gray-100 flex justify-center">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 <img src={frontmatter.thumbnail} alt={frontmatter.title} title={frontmatter.title} className="w-full h-auto max-h-[70vh] object-contain rounded-3xl" />
              </div>
            )}
          </section>

          {/* Social Caption */}
          {frontmatter.original_caption && (
            <aside className="bg-[#f8f9fa] border-l-4 border-blue-600 p-6 md:p-8 rounded-r-2xl mb-12 shadow-sm" aria-label="Original Social Post">
              <span className="text-blue-600 font-bold text-xs uppercase tracking-widest mb-3 block">Original Social Post</span>
              <p className="text-gray-800 italic font-medium leading-relaxed text-lg md:text-xl">
                "{frontmatter.original_caption}"
              </p>
            </aside>
          )}

          {/* SEO Content Body */}
          <section className={`
            text-gray-800 text-[1.15rem] leading-[1.8]
            [&_h2]:text-3xl [&_h2]:font-extrabold [&_h2]:mt-14 [&_h2]:mb-6 [&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-gray-100
            [&_h3]:text-2xl [&_h3]:font-bold [&_h3]:mt-10 [&_h3]:mb-4
            [&_p]:mb-6
            [&_a]:text-blue-600 [&_a]:font-bold [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-blue-800 transition-colors
            [&_ul]:pl-6 [&_ul]:mb-6 [&_ul]:list-disc [&_li]:mb-3 [&_li::marker]:text-blue-600
            [&_strong]:font-bold [&_strong]:text-black
          `}>
            <ReactMarkdown>{content}</ReactMarkdown>
          </section>

          {/* Call to Action */}
          <footer className="mt-20 p-10 md:p-14 bg-gradient-to-br from-black to-gray-900 rounded-[2rem] text-center text-white shadow-2xl relative overflow-hidden">
             <div className="relative z-10">
                 <h2 className="text-3xl md:text-4xl font-extrabold mb-5 tracking-tight">Ready to Start the Adventure?</h2>
                 <p className="mb-8 text-gray-300 max-w-lg mx-auto text-lg">Shop Australia's best-rated electric bikes for kids. Built for safety, engineered for fun.</p>
                 <Link href="/bikes" className="inline-block bg-white text-black px-10 py-4 font-bold text-lg rounded-full hover:bg-gray-200 transition-all hover:scale-105 shadow-lg">
                    Shop All Bikes →
                 </Link>
             </div>
             <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/20 blur-3xl rounded-full mix-blend-screen"></div>
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/20 blur-3xl rounded-full mix-blend-screen"></div>
          </footer>

        </article>
      </main>
    </div>
  );
}