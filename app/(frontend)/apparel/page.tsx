// app/(frontend)/apparel/page.tsx

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '@/components/ProductCard';
import PaginationControls from '../shop/_components/PaginationControls';
import Breadcrumbs from '@/components/Breadcrumbs';
import { getProductsAndCategoriesAction } from '@/app/actions/frontend/shop/get-shop-products';

const PRODUCTS_PER_PAGE = 12;

// --- SEO: Dynamic Metadata Function ---
export async function generateMetadata({ searchParams }: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  
  // ★ GraphQL এর after/before এর বদলে নতুন page প্যারামিটার ব্যবহার করা হচ্ছে
  const pageParam = resolvedSearchParams.page;
  const pageNum = pageParam && !Array.isArray(pageParam) ? parseInt(pageParam, 10) : 1;
  const isPaged = pageNum > 1;

  const title = isPaged 
    ? `Shop GoBike Kids T-Shirts | Page ${pageNum} | Premium Riding Apparel Australia` 
    : "Shop GoBike Kids T-Shirts | Premium Riding Apparel Australia";
  const description = "Explore the official GoBike apparel collection. Comfortable, durable, and stylish T-shirts for kids who love to ride. Shop premium cotton riding gear online!";
  
  let canonicalUrl = '/apparel';
  if (isPaged) {
    canonicalUrl += `?page=${pageNum}`;
  }

  // ★★★ AEO/GEO: সার্চ ইঞ্জিন ও Ahrefs-এর জন্য Freshness Signal (Current Date) ★★★
  const currentDate = new Date().toISOString();

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: title,
      description: description,
      url: `https://gobike.au${canonicalUrl}`,
      siteName: 'GoBike Australia',
      images: [
        {
          url: 'https://gobikes.au/wp-content/uploads/2025/11/gobike-apparel-collection.jpg', 
          width: 1200,
          height: 857,
          alt: 'Kid wearing GoBike official t-shirt smiling',
        },
      ],
      locale: 'en_AU',
      type: 'website',
    },
    other: {
      'article:modified_time': currentDate, 
      'og:updated_time': currentDate, 
      'last-modified': currentDate,
    }
  };
}

