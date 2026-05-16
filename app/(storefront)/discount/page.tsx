//app/discount/page.tsx

import type { Metadata } from 'next';
import DiscountClient from './DiscountClient';

// --- ADVANCED SEO METADATA FOR PROMO CODES ---
export const metadata: Metadata = {
  title: '5% OFF Kids Electric Bike Promo Codes & E-Bike Coupons',
  description: 'Stop searching for fake coupons! Get 100% verified GoBike Australia discount codes. Save 5% on kids electric bikes, e-bikes, balance bikes, and spare parts.',
  keywords: [
    'kids electric bike discount', 'ebike promo code', 'electric bike coupon Australia', 
    'GoBike promo code', 'GoBike discount code', 'kids dirt bike sale',
    'verified GoBike coupons', 'electric balance bike discount'
  ],
  alternates: {
    canonical: 'https://gobike.au/discount',
  },
  openGraph: {
    title: '5% OFF Kids Electric Bike Promo Codes | GoBike',
    description: 'Claim your official GoBike Australia discounts today. Save 5% on kids electric bikes, spare parts, and accessories.',
    url: 'https://gobike.au/discount',
    siteName: 'GoBike Australia',
    images: [
      {
        url: 'https://gobikes.au/wp-content/uploads/2025/02/GoBike-12-Inch-Ebike-for-Kids-With-Training-wheels.webp', 
        width: 1200,
        height: 630,
        alt: 'GoBike Kids Electric Bike Official Promo Codes',
      }
    ],
    locale: 'en_AU',
    type: 'website',
  }
};

export default function DiscountPage() {

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Can I apply the 5% code to multiple bikes?",
        "acceptedAnswer": { "@type": "Answer", "text": "Yes, absolutely! You can add as many bikes, spare parts, and accessories to your cart as you want. Once you apply the code at checkout, it will take 5% off the entire total of your cart." }
      },
      {
        "@type": "Question",
        "name": "Can I use multiple codes at once?",
        "acceptedAnswer": { "@type": "Answer", "text": "No, our checkout system only accepts one promo code per order. Since all the codes on this page offer the same 5% discount, you can pick any single code to apply to your order." }
      },
      {
        "@type": "Question",
        "name": "Does the discount apply to spare parts?",
        "acceptedAnswer": { "@type": "Answer", "text": "Yes! The 5% discount applies to everything in our store. Whether you are buying a brand new 24-inch ebike, a replacement battery, or Kenda tires, the discount is valid across the board." }
      },
      {
        "@type": "Question",
        "name": "Can I use a promo code on items already on sale?",
        "acceptedAnswer": { "@type": "Answer", "text": "In most cases, yes! Our 5% cart discount applies to your final cart total, meaning you can often stack it on top of existing site-wide sales for massive savings." }
      },
      {
        "@type": "Question",
        "name": "Do these discount codes expire?",
        "acceptedAnswer": { "@type": "Answer", "text": "The codes listed on this page are currently active and verified. However, promotions are subject to change. We highly recommend using the code while it is still available on this page." }
      },
      {
        "@type": "Question",
        "name": "Why is my promo code showing as invalid?",
        "acceptedAnswer": { "@type": "Answer", "text": "Ensure you haven't accidentally added a space before or after the code when pasting it. Also, make sure you are using an official code from this page, as third-party coupon sites often distribute fake codes." }
      }
    ]
  };

  return (
    <>
      {/* Inject SEO Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      
      {/* Render the Client UI */}
      <DiscountClient />
    </>
  );
}