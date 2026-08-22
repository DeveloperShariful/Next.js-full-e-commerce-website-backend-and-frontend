import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import type { Metadata } from 'next';
import { Home, Bike, Wrench, Shirt, BookOpen, Shield, ChevronRight, ShieldCheck, Store, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'HTML Sitemap | GoBike Australia',
  description: 'Browse the complete sitemap of GoBike Australia — all product pages, spare parts, blog guides, and policy pages in one place.',
  alternates: { canonical: '/sitemap' },
  openGraph: {
    title: 'HTML Sitemap | GoBike Australia',
    description: 'Browse every page on GoBike Australia — kids electric bikes, spare parts, accessories, blog articles, and policies.',
    url: 'https://gobike.au/sitemap',
    siteName: 'GoBike Australia',
    locale: 'en_AU',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://gobike.au' },
    { '@type': 'ListItem', position: 2, name: 'Sitemap', item: 'https://gobike.au/sitemap' },
  ],
};

function SitemapLink({ href, label, indent }: { href: string; label: string; indent?: boolean }) {
  return (
    <li className={indent ? 'pl-4 border-l border-[#e5e7eb]' : ''}>
      <Link
        href={href}
        className="group flex items-center gap-1.5 text-[14px] text-[#16a34a] hover:text-[#15803d] py-[5px] transition-colors"
      >
        <ChevronRight size={12} className="text-[#16a34a] group-hover:text-[#15803d] shrink-0 transition-colors" />
        <span className="group-hover:underline underline-offset-2">{label}</span>
      </Link>
    </li>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9ca3af] mt-4 mb-1 pl-4 border-l border-[#e5e7eb]">
      {children}
    </p>
  );
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  count: number;
  children: React.ReactNode;
  wide?: boolean;
}

