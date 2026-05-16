//// app/shipping-policy/page.tsx

import Script from 'next/script';
import Breadcrumbs from '@/components/Breadcrumbs';
import type { Metadata } from 'next';
import Link from 'next/link';

// --- Enterprise SEO Metadata ---
export const metadata: Metadata = {
  title: 'Shipping Policy | Fast Delivery Kids Electric Bikes Australia',
  description: "We ship Australia-wide! Fast, reliable delivery for childrens electric bikes, balance bikes, and spare parts via Transdirect. Check delivery times for NSW, VIC, QLD & more.",
  keywords: [
    'kids electric bike shipping', 
    'australia electric bike delivery', 
    'shipping childrens electric motorbikes', 
    'GoBike shipping policy',
    'electric cycles australia delivery'
  ],
  alternates: {
    canonical: '/shipping-policy',
  },
  openGraph: {
    title: 'Shipping Policy | Fast Delivery Kids Electric Bikes Australia',
    description: 'Fast and safe shipping for all kids electric bikes and parts across Australia.',
    url: 'https://gobike.au/shipping-policy',
    siteName: 'GoBike Australia',
    locale: 'en_AU',
    type: 'website',
  },
};

// --- Structured Data (Schema) ---
const shippingSchema = {
  "@context": "https://schema.org",
  "@type": "ShippingDeliveryTime",
  "handlingTime": {
    "@type": "QuantitativeValue",
    "minValue": 1,
    "maxValue": 2,
    "unitCode": "d"
  },
  "transitTime": {
    "@type": "QuantitativeValue",
    "minValue": 2,
    "maxValue": 7,
    "unitCode": "d"
  },
  "cutOffTime": "14:00:00+10:00", // Sydney Time
  "operatingHours": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday"
    ],
    "opens": "09:00",
    "closes": "17:00"
  }
};

