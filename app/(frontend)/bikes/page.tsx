// app/(frontend)/bikes/page.tsx

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '@/components/ProductCard';
import PaginationControls from '../shop/_components/PaginationControls';
import Breadcrumbs from '@/components/Breadcrumbs';
import { getProductsAndCategoriesAction } from '@/app/actions/frontend/shop/get-shop-products';

const PRODUCTS_PER_PAGE = 12;

export async function generateMetadata({ searchParams }: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  
  // ★ GraphQL এর after/before এর বদলে নতুন page প্যারামিটার ব্যবহার করা হচ্ছে
  const pageParam = resolvedSearchParams.page;
  const pageNum = pageParam && !Array.isArray(pageParam) ? parseInt(pageParam, 10) : 1;
  const isPaged = pageNum > 1;

  const title = isPaged ? `Shop Kids Electric Bikes | Page ${pageNum} | GoBike Australia` : "All Kids Top Rated Electric Bikes | Electric Cycles Australia";
  const description = "Browse our full collection of top-rated electric balance bikes for kids. From balancing bikes to childrens electric motorbikes. Safe, durable, and built for adventure.";
  
  let canonicalUrl = '/bikes';
  if (isPaged) {
    canonicalUrl += `?page=${pageNum}`;
  }

  // ★★★ AEO/GEO: সার্চ ইঞ্জিন ও Ahrefs-এর জন্য Freshness Signal (Current Date) ★★★
  const currentDate = new Date().toISOString();

  return {
    title,
    description,
    keywords: [
      'kids electric bike',
      'balancing bikes',
      'electric cycles australia',
      'childrens electric dirt bike',
      'childrens electric bike',
      'balance bike electric',
      'childrens electric motorbikes',
      'australia electric bike',
      'australian electric bikes',
      'electric childs motorbike',
      'electric bikes for 10 year olds'
    ],
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
          url: 'https://gobikes.au/wp-content/uploads/2025/11/gobike-ebike-safe-speed-modes.jpg', 
          width: 1200,
          height: 857 ,
          alt: 'A happy child riding a GoBike electric bike in a park',
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
export default async function BikesPage({ searchParams }: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const pageParam = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page, 10) : 1;
  const currentPage = isNaN(pageParam) ? 1 : pageParam;

  // 🚀 GraphQL এর বদলে আমাদের Prisma Server Action কল করা হচ্ছে
  // "bikes" ক্যাটাগরির স্লাগ পাঠিয়ে দেওয়া হলো
  const { products, pageInfo } = await getProductsAndCategoriesAction(
    "bikes",
    PRODUCTS_PER_PAGE,
    currentPage
  );

  // ★★★ AEO/GEO: Breadcrumb Schema (Kept Original) ★★★
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://gobike.au' },
      { '@type': 'ListItem', 'position': 2, 'name': 'All Bikes', 'item': 'https://gobike.au/bikes' }
    ]
  };

  // ★★★ AEO/GEO: CollectionPage + ItemList Schema (Kept Original) ★★★
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': 'Kids Electric Bikes',
    'description': 'Browse our collection of top-rated electric bikes for kids including balancing bikes and dirt bikes.',
    'url': 'https://gobike.au/bikes',
    'dateModified': new Date().toISOString(),
    'mainEntity': {
      '@type': 'ItemList',
      'numberOfItems': products.length,
      'itemListElement': products.map((product, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'item': {
          '@type': 'Product',
          'name': product.name,
          'url': `https://gobike.au/product/${product.slug}`,
          'image': product.image?.sourceUrl,
           'description': `Discover the ${product.name}, a top-rated electric bike for kids. Safe, durable, and built for adventure.`,
          'sku': product.databaseId.toString(),
          'brand': {
            '@type': 'Brand',
            'name': 'GoBike'
          },
          ...(product.reviewCount > 0 && {
            'aggregateRating': {
              '@type': 'AggregateRating',
              'ratingValue': product.averageRating || 5,
              'reviewCount': product.reviewCount
            }
          }),
          'offers': {
            '@type': 'Offer',
            'priceCurrency': 'AUD',
            // Formatting price to just numbers for schema
            'price': product.salePrice 
              ? product.salePrice.replace(/[^0-9.]+/g, "") 
              : product.regularPrice?.replace(/[^0-9.]+/g, ""),
            'availability': 'https://schema.org/InStock',
            'url': `https://gobike.au/product/${product.slug}`,
          }
        }
      }))
    }
  };

  return (
    <div>
      {/* ★★★ Schema Injection ★★★ */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />

      <Breadcrumbs pageTitle="All Bikes" />
      <div className="max-w-[1300px] mx-auto px-1.5 font-sans">
        
        {/* --- Header Banner (Original UI) --- */}
        <header className="flex flex-col md:flex-row items-center gap-6 md:gap-12 mb-8 md:mb-12 bg-gray-50 rounded-lg md:rounded-xl p-4 md:p-12">
          <div className="flex-1 text-center md:text-left w-full">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 md:mb-4 leading-tight">
              Australia&apos;s Top-Rated Electric Bikes for Kids
            </h1>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto md:mx-0">
              Give your child the gift of adventure! Our electric balance bikes are engineered for safety, built for fun, and designed to create lifelong memories.
            </p>
          </div>
          <div className="flex-1 w-full max-w-[580px]">
            <Image
              src="https://gobikes.au/wp-content/uploads/2025/09/Gobike-kids-electric-bike-ebike-for-kids-scaled.webp"
              alt="Happy child riding a GoBike electric bike"
              width={600}
              height={600}
              priority={true}
              className="w-full h-auto object-cover rounded-lg shadow-lg hover:scale-105 transition-transform duration-300"
            />
          </div>
        </header>

        {/* --- Products Grid (Original UI) --- */}
        <main className="mb-16">
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 text-xl py-10">
              No bikes found.
            </p>
          )}

          <div className="mt-10 flex justify-center">
            {/* pageInfo পাস করা হলো আমাদের নতুন PaginationControls এর জন্য */}
            <PaginationControls pageInfo={pageInfo} basePath="/bikes" />
          </div>
        </main>

        {/* --- Why Choose Us Section (Original UI) --- */}
        <section className="flex flex-col md:flex-row items-center gap-8 md:gap-16 bg-white border border-gray-100 rounded-lg md:rounded-xl p-4 py-8 md:p-10 shadow-sm mb-12 md:mb-16">
          <div className="w-full md:w-1/2 flex justify-center">
            <Image
              src="https://gobikes.au/wp-content/uploads/2025/08/Gobike-kids-electric-bike-ebike-for-kids-4-scaled-1.webp"
              alt="GoBike parts and features"
              width={500}
              height={500}
              className="w-full max-w-[450px] h-auto object-contain rounded-lg"
            />
          </div>
          <div className="w-full md:w-1/2">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Engineered for Safety, Built for Fun.
            </h2>
            <p className="text-base text-gray-600 mb-6 leading-relaxed">
              Every GoBike is more than just a toy. It is a premium-quality ride designed with your child&apos;s safety as our number one priority.
            </p>
            <ul className="space-y-3 mb-8 text-gray-700 text-sm md:text-base">
              <li className="flex items-start">
                <span className="mr-2 text-green-600 font-bold">✓</span>
                <span>
                  <strong>Lightweight & Durable Frame:</strong> Easy for kids to handle, tough enough for any adventure.
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-600 font-bold">✓</span>
                <span>
                  <strong>Safe Speed Modes:</strong> Start with a slow learning mode and unlock faster speeds as they grow in confidence.
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-600 font-bold">✓</span>
                <span>
                  <strong>Reliable Braking System:</strong> Powerful disc brakes for safe and immediate stopping power.
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-600 font-bold">✓</span>
                <span>
                  <strong>Long-Lasting Battery:</strong> More ride time, less charge time. The fun never has to stop!
                </span>
              </li>
            </ul>
            <Link
              href="/about"
              className="inline-block bg-gray-900 text-white font-semibold py-3 px-8 rounded-md hover:bg-gray-700 transition-colors w-full md:w-auto text-center"
            >
              Learn Our Story
            </Link>
          </div>
        </section>

        {/* --- New SEO Content Block (Original UI) --- */}
        <section className="text-left  bg-gray-50 rounded-xl p-3 md:p-5">
            <div className="max-w-[1100px] mx-auto text-gray-700 leading-relaxed">
                
                 <h2 className="text-2xl text-center font-bold text-gray-900 mb-4">The Ultimate Guide to Kids Electric Bikes in Australia</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 ">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-3">Why Choose an Electric Balance Bike?</h3>
                        <p className="mb-4 text-base">
                            Transitioning from a tricycle to a pedal bike can be daunting. That is where <strong>balancing bikes</strong> powered by electricity come in. They allow children to master the art of balance without the struggle of pedaling. At GoBike, our range of <strong>electric cycles Australia</strong> is designed to offer a seamless learning curve, making us the top choice for Aussie parents.
                        </p>
                        <p className="mb-4 text-base">
                            Unlike a traditional bicycle, an <strong>electric childs motorbike</strong> gives kids the thrill of powered speed (safely governed) while teaching them throttle control and hand-eye coordination.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-3">Safety Features You Can Trust</h3>
                        <p className="mb-4 text-base">
                            Safety is paramount when choosing a <strong>childrens electric dirt bike</strong>. All GoBike models feature speed limiters, meaning you can lock the bike to a safe &quot;Low Speed&quot; mode while your child learns. Our <strong>australian electric bikes</strong> are built with robust aluminium frames, hydraulic disc brakes (on larger models), and auto-cutoff power sensors.
                        </p>
                    </div>
                </div>

                <div className="mt-8 bg-gray-50 p-3 rounded-lg">
                     <h3 className="text-xl font-bold text-gray-800 mb-3">Which Size is Right for Your Child?</h3>
                     <ul className="list-disc pl-5 space-y-2">
                        <li><strong>GoBike 12:</strong> Perfect for toddlers (Ages 2-5). Low seat height, lightweight, and the ideal <strong>balance bike electric</strong> starter.</li>
                        <li><strong>GoBike 16:</strong> The best <strong>kids electric bike</strong> for ages 5-9. More power, suspension forks, and true dirt bike styling.</li>
                        <li><strong>GoBike 20:</strong> For the serious young rider. Ideal for <strong>electric bikes for 10 year olds</strong> and up, capable of handling rougher off-road terrain.</li>
                     </ul>
                     <p className="mt-4 text-sm text-gray-600">
                        Whether you are looking for an <strong>australia electric bike</strong> for your toddler or a powerful ride for your teen, GoBike has the perfect model to start their adventure.
                     </p>
                </div>
            </div>
        </section>

        {/* --- SEO Bottom Section (Original UI) --- */}
        <section className="text-left bg-gray-50 rounded-xl p-3 md:p-5 mt-8">
          <div className="max-w-[1100px] mx-auto text-gray-700 leading-relaxed">
            <h2 className="text-center text-2xl font-bold text-gray-900 mb-4">
              Your Journey to Adventure Starts Here
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              At GoBike, we believe in the power of outdoor play. Our electric bikes are the perfect tool to get your kids off screens and into the great outdoors, building confidence and coordination along the way. We are a proud Aussie brand, committed to providing the best quality and service.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-8">
            <Link
              href="/electric-bike-parts"
              className="px-8 py-3 bg-white text-gray-800 font-bold rounded-full border border-gray-200 shadow-sm hover:shadow-lg hover:border-blue-600 hover:text-blue-600 hover:-translate-y-0.5 transition-all duration-300"
            >
              Shop All Spare Parts
            </Link>
            
            <Link
              href="/contact"
              className="px-8 py-3 bg-white text-gray-800 font-bold rounded-full border border-gray-200 shadow-sm hover:shadow-lg hover:border-blue-600 hover:text-blue-600 hover:-translate-y-0.5 transition-all duration-300"
            >
              Contact Our Team
            </Link>
            
            <Link
              href="/faq"
              className="px-8 py-3 bg-white text-gray-800 font-bold rounded-full border border-gray-200 shadow-sm hover:shadow-lg hover:border-blue-600 hover:text-blue-600 hover:-translate-y-0.5 transition-all duration-300"
            >
              Find Answers (FAQ)
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}