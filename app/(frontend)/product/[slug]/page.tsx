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
  
  // ★★★ JSON-LD Schema ★★★
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description?.replace(/<[^>]*>?/gm, '').substring(0, 5000),
    image: [product.image?.sourceUrl, ...(product.galleryImages.nodes.map((img: any) => img.sourceUrl) || [])].filter(Boolean),
    sku: product.sku || product.databaseId.toString(),
    mpn: product.sku || product.databaseId.toString(),
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
      shippingDetails: { 
        '@type': 'OfferShippingDetails',
        shippingRate: { 
          '@type': 'MonetaryAmount', 
          value: currentPrice > 1000 ? 0 : 25, 
          currency: 'AUD' 
        },
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
        merchantReturnDays: 30,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/RestockingFees' 
      }
    },
    aggregateRating: product.reviewCount > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: product.averageRating,
      reviewCount: product.reviewCount,
    } : undefined,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://gobike.au' },
      { '@type': 'ListItem', position: 2, name: 'Kids Electric Bikes', item: 'https://gobike.au/bikes' },
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

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      {videoSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }} />}

      <Breadcrumbs pageTitle={product.name} />
      
      {/* Client Component কে product পাঠানো হচ্ছে */}
      <ProductClient product={product as any} />
    </div>
  );
}