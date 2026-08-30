// app/(frontend)/refund-and-returns-policy/page.tsx

import Script from 'next/script';
import Breadcrumbs from '@/components/Breadcrumbs';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Return and Refund Policy | GoBike Australia',
  description: 'Learn about our 30-day return policy and process for refunds and exchanges at GoBike Australia. We are committed to ensuring your complete satisfaction.',
  alternates: {
    canonical: '/refund-and-returns-policy',
  },
  openGraph: {
    title: 'Return and Refund Policy | GoBike Australia',
    description: 'Learn about our 30-day return policy and process for refunds and exchanges at GoBike Australia.',
    url: 'https://gobike.au/refund-and-returns-policy',
    siteName: 'GoBike Australia',
    images: [
      {
        url: 'https://gobikes.au/wp-content/uploads/2025/11/gobike-au-1-year-warranty-kids-ebikes.jpg', 
        width: 1200,
        height: 857,
        alt: 'GoBike Australia Return and Refund Policy',
      },
    ],
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@GoBikeAU',
    title: 'Return and Refund Policy | GoBike Australia',
    description: 'Learn about our 30-day return policy and process for refunds and exchanges at GoBike Australia.',
    images: ['https://gobikes.au/wp-content/uploads/2025/11/gobike-au-1-year-warranty-kids-ebikes.jpg'],
  },
  keywords: ['gobike return policy', 'kids electric bike refund australia', 'gobike refund and returns', 'electric bike return policy australia'],
  robots: { index: true, follow: true },
};

// SEO Schema ডেটা
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What is the return eligibility for GoBike products?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "We accept returns of unused and undamaged ebike conversion kits and other products within 30 calendar days of delivery. The product must be in brand-new condition, in its original packaging, with all parts included."
    }
  },{
    "@type": "Question",
    "name": "How long does a refund take?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "After we receive and approve your returned item, a full refund is processed to your original payment method within 5 to 7 business days."
    }
  },{
    "@type": "Question",
    "name": "What if my ebike conversion kit arrives damaged?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "If your item arrives damaged, defective, or incorrect, please contact us within 48 hours of delivery. We will arrange a free replacement or a full refund, including all shipping costs."
    }
  },{
    "@type": "Question",
    "name": "Do I have to pay for return shipping?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "If you're simply changing your mind, the cost of return shipping is your responsibility, and we recommend using a tracked postal service so the parcel can be traced back to us. If the item arrived damaged, defective, or incorrect, however, return shipping is completely free — we cover it as part of your replacement or refund."
    }
  },{
    "@type": "Question",
    "name": "Is there a restocking fee on returns?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Products returned in brand-new, unused condition are not charged a restocking fee. If a returned product shows signs of use, damage, or is missing components, we reserve the right to apply a restocking fee of up to 20% of the item price, or in some cases decline the return altogether."
    }
  },{
    "@type": "Question",
    "name": "Can I exchange an item instead of getting a refund?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Yes. Simple exchange and upgrade options are available — for example, swapping to a different size or model. Email our team with your order number and what you'd like to exchange for, and we'll arrange it alongside your return."
    }
  },{
    "@type": "Question",
    "name": "How do I start a return with GoBike?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Email gobike@gobike.au with your order number and the reason for the return. If the item is damaged or faulty, attach photos to speed up the process. Our team replies within 1 business day with return instructions."
    }
  },{
    "@type": "Question",
    "name": "What items can't be returned?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "To be eligible for return, an item must be unused, in brand-new condition with no signs of installation, and in its original packaging with all accessories and parts included. Batteries and other electrical components must remain unopened and unused, for safety reasons — once a battery has been used or its seal broken, it can no longer be accepted back."
    }
  },{
    "@type": "Question",
    "name": "Does this policy affect my rights under Australian Consumer Law?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "No. This return policy is offered in addition to, and does not limit, your statutory rights under Australian Consumer Law. If a product has a major fault, you remain entitled to a repair, replacement, or refund under the Australian Consumer Law regardless of the terms above."
    }
  }]
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "GoBike Australia",
  "url": "https://gobike.au",
  "logo": "https://gobikes.au/wp-content/uploads/2025/06/cropped-GOBIKE-Electric-Bike-for-kids-1.webp",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Customer Service",
    "email": "gobike@gobike.au",
    "areaServed": "AU"
  }
};

