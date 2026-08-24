// app/product/[slug]/page.tsx

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ProductClient from './_components/ProductClient';
import Breadcrumbs from '@/components/Breadcrumbs';
import { productFaqMap } from '../productFaqs';
import { productVideoMap } from '../productVideos';

// ✅ নতুন Server Action ইম্পোর্ট করা হলো
import { getProductBySlugAction } from '@/app/actions/frontend/product/get-product-by-slug';

// --- Data Fetching ---
async function getProductData(slug: string) {
    try {
        const response = await getProductBySlugAction(slug);
        if (!response.success || !response.product) return null;
        return response.product;
    } catch (error) {
        console.error("Failed to fetch product:", error);
        return null;
    }
}

// --- SEO Metadata ---
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const product = await getProductData(slug); 
  
  if (!product) return { title: 'Product Not Found' };
  
  const descriptionSource = product.shortDescription || product.description || '';
  const plainDescription = descriptionSource.replace(/<[^>]*>?/gm, '').substring(0, 155);
  const imageUrl = product.image?.sourceUrl || 'https://gobike.au/default-og.jpg';
  const title = `${product.name} | Best Kids Electric Bike Australia | GoBike`;
  const seoDescription = `${plainDescription} Shop the best childrens electric dirt bike and balance bike electric options. Top-rated australian electric bikes for ages 2-16.`;

  return {
    title: title,
    description: seoDescription,
    keywords: [
      product.name,
      'balancing bikes',
      'electric cycles australia',
      'childrens electric dirt bike',
      'childrens electric bike',
      'kids electric bike',
      'balance bike electric',
      'childrens electric motorbikes',
      'australia electric bike',
      'electric bikes for 10 year olds',
      'electric childs motorbike'
    ],
    alternates: { canonical: `https://gobike.au/product/${slug}` },
    openGraph: {
      title: title,
      description: seoDescription,
      url: `https://gobike.au/product/${slug}`,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: `${product.name} - Kids Electric Bike Australia` }],
      siteName: 'GoBike Australia',
      locale: 'en_AU',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: seoDescription,
      images: [imageUrl],
      creator: '@GoBikeAU',
    },
    other: {
      'geo.region': 'AU-NSW',
      'geo.placename': 'Camden',
      'geo.position': '-34.05;150.69', 
      'ICBM': '-34.05, 150.69',
    },
  };
}