// --- Page Component ---
export default async function ApparelPage({ searchParams }: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const pageParam = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page, 10) : 1;
  const currentPage = isNaN(pageParam) ? 1 : pageParam;

  // 🚀 GraphQL এর বদলে আমাদের Prisma Server Action কল করা হচ্ছে
  // "apparel" ক্যাটাগরির স্লাগ পাঠিয়ে দেওয়া হলো
  const { products, pageInfo } = await getProductsAndCategoriesAction(
    "apparel",
    PRODUCTS_PER_PAGE,
    currentPage
  );

 // --- Schema Markup / Structured Data Updated for Apparel ---
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': 'GoBike Kids Apparel & T-Shirts',
    'description': 'Browse our collection of premium cotton t-shirts and apparel for kids.',
    'itemListElement': products.map((product, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'item': {
        '@type': 'Product',
        'name': product.name,
        'url': `https://gobike.au/product/${product.slug}`, // Changed to general product slug path
        'image': product.image?.sourceUrl,
        'description': `Buy ${product.name}. High-quality, comfortable GoBike branded apparel for kids.`,
        'sku': product.databaseId.toString(),
        'brand': {
          '@type': 'Brand',
          'name': 'GoBike'
        },
        'offers': {
          '@type': 'Offer',
          'priceCurrency': 'AUD',
          'price': product.salePrice 
            ? product.salePrice.replace(/[^0-9.]+/g, "") 
            : product.regularPrice?.replace(/[^0-9.]+/g, ""),
          'availability': 'https://schema.org/InStock',
          'url': `https://gobike.au/product/${product.slug}`
        }
      }
    }))
  };

  return (
    <div>
      {/* ★★★ Schema Injection ★★★ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs pageTitle="GoBike T-Shirts & Apparel" />
      <div className="max-w-[1300px] mx-auto px-1.5 font-sans">
        
        {/* --- Header Banner --- */}
        <header className="flex flex-col md:flex-row items-center gap-6 md:gap-12 mb-8 md:mb-12 bg-gray-50 rounded-lg md:rounded-xl p-4 md:p-12">
          <div className="flex-1 text-center md:text-left w-full">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 md:mb-4 leading-tight">
              Ride in Style with Official GoBike T-Shirts
            </h1>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto md:mx-0">
              Complete the look! Our premium cotton T-shirts are designed for comfort, durability, and cool kids who love their electric bikes. Wear the adventure.
            </p>
          </div>
          <div className="flex-1 w-full max-w-[580px]">
              <Image 
                  src="https://gobikes.au/wp-content/uploads/2025/09/Gobike-kids-electric-bike-ebike-for-kids-scaled.webp"
                  alt="Kid wearing GoBike branded t-shirt"
                  width={600}
                  height={600}
                  priority={true}
                  className="w-full h-auto object-cover rounded-lg shadow-lg hover:scale-105 transition-transform duration-300"
              />
          </div>
        </header>

        {/* --- Products Grid --- */}
        <main className="mb-16">
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 text-xl py-10">No apparel found.</p>
          )}
          
          <div className="mt-10 flex justify-center">
            {/* pageInfo পাস করা হলো আমাদের নতুন PaginationControls এর জন্য */}
            <PaginationControls pageInfo={pageInfo} basePath="/apparel" />
          </div>
        </main>

        {/* --- Why Choose Us Section --- */}
        <section className="flex flex-col md:flex-row items-center gap-8 md:gap-16 bg-white border border-gray-100 rounded-lg md:rounded-xl p-4 py-8 md:p-10 shadow-sm mb-12 md:mb-16">
          <div className="w-full md:w-1/2 flex justify-center">
               <Image 
                  src="https://gobikes.au/wp-content/uploads/2025/08/Gobike-kids-electric-bike-ebike-for-kids-4-scaled-1.webp"
                  alt="Premium fabric quality of GoBike t-shirts"
                  width={500}
                  height={500}
                  className="w-full max-w-[450px] h-auto object-contain rounded-lg"
              />
          </div>
          <div className="w-full md:w-1/2">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Designed for Comfort, Built for Style.
              </h2>
              <p className="text-base text-gray-600 mb-6 leading-relaxed">
                GoBike apparel isn&apos;t just merchandise; it&apos;s quality clothing made for active kids. Soft, breathable, and ready for any outdoor adventure.
              </p>
              <ul className="space-y-3 mb-8 text-gray-700 text-sm md:text-base list-disc list-inside marker:text-green-600">
                  <li><strong>Premium Cotton Blend:</strong> Soft on the skin, perfect for all-day wear while riding or playing.</li>
                  <li><strong>Durable Prints:</strong> High-quality logos and designs that withstand wash after wash.</li>
                  <li><strong>Breathable Fit:</strong> Keeps your child cool and comfortable during active play.</li>
                  <li><strong>Machine Washable:</strong> Easy to clean after a muddy day on the tracks.</li>
              </ul>
               <Link 
                href="/about" 
                className="inline-block bg-gray-900 text-white font-semibold py-3 px-8 rounded-md hover:bg-gray-700 transition-colors w-full md:w-auto text-center"
               >
                About Our Brand
               </Link>
          </div>
        </section>

        {/* --- SEO Bottom Section --- */}
        <section className="text-center bg-gray-50 rounded-xl p-8 md:p-12 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Wear Your Passion
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            At GoBike, we believe riding is a lifestyle. Our exclusive T-shirt collection allows young riders to show off their passion for electric bikes even when they are off the track. Join the GoBike family and gear up with the coolest apparel in Australia.
          </p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-8">
            <Link 
              href="/bikes" 
              className="px-8 py-3 bg-white text-gray-800 font-bold rounded-full border border-gray-200 shadow-sm hover:shadow-lg hover:border-blue-600 hover:text-blue-600 hover:-translate-y-0.5 transition-all duration-300"
            >
              Shop Electric Bikes
            </Link>
            <Link 
              href="/electric-bike-parts" 
              className="px-8 py-3 bg-white text-gray-800 font-bold rounded-full border border-gray-200 shadow-sm hover:shadow-lg hover:border-blue-600 hover:text-blue-600 hover:-translate-y-0.5 transition-all duration-300"
            >
              Shop Spare Parts
            </Link>
            <Link 
              href="/contact" 
              className="px-8 py-3 bg-white text-gray-800 font-bold rounded-full border border-gray-200 shadow-sm hover:shadow-lg hover:border-blue-600 hover:text-blue-600 hover:-translate-y-0.5 transition-all duration-300"
            >
              Contact Support
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}