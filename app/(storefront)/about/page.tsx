// app/about/page.tsx

import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About GoBike Australia | Our Story & Mission',
  description: 'Discover GoBike Australia and our mission to build safe, fun, and high-performance kids e-bikes, backed by our commitment to quality and local Aussie service.',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About GoBike Australia | Our Story & Mission',
    description: 'Discover GoBike Australia and our mission to build safe, fun, and high-performance kids e-bikes, backed by our commitment to quality and local Aussie service.',
    url: 'https://gobike.au/about',
    siteName: 'GoBike Australia',
    images: [
      {
        url: 'https://gobikes.au/wp-content/uploads/2025/11/shop-now-gobike-12-ebike-sale.jpg', 
        width: 1200,
        height: 857,
        alt: 'GoBike Australia About us',
      },
    ],
    locale: 'en_AU',
    type: 'website',
  },
};

export default function AboutPage() {
  return (
    <div>
      <Breadcrumbs />
      
      {/* .about-us-page-wrapper replaced */}
      <div className="font-sans text-[#333] leading-[1.8]">
        
        {/* Section 1: Main Header */}
        {/* .section-container replaced */}
        <div className="max-w-[1500px] mx-auto mt-[35px] mb-[30px] px-[10px]">
          {/* h1 replaced */}
          <h1 className="text-[35px] font-extrabold text-[#1a1a1a] text-center mb-5 tracking-[-1.5px] leading-snug">
            Our Story: More Than Just a kids eBike
          </h1>
          {/* .intro-text replaced */}
          <p className="text-[20px] text-[#555] text-center max-w-[750px] mx-auto">
            Welcome to GoBike! We&apos;re not just another brand; we are a community born from a passion for adventure, family, and the pure joy of riding. Our journey began with a simple mission: to create the <strong><Link href="/" className="text-black underline">best kids electric bike</Link></strong> in Australia.
          </p>
        </div>

        {/* Section 2: Our Story (with Image) */}
        <div className="max-w-[1500px] mx-auto mt-[35px] mb-[30px] px-[10px]">
          {/* .story-grid replaced (includes responsive layout) */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-10 md:gap-[60px] items-center mt-10">
            <div>
              {/* .story-image replaced */}
              <Image 
                src="https://gobikes.au/wp-content/uploads/2025/08/gobike-scaled.webp" 
                alt="The founders of GoBike, two Australian dads, with their kids and their electric balance bikes." 
                className="w-full h-auto rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.1)]"
                loading="eager"
                width={2049} height={2560} sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            {/* .story-content replaced */}
            <div>
              {/* h2 replaced */}
              <h2 className="text-[32px] font-bold text-[#1a1a1a] mb-5">
                Founded by Two Dads, Fuelled by Fun
              </h2>
              <p className="mb-4">
                As two mates from the Macarthur Region, NSW, our story started in our own backyards. We saw the excitement in our kids&apos; eyes as they rode their first bikes (shoutout to STACYC!). We became addicted to modifying them, making them faster, better, and more fun.
              </p>
              <p>
                This weekend hobby quickly grew into a passion. We realised we could build our own brand—one that blended thrilling performance with the safety every parent demands. In 2023, GoBike was born.
              </p>
            </div>
          </div>
        </div>
      
        {/* Section 3: Our Vision */}
        <div className="max-w-[1500px] mx-auto mt-[35px] mb-[30px] px-[10px]">
          <h2 className="text-[32px] font-bold text-[#1a1a1a] mb-5 text-center">What We Envisioned</h2>
          {/* .vision-grid replaced */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[25px]">
            {/* .vision-card replaced */}
            <div className="bg-[#f8f9fa] p-[30px] rounded-xl border border-[#e9ecef]">
              <h3 className="text-[20px] font-bold mb-[10px] text-[#1a1a1a]">Adventure, Anywhere</h3>
              <p>Electric dirt bikes that kids could ride anytime, anywhere, building confidence with every lap.</p>
            </div>
            <div className="bg-[#f8f9fa] p-[30px] rounded-xl border border-[#e9ecef]">
              <h3 className="text-[20px] font-bold mb-[10px] text-[#1a1a1a]">Performance & Affordability</h3>
              <p>A perfect blend of power and price, solving the problem of expensive or low-performance bikes in the Aussie market.</p>
            </div>
            <div className="bg-[#f8f9fa] p-[30px] rounded-xl border border-[#e9ecef]">
              <h3 className="text-[20px] font-bold mb-[10px] text-[#1a1a1a]">Safety & Durability</h3>
              <p>Low-maintenance, reliable, and tough enough for inexperienced riders, making them a smarter choice than intimidating petrol bikes.</p>
            </div>
          </div>
        </div>

        {/* Section 4: Our Commitment (with Outbound Links) */}
        <div className="max-w-[1500px] mx-auto mt-[35px] mb-[30px] px-[10px]">
          {/* .commitment-section replaced */}
          <div className="bg-black text-white p-[50px] rounded-2xl text-center">
            <h2 className="text-[32px] font-bold text-white mb-5">Our Commitment to Quality & Safety</h2>
            <p className="text-[#ddd]">
              We are proud to be part of Australia’s growing e-rider community. Every <strong>electric balance bike</strong> we deliver is backed by our commitment to the highest standards.
            </p>
            {/* ul li replaced */}
            <ul className="list-none p-0 mx-auto mt-[30px] text-left max-w-[600px]">
              <li className="mb-[10px] text-[17px] text-[#ccc]">
                ✓ We follow the standards set by the <a href="https://www.bikeindustry.com.au/" target="_blank" rel="noopener noreferrer" className="text-[#ffcc00] underline">Australian Bicycle Industry Association</a>.
              </li>
              <li className="mb-[10px] text-[17px] text-[#ccc]">
                ✓ We comply with <a href="https://www.productsafety.gov.au/product-safety-laws" target="_blank" rel="noopener noreferrer" className="text-[#ffcc00] underline">ACCC Product Safety Guidelines</a>.
              </li>
              <li className="mb-[10px] text-[17px] text-[#ccc]">
                ✓ We align with sustainable transport goals promoted by the <a href="https://www.infrastructure.gov.au/" target="_blank" rel="noopener noreferrer" className="text-[#ffcc00] underline">Australian Government</a>.
              </li>
            </ul>
          </div>
        </div>
      
        {/* Section 5: Why Choose GoBike? */}
        <div className="max-w-[1500px] mx-auto mt-[35px] mb-[30px] px-[10px]">
          <h2 className="text-[32px] font-bold text-[#1a1a1a] mb-5 text-center">Why Choose GoBike?</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[25px]">
            <div className="bg-[#f8f9fa] p-[30px] rounded-xl border border-[#e9ecef]">
              <h3 className="text-[20px] font-bold mb-[10px] text-[#1a1a1a]">Highest Performance</h3>
              <p>Our bikes are built to last, featuring powerful and reliable motors that deliver an unbeatable riding experience and the best performance in the market.</p>
            </div>
            <div className="bg-[#f8f9fa] p-[30px] rounded-xl border border-[#e9ecef]">
              <h3 className="text-[20px] font-bold mb-[10px] text-[#1a1a1a]">1 Year Warranty</h3>
              <p>We stand by our quality. Every GoBike is backed by a 1-year advanced replacement warranty and unbeatable Aussie customer service.</p>
            </div>
            <div className="bg-[#f8f9fa] p-[30px] rounded-xl border border-[#e9ecef]">
              <h3 className="text-[20px] font-bold mb-[10px] text-[#1a1a1a]">Join The Community</h3>
              <p>You’re not just getting a top-quality product; you’re joining a community that values adventure and family fun. See why families across Australia choose GoBike!</p>
            </div>
          </div>
        </div>
      
        {/* Section 6: Final Call to Action */}
        <div className="max-w-[1500px] mx-auto mt-[35px] mb-[30px] px-[10px] text-center">
          <h2 className="text-[32px] font-bold text-[#1a1a1a] mb-5">Our Mission is to Power Adventure, Confidence, and Freedom—One Ride at a Time.</h2>
          {/* .final-cta-button replaced */}
          <Link 
            href="/shop" 
            className="inline-block bg-[#ffcc00] text-black font-bold px-10 py-4 rounded-full no-underline text-[18px] mt-[30px] transition-transform duration-300 ease-in-out hover:scale-105"
          >
              Explore The Bikes
          </Link>
        </div>

      </div>
   </div>
  );
}