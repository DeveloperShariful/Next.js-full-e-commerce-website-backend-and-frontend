// app/terms-and-conditions/page.tsx


import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs'; 
import type { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'Terms and Conditions | GoBike Australia',
  description: 'Please read the official terms and conditions for using the GoBike Australia website, purchasing products, and our warranty policies.',
  alternates: {
    canonical: '/terms-and-conditions',
  },
  openGraph: {
    title: 'Terms and Conditions | GoBike Australia',
    description: 'Please read the official terms and conditions for using the GoBike Australia website, purchasing products, and our warranty policies.',
    url: 'https://gobike.au/terms-and-conditions',
    siteName: 'GoBike Australia',
    images: [
      {
        url: 'https://gobikes.au/wp-content/uploads/2025/11/gobike-au-1-year-warranty-kids-ebikes.jpg', 
        width: 1200,
        height: 857,
        alt: 'GoBike Australia Terms and Conditions',
      },
    ],
    locale: 'en_AU',
    type: 'website',
  },
};


export default function TermsAndConditionsPage() {
  return (
    <div>
      <Breadcrumbs />
      {/* .termsPageWrapper replaced */}
      <div className="font-sans text-[#333] leading-[1.8] text-[17px] max-w-[1000px] mx-auto px-[1.3rem]"> 
        
        {/* .termsHeader replaced */}
        <div className="text-center px-[2px] pb-[2px] border-b border-[#e9e9e9] mb-10">
          <h1 className="text-[35px] font-extrabold text-[#1a1a1a] mb-[15px] tracking-[-1.5px] leading-[1.3]">Terms and Conditions</h1>
          <p className="text-[18px] text-[#555] max-w-[700px] mx-auto">Welcome to GoBike.au! These terms outline the rules for using our website and purchasing our <strong className="text-[#1a1a1a]">kids electric bikes</strong>. By engaging with our services, you agree to these conditions.</p>
        </div>
        
        {/* .termsHighlightBox replaced */}
        <div className="bg-[#f8f9fa] p-[30px] rounded-2xl border-l-[5px] border-[#007bff] my-[30px]">
          <p className="m-0 text-[18px] italic text-[#333]"><strong className="text-[#1a1a1a]">Our Commitment to You:</strong> By choosing GoBike, you’re investing in more than just a premium ride. You’re joining a community that values adventure, quality family time, and is backed by friendly, reliable Aussie support. Make every ride a memory with GoBike.</p>
        </div>

        {/* .termsSection replaced (Reusable Styles) */}
        <div className="mb-10">
          <h2 className="text-[26px] font-bold text-[#1a1a1a] mb-5 pb-[10px] border-b-2 border-[#f0f0f0]">1. Definitions</h2>
          <p><strong className="text-[#1a1a1a]">“GoBike”</strong>, “we”, “us” refers to our company and website, <Link href="https://gobike.au/" className="text-[#007bff] font-semibold no-underline hover:underline">GoBike.au</Link>. <strong className="text-[#1a1a1a]">“User”</strong>, “you” refers to any visitor or customer. <strong className="text-[#1a1a1a]">“Products”</strong> include our entire range of <strong className="text-[#1a1a1a]"><Link href="/bikes" className="text-[#007bff] font-semibold no-underline hover:underline">electric balance bikes</Link></strong> and <Link href="/shop" className="text-[#007bff] font-semibold no-underline hover:underline">accessories</Link>.</p>
        </div>

        <div className="mb-10">
          <h2 className="text-[26px] font-bold text-[#1a1a1a] mb-5 pb-[10px] border-b-2 border-[#f0f0f0]">2. Eligibility and Safe Use</h2>
          <p>Our products are designed for children aged 2 to 16. All purchases must be completed by an adult. For the safety of your child, we strongly recommend adult supervision during rides and the use of appropriate safety gear, such as helmets.</p>
        </div>

        <div className="mb-10">
          <h2 className="text-[26px] font-bold text-[#1a1a1a] mb-5 pb-[10px] border-b-2 border-[#f0f0f0]">3. Orders and Payments</h2>
          <p>All prices are listed in Australian Dollars (AUD) and are inclusive of GST where applicable. Payments are processed securely through our approved gateways. We reserve the right to cancel or modify any order at our discretion, subject to stock availability.</p>
        </div>

        <div className="mb-10">
          <h2 className="text-[26px] font-bold text-[#1a1a1a] mb-5 pb-[10px] border-b-2 border-[#f0f0f0]">4. Shipping and Delivery</h2>
          <p>We ship our <strong className="text-[#1a1a1a]">Ebike Melbourne</strong> stock and other products across Australia. While delivery times are estimates, we partner with reliable carriers like <a href="https://www.transdirect.com.au/services/interstate-couriers/" target="_blank" rel="noopener noreferrer" className="text-[#007bff] font-semibold no-underline hover:underline">Transdirect All Courier </a> to ensure timely delivery. GoBike is not liable for delays caused by third-party couriers.</p>
        </div>

        <div className="mb-10">
          <h2 className="text-[26px] font-bold text-[#1a1a1a] mb-5 pb-[10px] border-b-2 border-[#f0f0f0]">5. Returns, Refunds, and Warranty</h2>
          <p>Your satisfaction is important to us. Returns are accepted within 14 days for products in their original, unused condition. Every <strong className="text-[#1a1a1a]">kids electric motorbike</strong> is also covered by our full <strong className="text-[#1a1a1a]">1-year warranty</strong>. For more details, please see our <Link href="/refund-and-returns-policy" className="text-[#007bff] font-semibold no-underline hover:underline">Refund and Returns Policy</Link> page.</p>
        </div>

        <div className="mb-10">
          <h2 className="text-[26px] font-bold text-[#1a1a1a] mb-5 pb-[10px] border-b-2 border-[#f0f0f0]">6. Our Commitment to Australian Consumer Law</h2>
          <p>At GoBike, we are committed to fair and transparent practices. We adhere strictly to the guidelines set forth by the <a href="https://www.accc.gov.au/" target="_blank" rel="noopener noreferrer" className="text-[#007bff] font-semibold no-underline hover:underline">Australian Competition and Consumer Commission (ACCC)</a>, ensuring your rights under the Australian Consumer Law are always protected.</p>
        </div>
        
        <div className="mb-10">
          <h2 className="text-[26px] font-bold text-[#1a1a1a] mb-5 pb-[10px] border-b-2 border-[#f0f0f0]">7. Privacy</h2>
          <p>Your privacy is of utmost importance. To understand how we collect, use, and protect your personal data, please review our comprehensive <Link href="/privacy-policy" className="text-[#007bff] font-semibold no-underline hover:underline">Privacy Policy</Link>.</p>
        </div>

        <div className="mb-10">
          <h2 className="text-[26px] font-bold text-[#1a1a1a] mb-5 pb-[10px] border-b-2 border-[#f0f0f0]">8. Contact Us</h2>
          <p>For any questions regarding these terms, your order, or choosing the right <strong className="text-[#1a1a1a]">ebike for kids</strong>, please visit our <Link href="/contact" className="text-[#007bff] font-semibold no-underline hover:underline">Contact Us page</Link> or email us directly at <a href="mailto:gobike@gobike.au" className="text-[#007bff] font-semibold no-underline hover:underline">gobike@gobike.au</a>. Our expert team is ready to help! For quick answers, you can also visit our <Link href="/faq" className="text-[#007bff] font-semibold no-underline hover:underline">FAQs</Link> page.</p>
        </div>
        
      </div>
    </div>
  );
}