// app/(frontend)/shop/page.tsx

import type { Metadata } from 'next';
import Link from 'next/link';
import ProductFilters from './_components/ProductFilters';
import PaginationControls from './_components/PaginationControls';
// এখানে আমরা নতুন Server Action ইম্পোর্ট করছি
import { getProductsAndCategoriesAction } from '@/app/actions/frontend/shop/get-shop-products';
// আপনার গ্লোবাল ProductCard ব্যবহার করে তৈরি ProductsGrid ইম্পোর্ট করছি
import ProductsGrid from '@/components/ProductsGrid';
import Breadcrumbs from '@/components/Breadcrumbs';
import FaqAccordion from '@/components/FaqAccordion';

const PRODUCTS_PER_PAGE = 12;

const shopFaqs = [
  {
    question: 'Do I need an account to place an order?',
    answer: "No, you can check out as a guest. Creating a free account just lets you track orders and view your order history faster next time.",
  },
  {
    question: 'What payment methods does GoBike accept?',
    answer: 'We accept major credit and debit cards and PayPal at checkout, plus bank transfer for eligible orders.',
  },
  {
    question: 'Can I filter products by category on the shop page?',
    answer: 'Yes, use the category filters at the top of this page to narrow results down to bikes, spare parts, apparel, or any other product type.',
  },
  {
    question: 'Is the stock status shown on this page up to date?',
    answer: 'Yes. Stock levels shown on each product are live, so what you see reflects current availability rather than a cached snapshot.',
  },
  {
    question: 'Can I order a bike, spare parts, and apparel together in one order?',
    answer: "Yes, you can add products from any category to the same cart and check out in a single order.",
  },
];

interface Category {
  id: string;
  name: string;
  slug: string;
}

