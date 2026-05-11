//app/warranty/page.tsx

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
    canonical: 'https://gobike.au/warranty-claim',
  },
  openGraph: {
    title: 'Submit a Warranty Claim | GoBike Australia',
    description: 'Fast and easy warranty claims for your GoBike electric balance bike. Upload a video and get back to riding.',
    url: 'https://gobike.au/warranty-claim',
    siteName: 'GoBike Australia',
    locale: 'en_AU',
    type: 'website',
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
        "name": "Warranty Policy",
        "item": "https://gobike.au/warranty"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Submit Claim",
        "item": "https://gobike.au/warranty-claim"
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