export default function ShippingPolicyPage() {
  return (
    <>
      <Script id="shipping-schema" type="application/ld+json">
        {JSON.stringify(shippingSchema)}
      </Script>

      <div className="font-sans text-[#333] leading-[1.7] bg-white">
        <Breadcrumbs />
        
        <div className="max-w-[900px] mx-auto px-[15px] py-10">

          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-[32px] font-bold text-[#1a1a1a] mb-[15px]">Shipping & Delivery Policy</h1>
            <p className="text-center text-[18px] text-[#555] max-w-[700px] mx-auto mb-[30px]">
              We are committed to delivering your **kids electric bike**, spare parts, and accessories quickly and safely across Australia using our trusted partner, Transdirect.
            </p>
          </div>

          {/* Section 1: Processing Time */}
          <div className="mb-10">
            <h2 className="text-[24px] font-semibold text-[#1a1a1a] mb-5 pb-[10px] border-b-2 border-[#f0f0f0]">Order Processing & Handling</h2>
            <p className="text-base mb-[15px]">All orders, including **childrens electric motorbikes** and parts, are processed within <strong className="font-semibold text-[#1a1a1a]">1-2 business days</strong> (excluding weekends and holidays) after receiving your order confirmation email.</p>
            
            <div className="bg-[#f8f9fa] border-l-4 border-[#007bff] p-5 rounded-r-lg my-5">
              <p className="text-base mb-0"><strong className="font-semibold text-[#1a1a1a]">Note:</strong> You will receive another notification when your order has shipped, including your tracking number.</p>
            </div>
          </div>

          {/* Section 2: Delivery Estimates */}
          <div className="mb-10">
            <h2 className="text-[24px] font-semibold text-[#1a1a1a] mb-5 pb-[10px] border-b-2 border-[#f0f0f0]">Domestic Shipping Estimates (Australia)</h2>
            <p className="text-base mb-[15px]">We use <strong className="font-semibold text-[#1a1a1a]">Transdirect</strong> to find the fastest and most affordable courier services for your **australia electric bike** order.</p>
            
            <ul className="list-none pl-0 mb-[15px]">
              <li className="relative pl-[30px] mb-[10px] text-base before:content-['✓'] before:text-[#28a745] before:font-bold before:absolute before:left-0 before:top-[1px]">
                <strong className="font-semibold text-[#1a1a1a]">Metro Areas (VIC, NSW, QLD, SA):</strong> 2-5 business days.
              </li>
              <li className="relative pl-[30px] mb-[10px] text-base before:content-['✓'] before:text-[#28a745] before:font-bold before:absolute before:left-0 before:top-[1px]">
                <strong className="font-semibold text-[#1a1a1a]">WA & Regional Areas:</strong> 5-10 business days depending on remoteness.
              </li>
            </ul>
          </div>

          {/* Section 3: Batteries Shipping */}
          <div className="mb-10">
            <h2 className="text-[24px] font-semibold text-[#1a1a1a] mb-5 pb-[10px] border-b-2 border-[#f0f0f0]">Shipping E-Bike Batteries</h2>
            <p className="text-base mb-[15px]">Please note that batteries for **electric cycles Australia** are classified as <strong className="font-semibold text-[#1a1a1a]">Dangerous Goods (DG)</strong>. Because of this:</p>
            <ul className="list-disc pl-[20px] text-base mb-[15px]">
               <li className="mb-[10px]">They cannot be shipped via Express Air services.</li>
               <li className="mb-[10px]">They are strictly road freight only to ensure safety.</li>
               <li className="mb-[10px]">Shipping to PO Boxes or Parcel Lockers is generally <strong>not available</strong> for batteries. Please provide a physical street address.</li>
            </ul>
          </div>

          {/* Section 4: Tracking */}
          <div className="mb-10 bg-[#f8f9fa] p-[30px] rounded-xl">
             <h2 className="text-[24px] font-semibold text-[#1a1a1a] mb-5 pb-[10px] border-b-2 border-[#f0f0f0]">How do I check the status of my order?</h2>
             <p className="text-base mb-[15px]">
               When your **balancing bikes** or accessories have shipped, you will receive an email notification from us which will include a tracking number. 
             </p>
             <p className="text-base">
               You can track your order directly on our <Link href="/track-order" className="text-[#007bff] font-semibold underline">Tracking Page</Link> or via the courier's website.
             </p>
          </div>
          
          {/* Section 5: Helpful Links & Resources */}
          <div className="mb-10 bg-[#f8f9fa] p-[30px] rounded-xl border border-[#e9e9e9]">
             <h2 className="text-[24px] font-semibold text-[#1a1a1a] mb-5 pb-[10px] border-b-2 border-[#f0f0f0]">
               Looking for something else?
             </h2>
             <p className="text-base mb-[20px] text-[#555]">
               Explore our other policies and pages to find exactly what you need:
             </p>
             
             <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 list-none pl-0">
               <li>
                 <Link href="/refund-and-returns-policy" className="flex items-center text-[#007bff] font-semibold hover:underline group">
                   <span className="w-2 h-2 bg-[#007bff] rounded-full mr-3 group-hover:scale-125 transition-transform"></span>
                   Refund & Returns Policy
                 </Link>
               </li>

               <li>
                 <Link href="/contact" className="flex items-center text-[#007bff] font-semibold hover:underline group">
                   <span className="w-2 h-2 bg-[#007bff] rounded-full mr-3 group-hover:scale-125 transition-transform"></span>
                   Contact Support
                 </Link>
               </li>
               <li>
                 <Link href="/faq" className="flex items-center text-[#007bff] font-semibold hover:underline group">
                   <span className="w-2 h-2 bg-[#007bff] rounded-full mr-3 group-hover:scale-125 transition-transform"></span>
                   Frequently Asked Questions
                 </Link>
               </li>
               <li>
                 <Link href="/terms-and-conditions" className="flex items-center text-[#007bff] font-semibold hover:underline group">
                   <span className="w-2 h-2 bg-[#007bff] rounded-full mr-3 group-hover:scale-125 transition-transform"></span>
                   Terms & Conditions
                 </Link>
               </li>
               <li>
                 <Link href="/privacy-policy" className="flex items-center text-[#007bff] font-semibold hover:underline group">
                   <span className="w-2 h-2 bg-[#007bff] rounded-full mr-3 group-hover:scale-125 transition-transform"></span>
                   Privacy Policy
                 </Link>
               </li>
             </ul>
          </div>

          {/* Contact Block */}
          <div className="border border-[#e9e9e9] p-[30px] rounded-xl mt-[30px]">
              <p className="text-base mb-0">
                <strong className="font-semibold text-[#1a1a1a]">Questions about your order?</strong><br />
                Email us at: <a href="mailto:support@gobike.au" className="text-[#007bff] font-semibold underline">gobike@gobike.au</a>
              </p>
          </div>

        </div>
      </div>
    </>
  );
}