// --- Main Page Component ---
export default async function SingleProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  
  const product = await getProductData(slug); 
  if (!product) { notFound(); }
  
  const getPriceAsNumber = (priceString: string | undefined | null): number | undefined => { 
    if (!priceString) return undefined; 
    return parseFloat(priceString.replace(/[^0-9.]/g, ''));
  };
  
  const currentPrice = getPriceAsNumber(product.salePrice) || getPriceAsNumber(product.regularPrice) || 0;
  const availability = product.stockStatus === 'IN_STOCK' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
  
  // GoBike-এর dedicated ageGroup ফিল্ড এখনো কোনো product-এই পূরণ করা হয়নি
  // (admin-এ খালি), কিন্তু age range প্রায় সব bike-এর নামেই লেখা থাকে
  // ("Ages 5-9" ইত্যাদি) — তাই সেখান থেকে বের করে ব্যবহার করা হচ্ছে, যাতে এখনই
  // কাজ করে, dedicated field পূরণ হওয়ার অপেক্ষায় বসে না থেকে।
  const ageMatch = product.name.match(/ages?\s*(\d+)\s*[-–—]\s*(\d+)/i);
  const audience = ageMatch
    ? { '@type': 'PeopleAudience', suggestedMinAge: Number(ageMatch[1]), suggestedMaxAge: Number(ageMatch[2]) }
    : undefined;

  // ★★★ JSON-LD Schema ★★★
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description?.replace(/<[^>]*>?/gm, '').substring(0, 5000),
    image: [product.image?.sourceUrl, ...(product.galleryImages.nodes.map((img: { sourceUrl: string }) => img.sourceUrl) || [])].filter(Boolean),
    sku: product.sku || product.databaseId.toString(),
    mpn: product.sku || product.databaseId.toString(),
    gtin14: product.barcode || undefined,
    // নিচের ৫টা (size/color/material/pattern/category) DB-তে dedicated field
    // হিসেবে আছে, কিন্তু এই মুহূর্তে কোনো product-এই পূরণ করা নেই — তাই এখন
    // এগুলো "undefined" থাকবে (schema-তে দেখাবে না), admin panel-এ ডেটা যোগ
    // করলে পরে এমনিতেই কাজ করা শুরু করবে, কোনো code change লাগবে না।
    size: product.size || undefined,
    color: product.color || undefined,
    material: product.material || undefined,
    pattern: product.pattern || undefined,
    category: product.googleProductCategory || product.primaryCategory?.name || undefined,
    audience,
    brand: { '@type': 'Brand', name: 'GoBike' },
    offers: {
      '@type': 'Offer',
      url: `https://gobike.au/product/${product.slug}`,
      priceCurrency: 'AUD',
      price: currentPrice,
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      itemCondition: 'https://schema.org/NewCondition',
      availability: availability,
      seller: { '@type': 'Organization', name: 'GoBike Australia' },
      // ৮০% অর্ডারে coupon দিয়ে free shipping দেওয়া হয় বলে এটা business-এর
      // de facto standard policy হিসেবে ধরে $0 declare করা হচ্ছে (owner-এর
      // সিদ্ধান্ত)। destination/delivery timeframe নিচে বাস্তব এবং /shipping-policy
      // পেজের সাথে হুবহু মিলছে।
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'AUD' },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'AU' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 2, unitCode: 'd' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 7, unitCode: 'd' }
        }
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'AU',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 14,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/RestockingFees'
      }
    },
    aggregateRating: product.reviewCount > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: product.averageRating,
      reviewCount: product.reviewCount,
    } : undefined,
    // সব approved review-ই দেখানো হচ্ছে (নতুন query লাগেনি, product page
    // ইতিমধ্যেই এই ডেটা আনে)।
    review: product.reviews.edges.length > 0
      ? product.reviews.edges.map((edge: {
          rating: number;
          node: { author: { node: { name: string } }; content: string; date: string };
        }) => ({
          '@type': 'Review',
          reviewRating: { '@type': 'Rating', ratingValue: edge.rating, bestRating: 5 },
          author: { '@type': 'Person', name: edge.node.author.node.name },
          datePublished: edge.node.date,
          ...(edge.node.content ? { reviewBody: edge.node.content.replace(/<[^>]*>?/gm, '').substring(0, 2000) } : {}),
        }))
      : undefined,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://gobike.au' },
      product.primaryCategory
        ? { '@type': 'ListItem', position: 2, name: product.primaryCategory.name, item: `https://gobike.au/${product.primaryCategory.slug}` }
        : { '@type': 'ListItem', position: 2, name: 'Product', item: 'https://gobike.au/shop' },
      { '@type': 'ListItem', position: 3, name: product.name, item: `https://gobike.au/product/${product.slug}` }
    ]
  };

  const faqs = productFaqMap[product.slug] || productFaqMap['default'];
  const faqSchema = faqs && faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer }
    }))
  } : null;

  const videoData = productVideoMap[product.slug];
  const videoSchema = videoData ? {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: videoData.title,
    description: videoData.description,
    thumbnailUrl: videoData.thumbnailUrl,
    uploadDate: videoData.uploadDate,
    contentUrl: `https://www.youtube.com/watch?v=${videoData.id}`,
    embedUrl: `https://www.youtube.com/embed/${videoData.id}`
  } : null;

  // ★ product.videoUrl (main gallery-এর direct-hosted video, YouTube না) —
  // এর জন্য কোনো dedicated title/description/upload-date নেই, তাই product-এর
  // নিজের name/description/createdAt দিয়ে honest approximation করা হচ্ছে।
  const mainVideoSchema = product.videoUrl ? {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: `${product.name} — Product Video`,
    description: (product.shortDescription || product.description || product.name).replace(/<[^>]*>?/gm, '').substring(0, 500),
    thumbnailUrl: product.videoThumbnail || product.image?.sourceUrl,
    uploadDate: product.createdAt,
    contentUrl: product.videoUrl,
  } : null;

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      {videoSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }} />}
      {mainVideoSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(mainVideoSchema) }} />}

      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        product.primaryCategory
          ? { label: product.primaryCategory.name, href: `/${product.primaryCategory.slug}` }
          : { label: 'Product', href: '/shop' },
        { label: product.name },
      ]} />
      
      {/* Client Component কে product পাঠানো হচ্ছে */}
      <ProductClient product={product} />
    </div>
  );
}