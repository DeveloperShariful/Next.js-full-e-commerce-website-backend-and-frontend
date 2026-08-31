// app/admin/products/create/_components/StructuredDataPreview.tsx
// 🚀 Structured Data (JSON-LD) Preview — SeoBox.tsx থেকে আলাদা করা, নিজস্ব
// collapsible header সহ। Read-only — product/[slug]/page.tsx-এর
// productSchema/breadcrumbSchema/faqSchema-র সাথে একই fields দিয়ে বানানো, যাতে
// সেভ হওয়ার পরে লাইভ সাইটে ঠিক কী JSON যাবে সেটা এখানেই আন্দাজ করা যায়। id/
// productCode/reviews-এর মতো কিছু ফিল্ড সেভ হওয়ার আগ পর্যন্ত থাকে না, সেগুলোর
// জায়গায় placeholder নোট দেখানো হয়।
"use client";

import { useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Code2, ChevronUp, ChevronDown } from "lucide-react";
import { ProductFormData } from "../types";

const stripHtml = (html: string) => html.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();

// product/[slug]/page.tsx-এর একই helper — FAQPage schema-র acceptedAnswer.text
// প্লেইন টেক্সট হওয়া উচিত, raw markdown syntax (**bold** ইত্যাদি) না।
const stripMarkdown = (md: string) =>
  md
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/#{1,6}\s*/g, "")
    .replace(/\n{2,}/g, " ")
    .replace(/\n/g, " ")
    .trim();

