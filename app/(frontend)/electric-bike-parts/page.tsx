// app/(frontend)/electric-bike-parts/page.tsx

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '@/components/ProductCard';
import PaginationControls from '../shop/_components/PaginationControls'; 
import Breadcrumbs from '@/components/Breadcrumbs'; 
import { getProductsAndCategoriesAction } from '@/app/actions/frontend/shop/get-shop-products';

const PRODUCTS_PER_PAGE = 12;

// --- METADATA GENERATION (Fixed Canonical Issue for Ahrefs) ---
export async function generateMetadata({ searchParams }: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  
  // ★ GraphQL এর after/before এর বদলে নতুন page প্যারামিটার ব্যবহার করা হচ্ছে
  const pageParam = resolvedSearchParams.page;
  const pageNum = pageParam && !Array.isArray(pageParam) ? parseInt(pageParam, 10) : 1;
  const isPaged = pageNum > 1;

  let title = "Genuine Spare Parts & Accessories | GoBike Australia";
  let description = "Keep the adventure going! Find all genuine GoBike replacement parts, from batteries and chargers to wheels and grips, to maintain and customize your kids electric bike.";

  if (isPaged) {
    title = `Page ${pageNum} - Genuine Spare Parts & Accessories | GoBike Australia`;
    description = `Browse page ${pageNum} of our genuine GoBike spare parts catalog. Find replacement batteries, chargers, tires, and accessories for kids electric bikes in Australia.`;
  }

  // ★★★ Fixed Canonical Generation ★★★
  let canonicalUrl = '/electric-bike-parts';
  if (isPaged) {
    canonicalUrl += `?page=${pageNum}`;
  }

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
          url: 'https://gobikes.au/wp-content/uploads/2025/11/gobike-12-safety-features-for-toddlers.jpg',
          width: 1200,
          height: 857,
          alt: 'A collection of genuine GoBike spare parts and accessories.',
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
export default async function SparePartsPage({ searchParams }: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const pageParam = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page, 10) : 1;
  const currentPage = isNaN(pageParam) ? 1 : pageParam;

  // 🚀 GraphQL এর বদলে আমাদের Prisma Server Action কল করা হচ্ছে
  const { products, pageInfo } = await getProductsAndCategoriesAction(
    "spare-parts",
    PRODUCTS_PER_PAGE,
    currentPage
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': 'GoBike Spare Parts & Accessories',
    'description': 'Find genuine spare parts and accessories for GoBike kids electric bikes.',
    'itemListElement': products.map((product, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'item': {
        '@type': 'Product',
        'name': product.name,
        'url': `https://gobike.au/product/${product.slug}`,
        'image': product.image?.sourceUrl,
        'description': `Genuine GoBike spare part: ${product.name}. Ensure perfect fit and performance.`,
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs pageTitle="Spare Parts" />
      <div className="max-w-[1300px] mx-auto px-1.5 font-sans">
        
        {/* Header / Hero Section */}
        <header className="flex flex-col md:flex-row items-center gap-6 md:gap-12 mb-12 bg-gray-50 rounded-lg md:rounded-xl p-6 md:p-12 mt-4">
          <div className="flex-1 text-center md:text-left w-full">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
              Genuine GoBike Spare Parts & Accessories
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto md:mx-0">
              Keep the adventure going! Find all the genuine replacement parts and cool accessories you need to maintain and customize your GoBike.
            </p>
          </div>
          <div className="flex-1 w-full max-w-[580px]">
              <Image 
                  src="https://gobikes.au/wp-content/uploads/2025/02/Electric-Balance-Bike-Electric-bike-Balance-Bike-scaled-1.webp"
                  alt="GoBike spare parts and accessories"
                  width={600}
                  height={600}
                  priority={true}
                  className="w-full h-auto object-cover rounded-lg shadow-md hover:scale-105 transition-transform duration-300"
              />
          </div>
        </header>

        {/* Products Grid */}
        <main className="mb-16">
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 text-xl py-10">No spare parts found.</p>
          )}
          
          <div className="mt-10 flex justify-center">
            <PaginationControls pageInfo={pageInfo} basePath="/electric-bike-parts" />
          </div>
        </main>

        {/* Why Choose Us Section */}
        <section className="flex flex-col md:flex-row items-center gap-8 md:gap-16 bg-white border border-gray-100 rounded-lg md:rounded-xl p-6 py-10 md:p-12 shadow-sm mb-16">
          <div className="w-full md:w-1/2 flex justify-center">
               <Image 
                  src="https://gobikes.au/wp-content/uploads/2025/08/Gobike-kids-electric-bike-ebike-for-kids-1-scaled-1.webp"
                  alt="GoBike genuine parts quality"
                  width={500}
                  height={500}
                  className="w-full max-w-[450px] h-auto object-contain rounded-lg"
              />
          </div>
          <div className="w-full md:w-1/2">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Why Choose Genuine GoBike Parts?
              </h2>
              <p className="text-base text-gray-600 mb-6 leading-relaxed">
                Do not settle for less. Our genuine spare parts are manufactured to the same high standards as our bikes, ensuring perfect fit, maximum safety, and peak performance.
              </p>
              <ul className="space-y-3 mb-8 text-gray-700 text-base list-disc list-inside marker:text-black">
                  <li><strong>Perfect Fit Guarantee:</strong> Designed specifically for your GoBike model.</li>
                  <li><strong>Uncompromised Safety:</strong> Built with the same quality materials for total peace of mind.</li>
                  <li><strong>Peak Performance:</strong> Restore your bike to its original performance and glory.</li>
                  <li><strong>Easy Installation:</strong> Get back to riding faster with parts that are easy to install.</li>
              </ul>
               <Link 
                href="/bikes" 
                className="inline-block bg-black text-white font-semibold py-3 px-8 rounded-md hover:bg-gray-800 transition-colors w-full md:w-auto text-center"
               >
                Shop All Bikes
               </Link>
          </div>
        </section>

        {/* SEO Bottom Section */}
        <section className="text-center bg-gray-50 rounded-xl p-8 md:p-12 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Your Journey to Adventure Starts Here
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            At GoBike, we believe in the power of outdoor play. Our electric bikes are the perfect tool to get your kids off screens and into the great outdoors, building confidence and coordination along the way. We are a proud Aussie brand, committed to providing the best quality and service.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Link 
              href="/contact" 
              className="px-8 py-3 bg-white text-gray-800 font-semibold rounded-full border border-gray-200 shadow-sm hover:border-black hover:text-black transition-all duration-200"
            >
              Contact Our Team
            </Link>
            <Link 
              href="/shop" 
              className="px-8 py-3 bg-white text-gray-800 font-semibold rounded-full border border-gray-200 shadow-sm hover:border-black hover:text-black transition-all duration-200"
            >
              Shop All Products
            </Link>
            <Link 
              href="/faq" 
              className="px-8 py-3 bg-white text-gray-800 font-semibold rounded-full border border-gray-200 shadow-sm hover:border-black hover:text-black transition-all duration-200"
            >
              Find Answers (FAQ)
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}