// --- METADATA GENERATION (Fixed Canonical Issue for Ahrefs) ---
export async function generateMetadata({ searchParams }: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const categorySlug = typeof resolvedSearchParams.category === 'string' ? resolvedSearchParams.category : undefined;
  
  const pageParam = resolvedSearchParams.page;
  const pageNum = pageParam && !Array.isArray(pageParam) ? parseInt(pageParam, 10) : 1;
  
  let baseTitle = "Kids Motorbikes & Electric Motorbikes Australia — Shop All Products";
  let title = `${baseTitle} | GoBike Australia`;
  let description = "Shop kids motorbikes and electric motorbikes Australia-wide. Explore our curated selection of high-quality bikes, spare parts, and accessories. From electric childs motorbikes to balancing bikes, find it all at GoBike.";

  if (categorySlug) {
    const categoryName = categorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    baseTitle = `Shop ${categoryName}`;
    title = `${baseTitle} | GoBike Australia`;
    description = `Discover our collection of ${categoryName}. Top quality and performance guaranteed. Shop genuine australian electric bikes parts and gear.`;
  }

  if (pageNum > 1) {
    title = `Page ${pageNum} - ${baseTitle} | GoBike Australia`;
    
    if (categorySlug) {
        description = `Browse page ${pageNum} of our ${categorySlug.replace(/-/g, ' ')} collection. Find more top-quality electric bikes, parts, and accessories for kids in Australia.`;
    } else {
        description = `Continuing on page ${pageNum} of our products catalog. Discover more premium kids electric bikes, balance bikes, and genuine spare parts at GoBike.`;
    }
  }

  // ★★★ Fixed Canonical Generation ★★★
  const canonicalParams = new URLSearchParams();
  
  if (categorySlug) {
    canonicalParams.set('category', categorySlug);
  }
  
  if (pageNum > 1) {
    canonicalParams.set('page', pageNum.toString());
  }

  const queryString = canonicalParams.toString();
  const canonicalUrl = queryString ? `/shop?${queryString}` : '/shop';

  const currentDate = new Date().toISOString(); 

  return {
    title,
    description,
    keywords: [
      'childrens electric bike',
      'australia electric bike',
      'electric bikes for 10 year olds',
      'kids motorbike',
      'electric motorbikes',
      'electric motorbikes australia',
      categorySlug ? `${categorySlug} australia` : 'kids ebikes'
    ],
    alternates: {
      canonical: canonicalUrl, 
    },
    robots: {
      index: true, 
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      }
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
          alt: 'GoBike Australia Products Collection',
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
export default async function ProductsPage({ searchParams }: {
  searchParams: Promise<{ [key:string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const category = typeof resolvedSearchParams.category === 'string' ? resolvedSearchParams.category : null;
  const pageParam = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page, 10) : 1;
  const currentPage = isNaN(pageParam) ? 1 : pageParam;
  
  // 🚀 GraphQL এর বদলে আমাদের Prisma Database কল করা হচ্ছে
  const { products, categories, pageInfo } = await getProductsAndCategoriesAction(
    category,
    PRODUCTS_PER_PAGE,
    currentPage
  );

  const currentCategoryName = categories.find((c: Category) => c.slug === category)?.name || "All Products";
  const currentUrl = category ? `https://gobike.au/shop?category=${category}` : `https://gobike.au/shop`;

  const breadcrumbItems = [
    { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://gobike.au' },
    { '@type': 'ListItem', 'position': 2, 'name': 'Products', 'item': 'https://gobike.au/shop' }
  ];
  if (category) {
    breadcrumbItems.push({ '@type': 'ListItem', 'position': 3, 'name': currentCategoryName, 'item': currentUrl });
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumbItems
  };

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': `GoBike ${currentCategoryName}`,
    'description': `Browse our collection of ${currentCategoryName} including balancing bikes and electric cycles in Australia.`,
    'url': currentUrl,
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
          'description': `Genuine GoBike product: ${product.name}.`,
          'sku': product.databaseId.toString(),
          'brand': { '@type': 'Brand', 'name': 'GoBike' },
          ...(product.reviewCount && product.reviewCount > 0 && {
            'aggregateRating': {
              '@type': 'AggregateRating',
              'ratingValue': product.averageRating,
              'reviewCount': product.reviewCount
            }
          }),
          'offers': {
            '@type': 'Offer',
            'priceCurrency': 'AUD',
            'price': product.salePrice ? product.salePrice.replace(/[^0-9.]+/g, "") : product.regularPrice?.replace(/[^0-9.]+/g, ""),
            'availability': 'https://schema.org/InStock',
            'itemCondition': 'https://schema.org/NewCondition',
            'url': `https://gobike.au/product/${product.slug}`,
            'seller': { '@type': 'Organization', 'name': 'GoBike Australia' },
            'shippingDetails': {
              '@type': 'OfferShippingDetails',
              'shippingRate': { '@type': 'MonetaryAmount', 'value': 0, 'currency': 'AUD' },
              'shippingDestination': { '@type': 'DefinedRegion', 'addressCountry': 'AU' },
              'deliveryTime': {
                '@type': 'ShippingDeliveryTime',
                'handlingTime': { '@type': 'QuantitativeValue', 'minValue': 0, 'maxValue': 2, 'unitCode': 'd' },
                'transitTime': { '@type': 'QuantitativeValue', 'minValue': 2, 'maxValue': 7, 'unitCode': 'd' }
              }
            },
            'hasMerchantReturnPolicy': {
              '@type': 'MerchantReturnPolicy',
              'applicableCountry': 'AU',
              'returnPolicyCountry': 'AU',
              'returnPolicyCategory': 'https://schema.org/MerchantReturnFiniteReturnWindow',
              'merchantReturnDays': 14,
              'returnMethod': 'https://schema.org/ReturnByMail',
              'returnFees': 'https://schema.org/ReturnFeesCustomerResponsibility',
              'returnLabelSource': 'https://schema.org/ReturnLabelCustomerResponsibility',
              'itemCondition': 'https://schema.org/NewCondition',
              'refundType': 'https://schema.org/FullRefund',
              'restockingFee': 20,
              'itemDefectReturnFees': 'https://schema.org/FreeReturn'
            }
          }
        }
      }))
    }
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': shopFaqs.map((faq) => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': { '@type': 'Answer', 'text': faq.answer },
    })),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <Breadcrumbs pageTitle={currentCategoryName} />
      
      <div className="max-w-[1300px] mx-auto px-1.5 font-sans mb-12">
        <header className="text-center mb-12 bg-gray-50 rounded-lg p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">{category ? currentCategoryName : 'Kids Motorbikes & Electric Motorbikes Australia — All Products'}</h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">{category ? 'Explore our curated selection of high-quality products. Find exactly what you are looking for.' : 'Shop kids motorbikes and electric motorbikes Australia-wide. Explore our curated selection of high-quality products. Find exactly what you are looking for.'}</p>
        </header>
        
        <ProductFilters categories={categories} />
        
        <main className="mb-16">
          {products.length > 0 ? (
            <ProductsGrid products={products} />
          ) : (
            <p className="text-center text-gray-500 text-xl py-10">No products found in this category.</p>
          )}
        </main>
        
        <div className="mt-10 flex justify-center">
            <PaginationControls pageInfo={pageInfo} basePath="/shop" />
        </div>

        <section className="bg-white border-t border-gray-100 pt-16 pb-12 mt-16 mb-8 p-4">
            <div className="max-w-[1100px] mx-auto text-gray-700 leading-relaxed">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Your One-Stop Shop for Kids Electric Bikes & Parts</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <p className="mb-4">
                            At GoBike, we are more than just a bike shop. We are your dedicated partner in providing the best <strong>electric cycles Australia</strong> has to offer. Whether you are looking for a starter <strong>balance bike electric</strong> model for your 3-year-old or a powerful <strong>childrens electric dirt bike</strong> for your pre-teen, our diverse product range covers it all.
                        </p>
                    </div>
                    <div>
                        <p className="mb-4">
                            We stock a comprehensive range of genuine spare parts and apparel to keep your <strong>electric childs motorbike</strong> running smoothly and your rider looking the part. From batteries to helmets, shop with confidence knowing you are getting quality <strong>australian electric bikes</strong> products backed by local support.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <div className="flex justify-center gap-4 flex-wrap mt-12 pb-8 border-t border-gray-100 pt-8">
            <Link href="/contact" className="inline-block px-6 py-3 bg-gray-50 text-gray-800 border border-gray-200 rounded-full font-medium transition-all duration-200 hover:bg-black hover:text-white hover:border-black">Contact Our Team</Link>
            <Link href="/bikes" className="inline-block px-6 py-3 bg-gray-50 text-gray-800 border border-gray-200 rounded-full font-medium transition-all duration-200 hover:bg-black hover:text-white hover:border-black">Shop All Bikes</Link>
            <Link href="/about" className="inline-block px-6 py-3 bg-gray-50 text-gray-800 border border-gray-200 rounded-full font-medium transition-all duration-200 hover:bg-black hover:text-white hover:border-black">About Us</Link>
          </div>

        <FaqAccordion title="Shopping at GoBike: Frequently Asked Questions" items={shopFaqs} />
      </div>
    </div>
  );
}