export default function StructuredDataPreview() {
  const { watch } = useFormContext<ProductFormData>();

  const [isExpanded, setIsExpanded] = useState(false);

  const name = watch("name") || "";
  const slug = watch("slug") || "";
  const description = watch("description") || "";
  const featuredImage = watch("featuredImage") || "";

  const metaTitleRaw = watch("metaTitle") || "";
  const metaDescRaw = watch("metaDesc") || "";
  const canonicalRaw = watch("seoCanonicalUrl") || "";
  const ogImageRaw = watch("seoSchema.ogImage") || "";

  const productId = watch("id") || "";
  const sku = watch("sku") || "";
  const barcode = watch("barcode") || "";
  const mpn = watch("mpn") || "";
  const size = watch("size") || "";
  const color = watch("color") || "";
  const material = watch("material") || "";
  const pattern = watch("pattern") || "";
  const googleProductCategory = watch("googleProductCategory") || "";
  const price = watch("price");
  const salePrice = watch("salePrice");
  const trackQuantity = watch("trackQuantity");
  const stock = watch("stock");
  const faqs = watch("faqs") || [];
  const galleryImages = watch("galleryImages") || [];
  const shortDescription = watch("shortDescription") || "";
  const videoUrl = watch("videoUrl") || "";
  const videoThumbnail = watch("videoThumbnail") || "";
  const videoTitleRaw = watch("videoTitle") || "";
  const videoDescRaw = watch("videoDescription") || "";
  const variations = watch("variations") || [];
  const weight = watch("weight");
  const length = watch("length");
  const width = watch("width");
  const height = watch("height");

  // ── SeoBox.tsx-এর সাথে হুবহু একই fallback chain (canonical/OG image) ──
  const autoCanonical = `https://gobike.au/product/${slug || "product-slug"}`;
  const effCanonical = canonicalRaw || autoCanonical;
  const effOgImage = ogImageRaw || featuredImage || "";

  const availability = trackQuantity && (stock ?? 0) <= 0 ? "https://schema.org/OutOfStock" : "https://schema.org/InStock";

  // GoBike Australia — metric store, তাই kg/cm ধরেই QuantitativeValue।
  // product/[slug]/page.tsx-এর সাথে হুবহু একই।
  const weightSchema = weight ? { "@type": "QuantitativeValue", value: weight, unitCode: "KGM" } : undefined;
  const heightSchema = height ? { "@type": "QuantitativeValue", value: height, unitCode: "CMT" } : undefined;
  const widthSchema = width ? { "@type": "QuantitativeValue", value: width, unitCode: "CMT" } : undefined;
  const depthSchema = length ? { "@type": "QuantitativeValue", value: length, unitCode: "CMT" } : undefined;

  // product/[slug]/page.tsx-এর একই regex — product name-এ "Ages 5-9" টাইপ
  // টেক্সট থাকলে সেখান থেকে বয়সসীমা বের করা হয় (dedicated ageGroup ফিল্ড
  // খালি থাকলে)। Search Console-এর "suggestedMinAge out of range" error
  // এড়াতে sanity bounds — লাইভ কোডের সাথে হুবহু একই।
  const audience = useMemo(() => {
    const ageMatch = name.match(/ages?\s*(\d+)\s*[-–—]\s*(\d+)/i);
    const ageMin = ageMatch ? Number(ageMatch[1]) : NaN;
    const ageMax = ageMatch ? Number(ageMatch[2]) : NaN;
    const isSaneAgeRange = ageMatch && ageMin >= 0 && ageMax >= 0 && ageMin <= ageMax && ageMax <= 21;
    return isSaneAgeRange
      ? { "@type": "PeopleAudience", suggestedMinAge: ageMin, suggestedMaxAge: ageMax }
      : undefined;
  }, [name]);

  // এই দুটো site-wide policy constant — /shipping-policy আর
  // /refund-and-returns-policy পেজের সাথে হুবহু মিলিয়ে, প্রতিটা প্রোডাক্টে
  // (এবং প্রতিটা variant-এ) একই থাকে, তাই admin-এ এডিট করার কোনো ফিল্ড নাই —
  // শুধু প্রিভিউ। plain Product আর ProductGroup-এর প্রতিটা variant offer —
  // দুই জায়গাতেই reuse হয়, যাতে কোড কপি-পেস্ট না লাগে।
  const commonOfferExtras = {
    itemCondition: "https://schema.org/NewCondition",
    seller: { "@type": "Organization", name: "GoBike Australia" },
    shippingDetails: {
      "@type": "OfferShippingDetails",
      shippingRate: { "@type": "MonetaryAmount", value: 0, currency: "AUD" },
      shippingDestination: { "@type": "DefinedRegion", addressCountry: "AU" },
      weight: weightSchema,
      height: heightSchema,
      width: widthSchema,
      depth: depthSchema,
      deliveryTime: {
        "@type": "ShippingDeliveryTime",
        handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 2, unitCode: "d" },
        transitTime: { "@type": "QuantitativeValue", minValue: 2, maxValue: 7, unitCode: "d" },
      },
    },
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "AU",
      returnPolicyCountry: "AU",
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 14,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
      returnLabelSource: "https://schema.org/ReturnLabelCustomerResponsibility",
      itemCondition: "https://schema.org/NewCondition",
      refundType: "https://schema.org/FullRefund",
      restockingFee: 20,
      itemDefectReturnFees: "https://schema.org/FreeReturn",
    },
  };

  // রিভিউ ডেটা সেভ করার আগে থাকেই না — plain Product আর ProductGroup দুই
  // জায়গাতেই একই placeholder note
  const aggregateRatingPreview = productId ? "(shown here once the product has reviews)" : undefined;
  const reviewPreview = productId ? "(shown here once the product has reviews)" : undefined;

  const previewProductSchema = useMemo(() => {
    const galleryImageUrls = galleryImages
      .map((img) => (typeof img === "object" ? img.url : img))
      .filter((u): u is string => Boolean(u));

    return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: name || "(product name)",
    description: stripHtml(description).slice(0, 300) + (description.length > 300 ? "…" : ""),
    image: [effOgImage, ...galleryImageUrls].filter(Boolean),
    sku: sku || (productId ? "(auto — product code)" : "assigned after save"),
    mpn: mpn || undefined,
    gtin: barcode || undefined,
    size: size || undefined,
    color: color || undefined,
    material: material || undefined,
    pattern: pattern || undefined,
    category: googleProductCategory || undefined,
    audience,
    brand: { "@type": "Brand", name: "GoBike" },
    offers: {
      "@type": "Offer",
      url: effCanonical,
      priceCurrency: "AUD",
      price: salePrice || price || 0,
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
      validFrom: productId ? "(product's creation date)" : "assigned after save",
      availability,
      ...commonOfferExtras,
    },
    aggregateRating: aggregateRatingPreview,
    review: reviewPreview,
    };
  }, [name, description, effOgImage, galleryImages, sku, productId, mpn, barcode, size, color, material, pattern, googleProductCategory, audience, effCanonical, salePrice, price, availability, commonOfferExtras, aggregateRatingPreview, reviewPreview]);

  // 🚀 Product Variant structured data (Google, 2024+) — variation থাকলে
  // plain Product-এর বদলে এটা যাবে (product/[slug]/page.tsx-এর সাথে হুবহু
  // একই যুক্তি)।
  const previewProductGroupSchema = useMemo(() => {
    if (variations.length === 0) return null;
    const variesBy = Array.from(
      new Set(variations.flatMap((v) => Object.keys(v.attributes || {}).map((k) => k.toLowerCase())))
    );
    // color/material/pattern/mpn — group-wide, কিন্তু যেটা variesBy-তে আছে
    // (মানে variant-ভেদে বদলায়) সেটা group level-এ বসানো ভুল/misleading হতো,
    // তাই বাদ। size সাধারণত variesBy-তেই থাকে বলে group level-এ কখনোই বসে না।
    const groupOnlyProps: Record<string, string | undefined> = {
      color: variesBy.includes("color") ? undefined : (color || undefined),
      material: variesBy.includes("material") ? undefined : (material || undefined),
      pattern: variesBy.includes("pattern") ? undefined : (pattern || undefined),
    };
    const galleryImageUrls = galleryImages
      .map((img) => (typeof img === "object" ? img.url : img))
      .filter((u): u is string => Boolean(u));
    return {
      "@context": "https://schema.org",
      "@type": "ProductGroup",
      name: name || "(product name)",
      description: stripHtml(description).slice(0, 300) + (description.length > 300 ? "…" : ""),
      image: [effOgImage, ...galleryImageUrls].filter(Boolean),
      mpn: mpn || undefined,
      category: googleProductCategory || undefined,
      ...groupOnlyProps,
      brand: { "@type": "Brand", name: "GoBike" },
      productGroupID: productId || "assigned after save",
      variesBy,
      audience,
      aggregateRating: aggregateRatingPreview,
      review: reviewPreview,
      hasVariant: variations.map((v) => {
        const variantPrice = v.salePrice || v.price || 0;
        const variantAvailability = v.trackQuantity && v.stock <= 0 ? "https://schema.org/OutOfStock" : "https://schema.org/InStock";
        const variantProps: Record<string, string> = {};
        Object.entries(v.attributes || {}).forEach(([k, val]) => { variantProps[k.toLowerCase()] = val; });
        return {
          "@type": "Product",
          name: v.name || name || "(variant name)",
          // Facebook feed g:id / GTM content_id-এর সাথে হুবহু একই ফরম্যাট
          sku: v.id ? `${productId || "(product id)"}_${v.id}` : "assigned after save",
          // variant-এর নিজস্ব barcode থাকলে সেটাই এই variant-এর gtin (প্রতিটা
          // variant বাস্তবে আলাদা physical পণ্য, তাই আলাদা barcode থাকা উচিত)
          gtin: v.barcode || undefined,
          image: (typeof v.images?.[0] === "object" ? v.images[0].url : v.images?.[0]) || effOgImage || undefined,
          ...variantProps,
          offers: {
            "@type": "Offer",
            url: effCanonical,
            priceCurrency: "AUD",
            price: variantPrice,
            availability: variantAvailability,
            ...commonOfferExtras,
          },
        };
      }),
    };
  }, [variations, name, description, effOgImage, galleryImages, mpn, googleProductCategory, color, material, pattern, productId, audience, aggregateRatingPreview, reviewPreview, effCanonical, commonOfferExtras]);

  const previewBreadcrumbSchema = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://gobike.au" },
      { "@type": "ListItem", position: 2, name: "(product's category)", item: "https://gobike.au/shop" },
      { "@type": "ListItem", position: 3, name: name || "(product name)", item: effCanonical },
    ],
  }), [name, effCanonical]);

  // faqs খালি থাকলে লাইভ পেজে এই schema block-টাই থাকবে না (কোনো fallback নাই,
  // ইচ্ছাকৃতভাবে — অনেক প্রোডাক্টে একই generic FAQ দেখালে duplicate content হতো)
  const previewFaqSchema = useMemo(() => (
    faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question || "(question)",
            acceptedAnswer: { "@type": "Answer", text: stripMarkdown(faq.answer || "") },
          })),
        }
      : null
  ), [faqs]);

  // ProductVideo.tsx / product/[slug]/page.tsx-এর mainVideoSchema-র সাথে হুবহু
  // একই fallback chain। videoUrl খালি থাকলে লাইভ পেজে এই schema block-টাই
  // থাকে না।
  const previewVideoSchema = useMemo(() => {
    if (!videoUrl) return null;
    const autoVideoTitle = name ? `${name} — Product Video` : "(product name) — Product Video";
    const autoVideoDesc = stripHtml(shortDescription || description || name).slice(0, 500) || "(product description)";
    return {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: videoTitleRaw || autoVideoTitle,
      description: videoDescRaw || autoVideoDesc,
      thumbnailUrl: videoThumbnail || effOgImage || "(featured image, if no thumbnail set)",
      uploadDate: productId ? "(product's creation date)" : "assigned after save",
      contentUrl: videoUrl,
    };
  }, [videoUrl, videoTitleRaw, name, shortDescription, description, videoDescRaw, videoThumbnail, effOgImage, productId]);

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-sm rounded-[3px] mt-5">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-2 border-b border-[#f0f0f1] bg-white cursor-pointer select-none"
      >
        <Code2 size={15} className="text-[#8c8f94]" />
        <span className="font-semibold text-[#1d2327] text-[14px]">Structured Data (JSON-LD) Preview</span>
        {isExpanded ? <ChevronUp size={16} className="text-[#8c8f94] ml-auto" /> : <ChevronDown size={16} className="text-[#8c8f94] ml-auto" />}
      </div>

      {isExpanded && (
      <div className="p-4 space-y-3">
        <p className="text-[11px] text-[#646970]">
          Read-only — auto-generated from Meta Title/Description, Open Graph, FAQ, Product Video, and the fields on
          the other tabs. Live pages actually send these as separate <code>&lt;script&gt;</code> blocks (Product,
          Breadcrumb, FAQ, Video), not one combined blob.
          {!productId && " Fields like SKU that are assigned on save show a placeholder until then."}
        </p>

        <div>
          <p className="text-[11px] font-semibold text-[#2271b1] mb-1">
            {previewProductGroupSchema ? "ProductGroup (has variants)" : "Product"}
          </p>
          <pre className="text-[11px] font-mono bg-[#1e1e1e] text-[#10b981] p-3 rounded-[3px] overflow-x-auto max-h-[260px] overflow-y-auto">
            {JSON.stringify(previewProductGroupSchema || previewProductSchema, null, 2)}
          </pre>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-[#2271b1] mb-1">BreadcrumbList</p>
          <pre className="text-[11px] font-mono bg-[#1e1e1e] text-[#10b981] p-3 rounded-[3px] overflow-x-auto max-h-[160px] overflow-y-auto">
            {JSON.stringify(previewBreadcrumbSchema, null, 2)}
          </pre>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-[#2271b1] mb-1">
            FAQPage {faqs.length === 0 && <span className="text-[#646970] font-normal">(no FAQ added — this block won&apos;t be sent)</span>}
          </p>
          {previewFaqSchema ? (
            <pre className="text-[11px] font-mono bg-[#1e1e1e] text-[#10b981] p-3 rounded-[3px] overflow-x-auto max-h-[200px] overflow-y-auto">
              {JSON.stringify(previewFaqSchema, null, 2)}
            </pre>
          ) : (
            <p className="text-[11px] text-[#8c8f94] italic m-0">Add questions in the FAQ box above to see it here.</p>
          )}
        </div>

        <div>
          <p className="text-[11px] font-semibold text-[#2271b1] mb-1">
            VideoObject {!videoUrl && <span className="text-[#646970] font-normal">(no video added — this block won&apos;t be sent)</span>}
          </p>
          {previewVideoSchema ? (
            <pre className="text-[11px] font-mono bg-[#1e1e1e] text-[#10b981] p-3 rounded-[3px] overflow-x-auto max-h-[200px] overflow-y-auto">
              {JSON.stringify(previewVideoSchema, null, 2)}
            </pre>
          ) : (
            <p className="text-[11px] text-[#8c8f94] italic m-0">Add a video in the Product Video box (right sidebar) to see it here.</p>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
