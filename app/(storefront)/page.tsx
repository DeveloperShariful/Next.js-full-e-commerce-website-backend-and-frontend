// app/(storefront)/page.tsx

import type { Metadata } from 'next';
import HomePageClient from './HomePageClient';
import dynamic from 'next/dynamic';

const DynamicBlogSection = dynamic(() => import('./blog/DynamicBlogSection'), {
  ssr: true, 
});

const siteConfig = {
  url: 'https://gobike.au',
  title: 'GoBike - Australia’s Top Rated Kids Electric Balance Bikes',
  description: "Discover Australia's top-rated electric bikes for kids. Safe, fun, and built for adventure. Shop GoBike for the best kids e-bikes with a 1-year local warranty.",
  ogImage: 'https://gobikes.au/wp-content/uploads/2025/11/gobike-ebike-safe-speed-modes.jpg',
  logo: 'https://gobikes.au/wp-content/uploads/2025/06/cropped-GOBIKE-Electric-Bike-for-kids-1.webp',
  siteName: 'GoBike Australia',
  facebook: 'https://www.facebook.com/Go-Bike-104997195659873',
  instagram: 'https://www.instagram.com/gobikeoz/',
  youtube: 'https://www.youtube.com/@Gobike-r7b',
  phone: '+61-426-067-277',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: siteConfig.title,
  description: siteConfig.description,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: '/',
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.siteName,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 857, 
        alt: 'A child happily riding a GoBike electric bike in an Australian park.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
};

export default function Home() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'url': siteConfig.url,
    'name': siteConfig.siteName,
    'potentialAction': { 
      '@type': 'SearchAction', 
      'target': { 
        '@type': 'EntryPoint', 
        'urlTemplate': `${siteConfig.url}/search?q={search_term_string}` 
      }, 
      'query-input': 'required name=search_term_string' 
    }
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <HomePageClient />
      <DynamicBlogSection />
    </main>
  );
}