export default function RefundAndReturnsPolicyPage() {
  return (
    <>
      <Script id="faq-schema" type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </Script>
      <Script id="org-schema" type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </Script>
      <div>
        <Breadcrumbs />
        
        {/* .gobikePolicyPage replaced */}
        <div className="font-sans text-[#333] leading-[1.7] bg-white">
          {/* .policyContainer replaced */}
          <div className="max-w-[900px] mx-auto px-[15px]">

            {/* .policyHeader replaced */}
            <div className="text-center mb-10">
              <h1 className="text-[32px] font-bold text-[#1a1a1a] mb-[15px]">Hassle-Free Refund & Return Policy</h1>
              <p className="text-center text-[18px] text-[#555] max-w-[700px] mx-auto mb-[50px]">
                We want you to feel completely confident shopping with us. Our straightforward policy ensures you get the best service and protection for your purchase.
              </p>
            </div>

            {/* .policySection replaced */}
            <div className="mb-10">
              <h2 className="text-[24px] font-semibold text-[#1a1a1a] mb-5 pb-[10px] border-b-2 border-[#f0f0f0]">Return Eligibility: What Can You Return?</h2>
              <p className="text-base mb-[15px]">We accept returns of <strong className="font-semibold text-[#1a1a1a]">unused and undamaged</strong> products, including ebike conversion kits, within <strong className="font-semibold text-[#1a1a1a]">30 calendar days</strong> of delivery. To be eligible:</p>
              
              {/* Custom List Styling for Checkmarks */}
              <ul className="list-none pl-0 mb-[15px]">
                <li className="relative pl-[30px] mb-[10px] text-base before:content-['✓'] before:text-[#28a745] before:font-bold before:absolute before:left-0 before:top-[1px]">The product must be in brand-new condition, with no signs of installation or use.</li>
                <li className="relative pl-[30px] mb-[10px] text-base before:content-['✓'] before:text-[#28a745] before:font-bold before:absolute before:left-0 before:top-[1px]">The original packaging must be intact with all accessories, manuals, and parts included.</li>
                <li className="relative pl-[30px] mb-[10px] text-base before:content-['✓'] before:text-[#28a745] before:font-bold before:absolute before:left-0 before:top-[1px]">Electrical components like batteries must remain unopened and unused for safety reasons.</li>
              </ul>
              
              {/* .highlightBox replaced */}
              <div className="bg-[#f8f9fa] border-l-4 border-[#007bff] p-5 rounded-r-lg my-5">
                <p className="text-base mb-0"><strong className="font-semibold text-[#1a1a1a]">Please Note:</strong> The cost of return shipping is borne by the customer, unless the item was delivered faulty. We highly recommend using a tracked postal service.</p>
              </div>
            </div>

            <div className="mb-10">
              <h2 className="text-[24px] font-semibold text-[#1a1a1a] mb-5 pb-[10px] border-b-2 border-[#f0f0f0]">Refund Process: How It Works</h2>
              <p className="text-base mb-[15px]">Once we receive and inspect your return, an approved refund will be processed to your original payment method within <strong className="font-semibold text-[#1a1a1a]">5 to 7 business days</strong>. You will receive an email confirmation.</p>
              
              {/* .highlightBox .warningBox replaced */}
              <div className="bg-[#fff8f8] border-l-4 border-[#dc3545] p-5 rounded-r-lg my-5">
                <p className="text-base mb-0">If a product shows signs of use, damage, or is missing components, we reserve the right to apply a restocking fee of up to 20% or, in some cases, reject the return.</p>
              </div>
            </div>

            <div className="mb-10">
              <h2 className="text-[24px] font-semibold text-[#1a1a1a] mb-5 pb-[10px] border-b-2 border-[#f0f0f0]">Faulty, Damaged, or Incorrect Items</h2>
              <p className="text-base mb-[15px]">If your <strong className="font-semibold text-[#1a1a1a]">ebike conversion kit</strong> or any item arrives damaged or defective, please <strong className="font-semibold text-[#1a1a1a]">contact us within 48 hours</strong> of delivery. We will offer a replacement at no extra cost or a full refund, including return shipping.</p>
            </div>

            <div className="mb-10">
              <h2 className="text-[24px] font-semibold text-[#1a1a1a] mb-5 pb-[10px] border-b-2 border-[#f0f0f0]">How to Initiate a Return</h2>
              <ol className="list-decimal pl-[20px] text-base mb-[15px]">
                <li className="mb-[10px]"><strong className="font-semibold text-[#1a1a1a]">Contact us via email at <a href="mailto:gobike@gobike.au" className="text-[#007bff] font-semibold underline">gobike@gobike.au</a></strong>.</li>
                <li className="mb-[10px]">Provide your <strong className="font-semibold text-[#1a1a1a]">order number</strong> and the reason for your return.</li>
                <li className="mb-[10px]"><strong className="font-semibold text-[#1a1a1a]">Attach photos</strong> if the item is damaged or faulty (this speeds up the process).</li>
                <li className="mb-[10px]">Our team will reply within 1 business day with return instructions.</li>
              </ol>
            </div>

            {/* .policySection .finalSummary replaced */}
            <div className="mb-10 bg-[#f8f9fa] p-[30px] rounded-xl">
              <h2 className="text-[24px] font-semibold text-[#1a1a1a] mb-5 pb-[10px] border-b-2 border-[#f0f0f0]">Summary of Our Policy</h2>
              <ul className="list-none pl-0 mb-[15px]">
                <li className="relative pl-[30px] mb-[10px] text-base before:content-['✓'] before:text-[#28a745] before:font-bold before:absolute before:left-0 before:top-[1px]"><strong className="font-semibold text-[#1a1a1a]">30-day return window</strong> for new and unused items.</li>
                <li className="relative pl-[30px] mb-[10px] text-base before:content-['✓'] before:text-[#28a745] before:font-bold before:absolute before:left-0 before:top-[1px]">Full refunds processed within 5-7 business days after inspection.</li>
                <li className="relative pl-[30px] mb-[10px] text-base before:content-['✓'] before:text-[#28a745] before:font-bold before:absolute before:left-0 before:top-[1px]">Faulty or damaged items are replaced or fully refunded at our cost.</li>
                <li className="relative pl-[30px] mb-[10px] text-base before:content-['✓'] before:text-[#28a745] before:font-bold before:absolute before:left-0 before:top-[1px]">Simple exchange and upgrade options are available.</li>
                <li className="relative pl-[30px] mb-[10px] text-base before:content-['✓'] before:text-[#28a745] before:font-bold before:absolute before:left-0 before:top-[1px]">Full compliance with <strong className="font-semibold text-[#1a1a1a]">Australian Consumer Law</strong>.</li>
              </ul>
            </div>
            
            <div className="mb-10">
              <h2 className="text-[24px] font-semibold text-[#1a1a1a] mb-5 pb-[10px] border-b-2 border-[#f0f0f0]">Frequently Asked Questions</h2>

              <div className="mb-6">
                <h3 className="text-[18px] font-semibold text-[#1a1a1a] mb-[6px]">Do I have to pay for return shipping?</h3>
                <p className="text-base mb-0">If you&apos;re simply changing your mind, the cost of return shipping is your responsibility, and we recommend using a tracked postal service so the parcel can be traced back to us. If the item arrived damaged, defective, or incorrect, however, return shipping is completely free — we cover it as part of your replacement or refund.</p>
              </div>

              <div className="mb-6">
                <h3 className="text-[18px] font-semibold text-[#1a1a1a] mb-[6px]">Is there a restocking fee on returns?</h3>
                <p className="text-base mb-0">Products returned in brand-new, unused condition are not charged a restocking fee. If a returned product shows signs of use, damage, or is missing components, we reserve the right to apply a restocking fee of up to 20% of the item price, or in some cases decline the return altogether.</p>
              </div>

              <div className="mb-6">
                <h3 className="text-[18px] font-semibold text-[#1a1a1a] mb-[6px]">Can I exchange an item instead of getting a refund?</h3>
                <p className="text-base mb-0">Yes. Simple exchange and upgrade options are available — for example, swapping to a different size or model. Email our team with your order number and what you&apos;d like to exchange for, and we&apos;ll arrange it alongside your return.</p>
              </div>

              <div className="mb-6">
                <h3 className="text-[18px] font-semibold text-[#1a1a1a] mb-[6px]">What items can&apos;t be returned?</h3>
                <p className="text-base mb-0">To be eligible for return, an item must be unused, in brand-new condition with no signs of installation, and in its original packaging with all accessories and parts included. Batteries and other electrical components must remain unopened and unused, for safety reasons — once a battery has been used or its seal broken, it can no longer be accepted back.</p>
              </div>

              <div className="mb-0">
                <h3 className="text-[18px] font-semibold text-[#1a1a1a] mb-[6px]">Does this policy affect my rights under Australian Consumer Law?</h3>
                <p className="text-base mb-0">No. This return policy is offered in addition to, and does not limit, your statutory rights under Australian Consumer Law. If a product has a major fault, you remain entitled to a repair, replacement, or refund under the Australian Consumer Law regardless of the terms above.</p>
              </div>
            </div>

            <div className="mb-10">
              <h2 className="text-[24px] font-semibold text-[#1a1a1a] mb-5 pb-[10px] border-b-2 border-[#f0f0f0]">Need Help with Your Return?</h2>
              <p className="text-base mb-[15px]">Your satisfaction is our top priority. If you have any questions, our local Aussie support team is here to help you every step of the way.</p>
              
              {/* .contactInfoBlock replaced */}
              <div className="border border-[#e9e9e9] p-[30px] rounded-xl mt-[30px]">
                <p className="text-base mb-0">
                  <strong className="font-semibold text-[#1a1a1a]">Business Name:</strong> GoBike Australia<br />
                  <strong className="font-semibold text-[#1a1a1a]">Email:</strong> <a href="mailto:gobike@gobike.au" className="text-[#007bff] font-semibold underline">gobike@gobike.au</a><br />
                  <strong className="font-semibold text-[#1a1a1a]">Website:</strong> <Link href="https://gobike.au" className="text-[#007bff] font-semibold underline">gobike.au</Link>
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}