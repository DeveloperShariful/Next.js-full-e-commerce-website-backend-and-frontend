//app/(frontend)/warranty/page.tsx

import type { Metadata } from 'next';
import WarrantyClient from './WarrantyClient';

// --- ADVANCED SEO METADATA ---
export const metadata: Metadata = {
  title: 'Submit a Warranty Claim | GoBike Australia',
  description: 'Easily submit your GoBike Australia warranty claim online. Upload a video of the issue and our Aussie tech team will send you the replacement parts fast.',
  keywords: [
    'GoBike warranty claim', 'electric balance bike repair', 'kids ebike support', 
    'GoBike customer service', 'submit ebike warranty', 'Australia kids bike repair'
  ],
  alternates: {
    canonical: 'https://gobike.au/warranty',
  },
  openGraph: {
    title: 'Submit a Warranty Claim | GoBike Australia',
    description: 'Fast and easy warranty claims for your GoBike electric balance bike. Upload a video and get back to riding.',
    url: 'https://gobike.au/warranty',
    siteName: 'GoBike Australia',
    locale: 'en_AU',
    type: 'website',
    images: [{ url: 'https://gobike.au/wp-content/uploads/2025/11/gobike-ebike-safe-speed-modes.jpg', width: 1200, height: 630, alt: 'GoBike Warranty Claim' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Submit a Warranty Claim | GoBike Australia',
    description: 'Fast and easy warranty claims for your GoBike electric balance bike. Upload a video and get back to riding.',
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function WarrantyClaimPage() {
  // --- BREADCRUMB SCHEMA ---
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://gobike.au"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Warranty Claim",
        "item": "https://gobike.au/warranty"
      }
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      
      {/* মেইন ফর্ম কম্পোনেন্ট লোড করা হচ্ছে */}
      <WarrantyClient />
    </>
  );
}