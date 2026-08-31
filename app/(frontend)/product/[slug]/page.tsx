// app/product/[slug]/page.tsx

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ProductClient from './_components/ProductClient';
import Breadcrumbs from '@/components/Breadcrumbs';
import { productVideoMap } from '../productVideos';

// blog/[slug]/page.tsx-এর একই helper — FAQPage schema-র acceptedAnswer.text
// প্লেইন টেক্সট হওয়া উচিত, raw markdown syntax (**bold** ইত্যাদি) না।
function stripMarkdown(md: string): string {
  return md
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/#{1,6}\s*/g, '')
    .replace(/\n{2,}/g, ' ')
    .replace(/\n/g, ' ')
    .trim();
}

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
  // 🚀 আগে এখানে সব প্রোডাক্টে হুবহু একই "Best Kids Electric Bike Australia | GoBike"
  // যোগ হতো — root layout-এর title template (%s | GoBike Australia) এর সাথে মিলে
  // ডাবল-ব্র্যান্ডিং + সাইটজুড়ে duplicate/cannibalizing title তৈরি করছিল। এখন শুধু
  // product.name (যেটা প্রতিটা প্রোডাক্টে এমনিতেই ইউনিক) ব্যবহার হচ্ছে, ব্র্যান্ড
  // suffix একবারই template থেকে আসবে। আগে ৪টা flagship বাইকের জন্য একটা হার্ডকোড
  // করা titleSuffix/descSentence ম্যাপ ছিল — সেই টেক্সট এখন সরাসরি ওই ৪টা প্রোডাক্টের
  // metaTitle/metaDesc DB ফিল্ডে migrate করা হয়েছে (admin SEO বক্স থেকে এডিট করা
  // যায়), তাই কোডে আর কোনো hardcode নাই।
  const autoTitle = product.name;
  const autoDescription = `${plainDescription} Backed by GoBike's Australia-wide shipping and 1-year local warranty.`;

  // 🚀 Admin product SEO বক্স (metaTitle/metaDesc/OG/Twitter/canonical/noIndex) —
  // খালি রাখলে উপরের auto-generated ভ্যালু ব্যবহার হয়, admin কিছু লিখলে সেটাই
  // সবচেয়ে বেশি প্রায়োরিটি পায়।
  const seoSchema = (product as { seoSchema?: { ogTitle?: string; ogDescription?: string; ogImage?: string; robots?: string } | null }).seoSchema;
  const title = (product as { metaTitle?: string }).metaTitle || autoTitle;
  const seoDescription = (product as { metaDesc?: string }).metaDesc || autoDescription;
  const canonicalUrl = (product as { seoCanonicalUrl?: string }).seoCanonicalUrl || `https://gobike.au/product/${slug}`;
  const finalOgTitle = seoSchema?.ogTitle || title;
  const finalOgDescription = seoSchema?.ogDescription || seoDescription;
  const finalOgImage = seoSchema?.ogImage || imageUrl;
  const finalTwitterTitle = (product as { twitterTitle?: string }).twitterTitle || finalOgTitle;
  const finalTwitterDescription = (product as { twitterDescription?: string }).twitterDescription || finalOgDescription;
  const isNoIndex = (product as { noIndex?: boolean }).noIndex || false;

  return {
    title: title,
    description: seoDescription,
    keywords: [
      product.name,
      'gobike ebike',
      'kids ebike for sale',
      'kids electric motorbike for sale',
      'electric bike for kids australia'
    ],
    alternates: { canonical: canonicalUrl },
    // noIndex চেক করা না থাকলে key-টাই বাদ যায় — তখন root layout-এর default
    // robots (index, follow, ...) স্বাভাবিকভাবে ইনহেরিট হবে, আগের মতোই।
    ...(isNoIndex || seoSchema?.robots
      ? { robots: isNoIndex ? { index: false, follow: false } : seoSchema!.robots }
      : {}),
    openGraph: {
      title: finalOgTitle,
      description: finalOgDescription,
      url: `https://gobike.au/product/${slug}`,
      images: [{ url: finalOgImage, width: 1200, height: 630, alt: `${product.name} - Kids Electric Bike Australia` }],
      siteName: 'GoBike Australia',
      locale: 'en_AU',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: finalTwitterTitle,
      description: finalTwitterDescription,
      images: [finalOgImage],
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

  // 🚀 শুধু প্রোডাক্টের নিজস্ব FAQ (admin-এ যোগ করা) — কোনো site-wide fallback
  // নাই ইচ্ছাকৃতভাবে। FAQ না থাকলে সেকশন/schema দুটোই সম্পূর্ণ বাদ যায় —
  // অনেক প্রোডাক্টে হুবহু একই generic FAQ দেখালে Google-এর কাছে duplicate/thin
  // content মনে হতো (ঠিক সেই কারণেই আগে title/description duplication ফিক্স
  // করা হয়েছিল)।
  const faqsForSchema = (product as { faqs?: { question: string; answer: string }[] }).faqs ?? [];

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
  // 🚀 Search Console-এ "Number out of range for suggestedMinAge" error ধরা
  // পড়েছিল — regex কোনো product name-এ ভুলভাবে অবাস্তব সংখ্যা ধরে ফেললে (বা
  // min > max হয়ে গেলে) সেটা যাতে কখনো schema-তে না যায়, তাই sanity bounds
  // চেক করা হচ্ছে (এই দোকান কিডস/টিনস bike-এর, তাই ০-২১ বছরের বাইরে কিছু হলে
  // সেটা নিশ্চিতভাবেই ভুল ম্যাচ, বাদ দেওয়া হচ্ছে)।
  const ageMatch = product.name.match(/ages?\s*(\d+)\s*[-–—]\s*(\d+)/i);
  const ageMin = ageMatch ? Number(ageMatch[1]) : NaN;
  const ageMax = ageMatch ? Number(ageMatch[2]) : NaN;
  const isSaneAgeRange = ageMatch && ageMin >= 0 && ageMax >= 0 && ageMin <= ageMax && ageMax <= 21;
  const audience = isSaneAgeRange
    ? { '@type': 'PeopleAudience', suggestedMinAge: ageMin, suggestedMaxAge: ageMax }
    : undefined;

  // ★★★ JSON-LD Schema ★★★
  // 🚀 aggregateRating/review — plain Product আর ProductGroup দুই জায়গাতেই
  // হুবহু একই দরকার (রিভিউ পুরো প্রোডাক্টের জন্য, variant-ভিত্তিক না), তাই
  // একবারই কম্পিউট করে দুই জায়গায় reuse করা হচ্ছে।
  const aggregateRatingSchema = product.reviewCount > 0 ? {
    '@type': 'AggregateRating',
    ratingValue: product.averageRating,
    reviewCount: product.reviewCount,
  } : undefined;
  // সব approved review-ই দেখানো হচ্ছে (নতুন query লাগেনি, product page
  // ইতিমধ্যেই এই ডেটা আনে)।
  const reviewSchema = product.reviews.edges.length > 0
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
    : undefined;

  // 🚀 GoBike Australia — metric store, তাই kg/cm ধরেই QuantitativeValue
  // বানানো হচ্ছে (Product model-এর weightUnit/dimensionUnit-এর ডিফল্টও
  // "kg"/"cm")। মান না থাকলে (undefined) সেই ফিল্ডটাই বাদ যাবে।
  const weightSchema = product.weight ? { '@type': 'QuantitativeValue', value: product.weight, unitCode: 'KGM' } : undefined;
  const heightSchema = product.height ? { '@type': 'QuantitativeValue', value: product.height, unitCode: 'CMT' } : undefined;
  const widthSchema = product.width ? { '@type': 'QuantitativeValue', value: product.width, unitCode: 'CMT' } : undefined;
  const depthSchema = product.length ? { '@type': 'QuantitativeValue', value: product.length, unitCode: 'CMT' } : undefined;

  // 🚀 Offer-এর common অংশ (shipping/return policy/condition/seller) — এটা
  // আলাদা করা হয়েছে যাতে variant-প্রতি Offer বানানোর সময় (ProductGroup, নিচে)
  // কোড কপি-পেস্ট না করতে হয়, শুধু একবার লিখেই দুই জায়গায় reuse হয়। variant-
  // ভেদে ওজন/মাপ সাধারণত প্রায় একই থাকে (যেমন T-shirt-এর সাইজ), তাই product-
  // level weight/dimension-ই সব variant-এ reuse করা হচ্ছে।
  const commonOfferExtras = {
    itemCondition: 'https://schema.org/NewCondition',
    seller: { '@type': 'Organization', name: 'GoBike Australia' },
    // ৮০% অর্ডারে coupon দিয়ে free shipping দেওয়া হয় বলে এটা business-এর
    // de facto standard policy হিসেবে ধরে $0 declare করা হচ্ছে (owner-এর
    // সিদ্ধান্ত)। destination/delivery timeframe নিচে বাস্তব এবং /shipping-policy
    // পেজের সাথে হুবহু মিলছে।
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'AUD' },
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'AU' },
      weight: weightSchema,
      height: heightSchema,
      width: widthSchema,
      depth: depthSchema,
      deliveryTime: {
        '@type': 'ShippingDeliveryTime',
        handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 2, unitCode: 'd' },
        transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 7, unitCode: 'd' },
      },
    },
    // /refund-and-returns-policy পেজের সাথে হুবহু মিলিয়ে — full refund
    // (refundType), brand-new condition-এই ফেরত নেওয়া হয় (itemCondition),
    // customer নিজে label ব্যবস্থা করে (returnLabelSource), damaged/used
    // ফেরতে ২০% পর্যন্ত restocking fee, আর faulty item-এর জন্য আলাদাভাবে
    // free return (itemDefectReturnFees) — সবই policy পেজে সত্যিই লেখা আছে।
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'AU',
      returnPolicyCountry: 'AU',
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 14,
      returnMethod: 'https://schema.org/ReturnByMail',
      returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
      returnLabelSource: 'https://schema.org/ReturnLabelCustomerResponsibility',
      itemCondition: 'https://schema.org/NewCondition',
      refundType: 'https://schema.org/FullRefund',
      restockingFee: 20,
      itemDefectReturnFees: 'https://schema.org/FreeReturn',
    },
  };

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description?.replace(/<[^>]*>?/gm, '').substring(0, 5000),
    image: [product.image?.sourceUrl, ...(product.galleryImages.nodes.map((img: { sourceUrl: string }) => img.sourceUrl) || [])].filter(Boolean),
    sku: product.sku || product.databaseId.toString(),
    // আগে ভুলভাবে sku-এর same ভ্যালু mpn-এ বসানো হচ্ছিল — এখন আসল product.mpn
    // field ব্যবহার হচ্ছে (Google নিজেই এই ভুলটাকে known/documented MPN-error
    // pattern হিসেবে চিহ্নিত করে); mpn না থাকলে ফিল্ডটাই বাদ যাবে (undefined)।
    mpn: product.mpn || undefined,
    // 🚀 আগে gtin14 হার্ডকোড ছিল, ধরে নেওয়া হতো barcode সবসময় ১৪ ডিজিট —
    // বাস্তবে UPC/EAN বারকোড ৮/১২/১৩/১৪ যেকোনো length-এর হতে পারে। generic
    // `gtin` ব্যবহার করলে Google/schema.org নিজেই length detect করে নেয়
    // (Google-এর merchant-listing ডকুমেন্টেশনে এটাই recommended)।
    gtin: product.barcode || undefined,
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
      // এই দামে product যেদিন থেকে available (তৈরির তারিখ) — priceValidUntil-এর জোড়া
      validFrom: product.createdAt.split('T')[0],
      availability: availability,
      ...commonOfferExtras,
    },
    aggregateRating: aggregateRatingSchema,
    review: reviewSchema,
  };

  // 🚀 Product Variant structured data (Google, 2024+) — যেসব প্রোডাক্টের
  // color/size ভ্যারিয়েশন আছে (এই মুহূর্তে শুধু T-Shirt-এ, কিন্তু bike-এও রং
  // অপশন যোগ হলে আপনাআপনি কাজ করবে) তাদের জন্য প্লেইন Product-এর বদলে
  // ProductGroup + hasVariant পাঠানো হয় — Google search-এ সরাসরি variant
  // অপশন (সাইজ/রং) দেখাতে পারে। সব variant একই পেজ URL শেয়ার করে (আলাদা
  // variant URL নাই, ক্লায়েন্ট-সাইড সিলেক্টর), তাই প্রতিটা variant offer-এর
  // url একই।
  const variantNodes = product.variations?.nodes ?? [];
  const variesBy = Array.from(new Set(variantNodes.flatMap((v) => v.attributes.nodes.map((a) => a.name.toLowerCase()))));
  // color/material/pattern — group-wide, কিন্তু variesBy-তে থাকলে (variant-ভেদে
  // বদলায়) group level-এ বসানো ভুল/misleading হতো, তাই বাদ।
  const groupOnlyProps: Record<string, string | undefined> = {
    color: variesBy.includes('color') ? undefined : (product.color || undefined),
    material: variesBy.includes('material') ? undefined : (product.material || undefined),
    pattern: variesBy.includes('pattern') ? undefined : (product.pattern || undefined),
  };
  const productGroupSchema = variantNodes.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ProductGroup',
    name: product.name,
    description: product.description?.replace(/<[^>]*>?/gm, '').substring(0, 5000),
    image: productSchema.image,
    mpn: product.mpn || undefined,
    category: product.googleProductCategory || product.primaryCategory?.name || undefined,
    ...groupOnlyProps,
    brand: { '@type': 'Brand', name: 'GoBike' },
    productGroupID: product.id,
    variesBy,
    audience,
    aggregateRating: aggregateRatingSchema,
    review: reviewSchema,
    hasVariant: variantNodes.map((v) => {
      const variantPrice = getPriceAsNumber(v.salePrice) || getPriceAsNumber(v.price) || 0;
      const variantAvailability = v.stockStatus === 'IN_STOCK' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
      const variantProps: Record<string, string> = {};
      v.attributes.nodes.forEach((a) => { variantProps[a.name.toLowerCase()] = a.value; });
      return {
        '@type': 'Product',
        name: v.name || product.name,
        // Facebook feed-এর g:id আর GTM content_id-এর সাথে হুবহু একই ফরম্যাট
        // (productId_variantId) — সাইট-জুড়ে একটাই ID scheme।
        sku: `${product.id}_${v.id}`,
        // variant-এর নিজস্ব barcode থাকলে সেটাই এই variant-এর gtin (প্রতিটা
        // variant বাস্তবে আলাদা physical পণ্য, তাই আলাদা barcode থাকা উচিত)
        gtin: v.barcode || undefined,
        image: v.image?.sourceUrl || product.image?.sourceUrl,
        ...variantProps,
        offers: {
          '@type': 'Offer',
          url: `https://gobike.au/product/${product.slug}`,
          priceCurrency: 'AUD',
          price: variantPrice,
          availability: variantAvailability,
          ...commonOfferExtras,
        },
      };
    }),
  } : null;

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

  const faqSchema = faqsForSchema.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqsForSchema.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: stripMarkdown(faq.answer) }
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
  // admin এখন dedicated videoTitle/videoDescription লিখতে পারেন (Product
  // Video sidebar widget) — খালি রাখলে product-এর name/description/
  // createdAt দিয়ে honest approximation, ঠিক ProductVideo.tsx-এর মতোই।
  const mainVideoSchema = product.videoUrl ? {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: (product as { videoTitle?: string }).videoTitle || `${product.name} — Product Video`,
    description: (product as { videoDescription?: string }).videoDescription
      || (product.shortDescription || product.description || product.name).replace(/<[^>]*>?/gm, '').substring(0, 500),
    thumbnailUrl: product.videoThumbnail || product.image?.sourceUrl,
    uploadDate: product.createdAt,
    contentUrl: product.videoUrl,
  } : null;

  return (
    <div>
      {/* Variant থাকলে ProductGroup (Google-এর variant markup), না থাকলে
          সাধারণ Product — দুটো কখনো একসাথে যায় না, একই URL-এর জন্য একটাই
          top-level schema thাকা উচিত। */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productGroupSchema || productSchema) }} />
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
      
      {/* Client Component কে product পাঠানো হচ্ছে — visible FAQ section এখন
          এর ভেতরেই render হয় (CustomSections/"Key Features"-এর ঠিক নিচে) */}
      <ProductClient product={product} />
    </div>
  );
}