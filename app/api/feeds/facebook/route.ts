//app/api/feeds/facebook/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gobike.au";

// ============================================================================
// HELPERS
// ============================================================================
function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return "";
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return c;
    }
  });
}

function stripHtmlTags(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function formatUrl(url: string | null | undefined): string {
  if (!url) return "";
  // Replace any localhost or staging origin with the real production SITE_URL
  return url.replace(/^https?:\/\/(localhost:\d+|[^/]*sharifulbuilds\.com)/, SITE_URL);
}

// Strip SEO template variables like %title%, %sep%, %sitename%
function isSeoTemplate(s: string): boolean {
  return /%[a-z_]+%/i.test(s);
}

// Extract numeric taxonomy ID from combined format "1026 - Sporting Goods > ..."
// Returns just the path (after " - ") for Facebook catalog which prefers text paths
function parseTaxonomyPath(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  // "1026 - Sporting Goods > Outdoor Recreation > ..." → "Sporting Goods > ..."
  const match = trimmed.match(/^\d+\s*-\s*(.+)$/);
  if (match) return match[1].trim();
  return trimmed || undefined;
}

// ============================================================================
// GET DYNAMIC FACEBOOK COMMERCE XML PRODUCT FEED (WITH VARIATIONS)
// ============================================================================
export async function GET() {
  try {
    const products = await db.product.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        OR: [
          { facebookSyncMode: null },
          { facebookSyncMode: "SYNC_AND_SHOW" },
          { facebookSyncMode: "SYNC_ONLY" },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        shortDescription: true,
        productType: true,
        condition: true,
        price: true,
        salePrice: true,
        saleStart: true,
        saleEnd: true,
        stock: true,
        trackQuantity: true,
        featuredImage: true,
        mpn: true,
        barcode: true,
        gender: true,
        ageGroup: true,
        googleProductCategory: true,
        googleTitle: true,
        googleIsBundle: true,
        customLabels: true,
        metafields: true,
        facebookSyncMode: true,
        facebookDescription: true,
        facebookImageType: true,
        facebookPrice: true,
        size: true,
        color: true,
        material: true,
        pattern: true,
        brand: { select: { name: true } },
        categories: { select: { id: true, name: true, googleCategoryName: true } },
        variants: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            price: true,
            salePrice: true,
            stock: true,
            trackQuantity: true,
            sku: true,
            barcode: true,
            attributes: true,
            images: { select: { url: true } },
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>GoBike Facebook Enterprise Product Feed</title>
    <link>${SITE_URL}</link>
    <description>Dynamic Organic &amp; Ads Product Feed for Facebook and Instagram Commerce</description>
    <language>en</language>
    `;

    products.forEach((product) => {
      const availabilityStatus = (product.trackQuantity === false || product.stock > 0) ? "in stock" : "out of stock";

      // Use googleTitle as shopping title override if set and not an SEO template string
      const finalTitle =
        (product.googleTitle && product.googleTitle.trim() !== "" && !isSeoTemplate(product.googleTitle))
          ? product.googleTitle
          : product.name;

      // Facebook description > product description
      const finalDescription =
        (product.facebookDescription && product.facebookDescription.trim() !== "")
          ? product.facebookDescription
          : (product.description || product.shortDescription || product.name);

      // Facebook price override (if explicitly set)
      const finalPrice = product.facebookPrice ? Number(product.facebookPrice) : Number(product.price);

      // Google Product Category — prefer category-level mapping, then product-level
      // Use path only (strip numeric ID prefix) since Facebook prefers text paths
      const rawCategory =
        product.categories.find(c => c.googleCategoryName)?.googleCategoryName ||
        product.googleProductCategory;
      const categoryName = parseTaxonomyPath(rawCategory);

      const brandName = product.brand?.name || "GoBike";

      // Extract Google-specific metafields
      let google_size_system = "";
      let google_size_type = "";
      let google_multipack = "";
      let google_adult_content = false;
      let google_availability_date = "";

      if (product.metafields && typeof product.metafields === "object" && !Array.isArray(product.metafields)) {
        const meta = product.metafields as unknown as Record<string, unknown>;
        google_size_system = typeof meta.google_size_system === "string" ? meta.google_size_system : "";
        google_size_type = typeof meta.google_size_type === "string" ? meta.google_size_type : "";
        google_adult_content = meta.google_adult_content === true;
        google_availability_date = typeof meta.google_availability_date === "string" ? meta.google_availability_date : "";
        google_multipack = typeof meta.google_multipack === "string" ? meta.google_multipack : "";
      }

      // Facebook direct fields (size, color, material, pattern columns)
      const feedSize     = product.size     || "";
      const feedColor    = product.color    || "";
      const feedMaterial = product.material || "";
      const feedPattern  = product.pattern  || "";

      // ======================================================================
      // VARIABLE products → one <item> per variant
      // ======================================================================
      if (product.productType === "VARIABLE" && product.variants.length > 0) {
        product.variants.forEach((variant) => {
          const variantId = `${product.id}_${variant.id}`;
          const variantTitle = `${finalTitle} - ${variant.name}`;
          const variantAvailability = (variant.trackQuantity === false || variant.stock > 0) ? "in stock" : "out of stock";

          const variantImage = variant.images && variant.images.length > 0
            ? variant.images[0].url
            : product.featuredImage;

          const varAttrs = variant.attributes as Record<string, string> || {};
          const varColor = varAttrs.Color || varAttrs.color || varAttrs.Colour || varAttrs.colour || feedColor;
          const varSize  = varAttrs.Size  || varAttrs.size  || feedSize;

          xml += `
    <item>
      <g:id>${escapeXml(variantId)}</g:id>
      <g:item_group_id>${escapeXml(product.id)}</g:item_group_id>
      <g:title>${escapeXml(variantTitle)}</g:title>
      <g:description>${escapeXml(stripHtmlTags(finalDescription))}</g:description>
      <g:link>${escapeXml(formatUrl(`${SITE_URL}/product/${product.slug}`))}</g:link>
      <g:image_link>${escapeXml(formatUrl(variantImage))}</g:image_link>
      <g:brand>${escapeXml(brandName)}</g:brand>
      <g:condition>${escapeXml(product.condition.toLowerCase())}</g:condition>
      <g:availability>${escapeXml(variantAvailability)}</g:availability>
      <g:quantity>${variant.stock}</g:quantity>
      <g:price>${Number(variant.price).toFixed(2)} AUD</g:price>
          `;

          if (variant.salePrice) {
            xml += `      <g:sale_price>${Number(variant.salePrice).toFixed(2)} AUD</g:sale_price>\n`;
          }
          if (variant.sku) {
            xml += `      <g:mpn>${escapeXml(variant.sku)}</g:mpn>\n`;
          } else if (product.mpn) {
            xml += `      <g:mpn>${escapeXml(product.mpn)}</g:mpn>\n`;
          }
          if (variant.barcode) {
            xml += `      <g:gtin>${escapeXml(variant.barcode)}</g:gtin>\n`;
          } else if (product.barcode) {
            xml += `      <g:gtin>${escapeXml(product.barcode)}</g:gtin>\n`;
          }
          if (varColor)    xml += `      <g:color>${escapeXml(varColor)}</g:color>\n`;
          if (varSize)     xml += `      <g:size>${escapeXml(varSize)}</g:size>\n`;
          if (google_size_system) xml += `      <g:size_system>${escapeXml(google_size_system.toUpperCase())}</g:size_system>\n`;
          if (google_size_type)   xml += `      <g:size_type>${escapeXml(google_size_type.toLowerCase())}</g:size_type>\n`;
          if (feedMaterial) xml += `      <g:material>${escapeXml(feedMaterial)}</g:material>\n`;
          if (feedPattern)  xml += `      <g:pattern>${escapeXml(feedPattern)}</g:pattern>\n`;
          if (google_adult_content) xml += `      <g:adult>yes</g:adult>\n`;
          if (product.gender)   xml += `      <g:gender>${escapeXml(product.gender.toLowerCase())}</g:gender>\n`;
          if (product.ageGroup) xml += `      <g:age_group>${escapeXml(product.ageGroup.toLowerCase())}</g:age_group>\n`;
          if (categoryName) xml += `      <g:google_product_category>${escapeXml(categoryName)}</g:google_product_category>\n`;
          if (product.saleStart && product.saleEnd) {
            xml += `      <g:sale_price_effective_date>${product.saleStart.toISOString()}/${product.saleEnd.toISOString()}</g:sale_price_effective_date>\n`;
          }
          if (Array.isArray(product.customLabels)) {
            (product.customLabels as string[]).forEach((label, idx) => {
              if (idx <= 4 && label) xml += `      <g:custom_label_${idx}>${escapeXml(label)}</g:custom_label_${idx}>\n`;
            });
          }

          xml += `    </item>\n`;
        });
      }
      // ======================================================================
      // SIMPLE / VIRTUAL / BUNDLE products → one <item>
      // ======================================================================
      else {
        xml += `
    <item>
      <g:id>${escapeXml(product.id)}</g:id>
      <g:title>${escapeXml(finalTitle)}</g:title>
      <g:description>${escapeXml(stripHtmlTags(finalDescription))}</g:description>
      <g:link>${escapeXml(formatUrl(`${SITE_URL}/product/${product.slug}`))}</g:link>
      <g:image_link>${escapeXml(formatUrl(product.featuredImage))}</g:image_link>
      <g:brand>${escapeXml(brandName)}</g:brand>
      <g:condition>${escapeXml(product.condition.toLowerCase())}</g:condition>
      <g:availability>${escapeXml(availabilityStatus)}</g:availability>
      <g:quantity>${product.stock}</g:quantity>
      <g:price>${finalPrice.toFixed(2)} AUD</g:price>
        `;

        if (product.salePrice && !product.facebookPrice) {
          xml += `      <g:sale_price>${Number(product.salePrice).toFixed(2)} AUD</g:sale_price>\n`;
        }
        if (product.mpn)     xml += `      <g:mpn>${escapeXml(product.mpn)}</g:mpn>\n`;
        if (product.barcode) xml += `      <g:gtin>${escapeXml(product.barcode)}</g:gtin>\n`;
        if (product.gender)   xml += `      <g:gender>${escapeXml(product.gender.toLowerCase())}</g:gender>\n`;
        if (product.ageGroup) xml += `      <g:age_group>${escapeXml(product.ageGroup.toLowerCase())}</g:age_group>\n`;
        if (feedSize)     xml += `      <g:size>${escapeXml(feedSize)}</g:size>\n`;
        if (google_size_system) xml += `      <g:size_system>${escapeXml(google_size_system.toUpperCase())}</g:size_system>\n`;
        if (google_size_type)   xml += `      <g:size_type>${escapeXml(google_size_type.toLowerCase())}</g:size_type>\n`;
        if (feedColor)    xml += `      <g:color>${escapeXml(feedColor)}</g:color>\n`;
        if (feedMaterial) xml += `      <g:material>${escapeXml(feedMaterial)}</g:material>\n`;
        if (feedPattern)  xml += `      <g:pattern>${escapeXml(feedPattern)}</g:pattern>\n`;
        if (google_multipack) xml += `      <g:multipack>${escapeXml(google_multipack)}</g:multipack>\n`;
        if (google_adult_content) xml += `      <g:adult>yes</g:adult>\n`;
        if (google_availability_date) {
          xml += `      <g:availability_date>${new Date(google_availability_date).toISOString()}</g:availability_date>\n`;
        }
        if (categoryName) xml += `      <g:google_product_category>${escapeXml(categoryName)}</g:google_product_category>\n`;
        if (product.saleStart && product.saleEnd) {
          xml += `      <g:sale_price_effective_date>${product.saleStart.toISOString()}/${product.saleEnd.toISOString()}</g:sale_price_effective_date>\n`;
        }
        if (Array.isArray(product.customLabels)) {
          (product.customLabels as string[]).forEach((label, idx) => {
            if (idx <= 4 && label) xml += `      <g:custom_label_${idx}>${escapeXml(label)}</g:custom_label_${idx}>\n`;
          });
        }

        xml += `    </item>\n`;
      }
    });

    xml += `
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Facebook Feed Generation Error:", error);
    return new NextResponse(
      `<error><message>${escapeXml(msg)}</message></error>`,
      { status: 500, headers: { "Content-Type": "application/xml" } }
    );
  }
}
