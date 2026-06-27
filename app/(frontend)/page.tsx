// app/(frontend)/page.tsx

import type { Metadata } from 'next';
import HomePageClient from './HomePageClient';
import dynamic from 'next/dynamic';
import { getFeaturedBikesAction } from '@/app/actions/frontend/home/getFeaturedBikesAction';
import { getHomePageReviewsAction } from '@/app/actions/frontend/home/getHomePageReviewsAction';

const DynamicBlogSection = dynamic(() => import('./blog/DynamicBlogSection'), {
  ssr: true,
});

const siteConfig = {
  url: 'https://gobike.au',
  title: 'GoBike - Australia\'s Top Rated Kids Electric Balance Bikes',
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
  keywords: [
    'kids electric bike', 'electric bike for kids', 'kids ebike', 'electric balance bike',
    'gobike', 'gobike australia', 'best kids electric bike australia', 'electric dirt bike kids',
    'children electric bike', 'kids motorbike electric', 'toddler electric bike',
  ],
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
    site: '@gobikeoz',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Are electric bikes safe for young children?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely! Our entire range of electric bikes for kids is designed with safety as the number one priority. They feature parental speed controls, sturdy yet lightweight frames, and reliable braking systems.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I choose the best kids electric bike?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Finding the best kids electric bike comes down to your child\'s age, size, and confidence level. Key things to look for are the correct size (e.g., 12" or 16" wheels), adjustable speed settings, and great battery life.',
      },
    },
    {
      '@type': 'Question',
      name: 'What age are these childrens electric bikes for?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our childrens electric bikes cater for a wide age range, typically from toddlers as young as 2 up to 16 years old. The adjustable speed settings make this possible.',
      },
    },
    {
      '@type': 'Question',
      name: "What's the speed and battery life like on an ebike for kids?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Most models feature two speed modes: a slow learning mode (around 8-10 km/h) and a faster mode (up to 18 km/h). The high-quality battery is built to last for hours of riding on a single charge.',
      },
    },
  ],
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: siteConfig.siteName,
  url: siteConfig.url,
  logo: siteConfig.logo,
  sameAs: [siteConfig.facebook, siteConfig.instagram, siteConfig.youtube],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: siteConfig.phone,
    contactType: 'customer service',
    areaServed: 'AU',
    availableLanguage: 'English',
  },
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  url: siteConfig.url,
  name: siteConfig.siteName,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export default async function Home() {
  const [featuredBikesResult, reviewsResult] = await Promise.all([
    getFeaturedBikesAction(),
    getHomePageReviewsAction(),
  ]);

  const initialFeaturedBikes = featuredBikesResult.success ? featuredBikesResult.products : [];
  const initialReviewsData = reviewsResult.success && reviewsResult.data ? reviewsResult.data : null;

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <HomePageClient
        initialFeaturedBikes={initialFeaturedBikes}
        initialReviewsData={initialReviewsData}
      />
      <DynamicBlogSection />
    </main>
  );
}
