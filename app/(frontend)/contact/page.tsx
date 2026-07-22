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

const contactJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://gobike.au/#localbusiness",
    "name": "GoBike Australia",
    "url": "https://gobike.au",
    "telephone": "+61-426-067-277",
    "email": "gobike@gobike.au",
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Camden South",
      "addressRegion": "NSW",
      "postalCode": "2570",
      "addressCountry": "AU"
    },
    "geo": { "@type": "GeoCoordinates", "latitude": -34.05, "longitude": 150.69 },
    "openingHoursSpecification": { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"], "opens": "09:00", "closes": "17:00" },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+61-426-067-277",
      "contactType": "customer service",
      "email": "gobike@gobike.au",
      "areaServed": "AU",
      "availableLanguage": "English"
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://gobike.au" },
      { "@type": "ListItem", position: 2, name: "Contact Us", item: "https://gobike.au/contact" },
    ],
  },
];

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