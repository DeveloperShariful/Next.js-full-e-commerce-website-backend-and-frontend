// app/(frontend)/contact/page.tsx

import type { Metadata } from 'next';
import ContactPageClient from './ContactPageClient';

export const metadata: Metadata = {
  title: 'Contact Us | GoBike Australia Support',
  description: 'Have a question about our kids electric bikes? Get in touch with the GoBike Australia team. We are here to help you with your inquiries and provide expert support.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact Us | GoBike Australia Support',
    description: 'Have a question about our kids electric bikes? Get in touch with the GoBike Australia team for expert support.',
    url: 'https://gobike.au/contact',
    siteName: 'GoBike Australia',
    images: [
      {
        url: 'https://gobikes.au/wp-content/uploads/2025/11/best-electric-bike-for-kids-australia-gobike.jpg', 
        width: 1200,
        height: 857,
        alt: 'Contact GoBike Australia for support',
      },
    ],
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@GoBikeAU',
    title: 'Contact Us | GoBike Australia Support',
    description: 'Have a question about our kids electric bikes? Get in touch with the GoBike Australia team for expert support.',
    images: ['https://gobikes.au/wp-content/uploads/2025/11/best-electric-bike-for-kids-australia-gobike.jpg'],
  },
  keywords: ['contact gobike australia', 'kids electric bike support australia', 'gobike customer service', 'electric bike help australia'],
  robots: { index: true, follow: true },
};

const contactJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "GoBike Australia",
  "url": "https://gobike.au",
  "telephone": "+61-426-067-277",
  "email": "gobike@gobike.au",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Camden",
    "addressRegion": "NSW",
    "addressCountry": "AU"
  },
  "openingHours": "Mo-Fr 09:00-17:00",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+61-426-067-277",
    "contactType": "customer service",
    "email": "gobike@gobike.au",
    "areaServed": "AU",
    "availableLanguage": "English"
  }
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }}
      />
      <ContactPageClient />
    </>
  );
}