function Section({ icon, title, count, children, wide }: SectionProps) {
  return (
    <div className={`bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden${wide ? ' md:col-span-2' : ''}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#e5e7eb] bg-[#fafafa]">
        <div className="w-9 h-9 bg-[#ffcc00] rounded-xl flex items-center justify-center shrink-0">
          {icon}
        </div>
        <h2 className="text-[15px] font-bold text-[#111827] flex-1">{title}</h2>
        <span className="text-[11px] font-semibold bg-[#f3f4f6] text-[#6b7280] px-2.5 py-1 rounded-full">
          {count} pages
        </span>
      </div>
      {/* Links */}
      <div className="px-5 py-4">
        {children}
      </div>
    </div>
  );
}

export default function SitemapPage() {
  return (
    <div className="bg-[#f9fafb] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs />

      <div className="max-w-[1100px] mx-auto px-4 py-12">

        {/* Hero */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-[#ffcc00] text-black text-[11px] font-bold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wider">
            <span>🗺</span> Complete Sitemap
          </div>
          <h1 className="text-[34px] sm:text-[42px] font-extrabold text-[#111827] tracking-tight leading-tight mb-3">
            GoBike Website Sitemap
          </h1>
          <p className="text-[16px] text-[#6b7280] max-w-[560px]">
            Every page, product, and guide — organised by category so you can find exactly what you need.
          </p>
        </div>

        {/* Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* 1. Main Pages */}
          <Section icon={<Home size={17} />} title="Main Pages" count={7}>
            <ul>
              <SitemapLink href="/" label="Home" />
              <SitemapLink href="/shop" label="Shop All Products" />
              <SitemapLink href="/about" label="About GoBike" />
              <SitemapLink href="/contact" label="Contact Us" />
              <SitemapLink href="/faq" label="FAQs" />
              <SitemapLink href="/warranty" label="Warranty Claim" />
              <SitemapLink href="/retailers" label="Authorised Retailers" />
            </ul>
          </Section>

          {/* 2. Kids Electric Bikes */}
          <Section icon={<Bike size={17} />} title="Kids Electric Bikes" count={5}>
            <ul>
              <SitemapLink href="/bikes" label="All Kids Electric Bikes" />
              <SitemapLink href="/product/ebike-for-kids-12-inch-electric-bike-ages-2-5" label='GoBike 12" Balance Bike (Ages 2–5)' indent />
              <SitemapLink href="/product/ebike-for-sale-16-inch-gobike-ages-5-9" label='GoBike 16" Electric Bike (Ages 5–9)' indent />
              <SitemapLink href="/product/20-inch-electric-bikes-for-sale-ebike-for-kids" label='GoBike 20" Electric Bike (Ages 8–14)' indent />
              <SitemapLink href="/product/gobike-24-inch-electric-bike-teens-high-speed-performance-for-ages-13" label='GoBike 24" Electric Bike (Ages 13+)' indent />
            </ul>
          </Section>

          {/* 3. Spare Parts — wide */}
          <Section icon={<Wrench size={17} />} title="Spare Parts & Accessories" count={22} wide>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <div>
                <ul>
                  <SitemapLink href="/electric-bike-parts" label="All Spare Parts & Accessories" />
                </ul>
                <SubLabel>Sub-categories</SubLabel>
                <ul>
                  <SitemapLink href="/electric-bike-parts/battery" label="Electric Bike Batteries" indent />
                  <SitemapLink href="/electric-bike-parts/tyre-and-tube" label="Tyres & Tubes" indent />
                  <SitemapLink href="/electric-bike-parts/motors" label="Motors & Components" indent />
                </ul>
                <SubLabel>Batteries & Chargers</SubLabel>
                <ul>
                  <SitemapLink href="/product/official-5ah-replacement-battery-for-gobike-12-and-16-inch" label='Official 5Ah Battery (12" & 16")' indent />
                  <SitemapLink href="/product/official-high-capacity-10ah-replacement-battery-for-gobike-20-inch-extended-range" label='Official 10Ah Battery (20")' indent />
                  <SitemapLink href="/product/official-48v-15ah-high-performance-battery-for-gobike-24inch-pro" label='Official 48V 15Ah Battery (24" Pro)' indent />
                  <SitemapLink href="/product/official-replacement-charger-for-gobike-electric-balance-bikes" label="Official Replacement Charger" indent />
                </ul>
                <SubLabel>Motors & Electronics</SubLabel>
                <ul>
                  <SitemapLink href="/product/12-inch-motor" label='12" Motor' indent />
                  <SitemapLink href="/product/16inch-hub-motor" label='16" Hub Motor' indent />
                  <SitemapLink href="/product/20-inch-motor" label='20" Motor' indent />
                  <SitemapLink href="/product/12inch-controller" label='12" Controller' indent />
                  <SitemapLink href="/product/replacement-twist-throttle-with-lcd-display-for-gobike-16-20" label='Twist Throttle with LCD Display (16" & 20")' indent />
                  <SitemapLink href="/product/12inch-and-16inch-plastic-kit" label='12" & 16" Plastic Kit' indent />
                </ul>
              </div>
              <div>
                <SubLabel>Tyres & Inner Tubes</SubLabel>
                <ul>
                  <SitemapLink href="/product/premium-12-inch-off-road-replacement-tyre-for-gobike-kids-electric-balance-bike-high-grip-durable" label='Premium 12" Off-Road Tyre' indent />
                  <SitemapLink href="/product/premium-16-inch-heavy-duty-off-road-replacement-tyre-for-gobike-kids-electric-bike" label='Premium 16" Heavy-Duty Tyre' indent />
                  <SitemapLink href="/product/original-kenda-20x260-off-road-tyre-for-gobike-20-electric-bike-premium-high-grip-rubber" label="KENDA 20×2.60 Off-Road Tyre" indent />
                  <SitemapLink href="/product/original-kenda-24x260-high-performance-tyre-for-gobike-24-electric-bike-all-terrain-grip" label="KENDA 24×2.60 All-Terrain Tyre" indent />
                  <SitemapLink href="/product/heavy-duty-12-inch-inner-tube-12x240-for-gobike-kids-electric-balance-bike-schrader-valve" label='12" Heavy-Duty Inner Tube (Schrader)' indent />
                  <SitemapLink href="/product/16-inch-heavy-duty-inner-tube-for-electric-balance-bikes-for-easy-inflation" label='16" Heavy-Duty Inner Tube' indent />
                  <SitemapLink href="/product/genuine-kenda-20-inch-heavy-duty-inner-tube-for-gobike-20-inch-bike-schrader-valve" label='KENDA 20" Inner Tube (Schrader)' indent />
                  <SitemapLink href="/product/heavy-duty-kenda-inner-tube-for-gobike-24-inch-bike-tyre" label='KENDA 24" Inner Tube' indent />
                </ul>
              </div>
            </div>
          </Section>

          {/* 4. Expert Advice */}
          <Section icon={<BookOpen size={17} />} title="Expert Advice & Guides" count={13}>
            <ul>
              <SitemapLink href="/blog" label="GoBike Hub & Blog" />
              <SitemapLink href="/blog/best-kids-electric-bikes-australia-2025" label="7 Best Kids Electric Bikes in Australia (2025 Guide)" indent />
              <SitemapLink href="/blog/how-to-choose-best-electric-balance-bike-for-kids" label="How to Choose the Best Electric Balance Bike" indent />
              <SitemapLink href="/blog/what-age-for-electric-balance-bike" label="What Age Is Right for a Kids Electric Balance Bike?" indent />
              <SitemapLink href="/blog/kids-electric-bike-safety-guide-australia" label="Kids Electric Bike Safety Guide (Australia)" indent />
              <SitemapLink href="/blog/kids-electric-bike-laws-australia-2026" label="Are Kids' Electric Bikes Legal in Australia? (2026)" indent />
              <SitemapLink href="/blog/electric-vs-petrol-dirt-bikes-kids" label="Electric vs. Petrol Dirt Bikes for Kids" indent />
              <SitemapLink href="/blog/how-to-maintain-electric-kids-bike-battery" label="Kids Electric Bike Battery Maintenance Guide" indent />
              <SitemapLink href="/blog/gobike-maintenance-tips" label="Simple GoBike Maintenance Checklist" indent />
              <SitemapLink href="/blog/renting-vs-buying-an-e-bike-for-food-delivery-in-australia-which-is-right-for-you" label="Renting vs. Buying an E-Bike for Food Delivery" indent />
              <SitemapLink href="/blog/psychology-of-balance" label="The Psychology of Balance" indent />
              <SitemapLink href="/blog/riding-with-friends-social-benefits" label="How Biking with Mates Boosts Social Skills" indent />
              <SitemapLink href="/blog/green-time-antidote" label="Why 'Green Time' Beats Digital Fatigue" indent />
            </ul>
          </Section>

          {/* 6. Customer Info */}
          <Section icon={<Shield size={17} />} title="Customer Info & Policies" count={5}>
            <ul>
              <SitemapLink href="/discount" label="Unlock 5% Off Your Order" />
              <SitemapLink href="/shipping-policy" label="Shipping & Delivery Policy" />
              <SitemapLink href="/refund-and-returns-policy" label="Refund & Returns Policy" />
              <SitemapLink href="/privacy-policy" label="Privacy Policy" />
              <SitemapLink href="/terms-and-conditions" label="Terms & Conditions" />
            </ul>
          </Section>

          {/* 7. Apparel */}
          <Section icon={<Shirt size={17} />} title="Apparel" count={2}>
            <ul>
              <SitemapLink href="/apparel" label="GoBike Apparel" />
              <SitemapLink href="/product/gobike-crew-t-shirt-premium-kids-riding-apparel" label="GoBike Crew T-Shirt" indent />
            </ul>
          </Section>

          {/* 8. Community */}
          <Section icon={<Users size={17} />} title="GoBike Community" count={1}>
            <ul>
              <SitemapLink href="/community" label="GoBike Community — Rider Photos & Videos" />
            </ul>
          </Section>

        </div>

        {/* Bottom summary bar */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 bg-white border border-[#e5e7eb] rounded-2xl px-6 py-4">
          <p className="text-[13px] text-[#6b7280]">
            <span className="font-bold text-[#111827]">57 pages</span> across 8 categories &nbsp;·&nbsp; Last updated July 2026
          </p>
          <Link href="/" className="text-[13px] font-semibold text-black hover:text-[#555] flex items-center gap-1 transition-colors">
            ← Back to GoBike Home
          </Link>
        </div>

      </div>
    </div>
  );
}
