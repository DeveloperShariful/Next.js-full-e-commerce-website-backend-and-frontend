//app/api/feeds/facebook/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gobike.au";

// ============================================================================
// HELPER: SECURE XML ESCAPING
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

// Helper: HTML ট্যাগ রিমুভ করা
function stripHtmlTags(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// Helper: ইউআরএল ফরম্যাট করা
function formatUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://localhost:3000")) {
    return url.replace("http://localhost:3000", "https://gobike.au");
  }
  if (url.startsWith("https://sharifulbuilds.com")) {
    return url.replace("https://sharifulbuilds.com", "https://gobike.au");
  }
  return url;
}

// ============================================================================
// 🚀 GET DYNAMIC FACEBOOK COMMERCE XML PRODUCT FEED (WITH VARIATIONS)
// ============================================================================
export async function GET(request: Request) {
  try {
    // ১. ডাটাবেজ থেকে শুধুমাত্র একটিভ এবং ডিলেট না হওয়া প্রোডাক্টগুলো ফেচ করা
    const products = await db.product.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
      },
      include: {
        brand: true,
        categories: { select: { id: true, name: true, googleCategoryName: true } },
        variants: {
          where: { deletedAt: null },
          include: { images: true }
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
      const formattedId = product.id;
      
      // 🚀 FIX: ভেরিয়েবলটি একদম লুপের শুরুতে ডিক্লেয়ার করা হয়েছে যাতে সবার জন্য অ্যাভেইলেবল থাকে
      const availabilityStatus = (product.trackQuantity === false || product.stock > 0) ? "in stock" : "out of stock";
      
      const finalTitle = product.googleTitle && product.googleTitle.trim() !== "" 
        ? product.googleTitle 
        : product.name;

      const finalDescription = product.googleDescription && product.googleDescription.trim() !== ""
        ? product.googleDescription
        : (product.description || product.shortDescription || product.name);

      const categoryName = product.categories.find(c => c.googleCategoryName)?.googleCategoryName || product.googleProductCategory;
      const brandName = product.brand?.name || "GoBike";

      // মেটাফিল্ডস অবজেক্ট ডিকনস্ট্রাকশন
      let google_size = "";
      let google_size_system = "";
      let google_size_type = "";
      let google_color = "";
      let google_material = "";
      let google_pattern = "";
      let google_multipack = "";
      let google_adult_content = false;
      let google_availability_date = "";

      if (product.metafields && typeof product.metafields === "object" && !Array.isArray(product.metafields)) {
        const meta = product.metafields as Record<string, any>;
        google_size = meta.google_size || "";
        google_size_system = meta.google_size_system || "";
        google_size_type = meta.google_size_type || "";
        google_color = meta.google_color || "";
        google_material = meta.google_material || "";
        google_pattern = meta.google_pattern || "";
        google_adult_content = meta.google_adult_content === true;
        google_availability_date = meta.google_availability_date || "";
        google_multipack = meta.google_multipack || "";
      }

      // ======================================================================
      // 🚀 কন্ডিশন এ: প্রোডাক্টটি যদি ভেরিয়েবল (VARIABLE) হয় (পাবলিক ক্যাটালগ রুলস)
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
          const varColor = varAttrs.Color || varAttrs.color || varAttrs.Colour || varAttrs.colour || google_color;
          const varSize = varAttrs.Size || varAttrs.size || google_size;

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

          if (varColor) {
            xml += `      <g:color>${escapeXml(varColor)}</g:color>\n`;
          }
          if (varSize) {
            xml += `      <g:size>${escapeXml(varSize)}</g:size>\n`;
          }

          if (google_size_system) xml += `      <g:size_system>${escapeXml(google_size_system.toUpperCase())}</g:size_system>\n`;
          if (google_size_type) xml += `      <g:size_type>${escapeXml(google_size_type.toLowerCase())}</g:size_type>\n`;
          if (google_material) xml += `      <g:material>${escapeXml(google_material)}</g:material>\n`;
          if (google_pattern) xml += `      <g:pattern>${escapeXml(google_pattern)}</g:pattern>\n`;
          if (google_adult_content) xml += `      <g:adult>yes</g:adult>\n`;
          if (product.gender) xml += `      <g:gender>${escapeXml(product.gender.toLowerCase())}</g:gender>\n`;
          if (product.ageGroup) xml += `      <g:age_group>${escapeXml(product.ageGroup.toLowerCase())}</g:age_group>\n`;
          if (categoryName) xml += `      <g:google_product_category>${escapeXml(categoryName)}</g:google_product_category>\n`;

          if (product.saleStart && product.saleEnd) {
            xml += `      <g:sale_price_effective_date>${product.saleStart.toISOString()}/${product.saleEnd.toISOString()}</g:sale_price_effective_date>\n`;
          }

          if (product.customLabels && product.customLabels.length > 0) {
            product.customLabels.forEach((label, idx) => {
              if (idx <= 4) {
                xml += `      <g:custom_label_${idx}>${escapeXml(label)}</g:custom_label_${idx}>\n`;
              }
            });
          }

          xml += `    </item>\n`;
        });
      } 
      // ======================================================================
      // 🚀 কন্ডিশন বি: প্রোডাক্টটি যদি সাধারণ (SIMPLE / VIRTUAL / BUNDLE) হয়
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
      <g:availability>${escapeXml(escapeXml(availabilityStatus))}</g:availability>
      <g:quantity>${product.stock}</g:quantity>
      <g:price>${Number(product.price).toFixed(2)} AUD</g:price>
        `;

        if (product.salePrice) {
          xml += `      <g:sale_price>${Number(product.salePrice).toFixed(2)} AUD</g:sale_price>\n`;
        }

        if (product.mpn) {
          xml += `      <g:mpn>${escapeXml(product.mpn)}</g:mpn>\n`;
        }
        if (product.barcode) {
          xml += `      <g:gtin>${escapeXml(product.barcode)}</g:gtin>\n`;
        }

        if (product.gender) {
          xml += `      <g:gender>${escapeXml(product.gender.toLowerCase())}</g:gender>\n`;
        }
        if (product.ageGroup) {
          xml += `      <g:age_group>${escapeXml(product.ageGroup.toLowerCase())}</g:age_group>\n`;
        }

        if (google_size) xml += `      <g:size>${escapeXml(google_size)}</g:size>\n`;
        if (google_size_system) xml += `      <g:size_system>${escapeXml(google_size_system.toUpperCase())}</g:size_system>\n`;
        if (google_size_type) xml += `      <g:size_type>${escapeXml(google_size_type.toLowerCase())}</g:size_type>\n`;
        if (google_color) xml += `      <g:color>${escapeXml(google_color)}</g:color>\n`;
        if (google_material) xml += `      <g:material>${escapeXml(google_material)}</g:material>\n`;
        if (google_pattern) xml += `      <g:pattern>${escapeXml(google_pattern)}</g:pattern>\n`;
        if (google_multipack) xml += `      <g:multipack>${escapeXml(google_multipack)}</g:multipack>\n`;
        if (google_adult_content) xml += `      <g:adult>yes</g:adult>\n`;
        if (google_availability_date) {
          xml += `      <g:availability_date>${new Date(google_availability_date).toISOString()}</g:availability_date>\n`;
        }
        if (categoryName) {
          xml += `      <g:google_product_category>${escapeXml(categoryName)}</g:google_product_category>\n`;
        }

        if (product.saleStart && product.saleEnd) {
          xml += `      <g:sale_price_effective_date>${product.saleStart.toISOString()}/${product.saleEnd.toISOString()}</g:sale_price_effective_date>\n`;
        }

        if (product.customLabels && product.customLabels.length > 0) {
          product.customLabels.forEach((label, idx) => {
            if (idx <= 4) {
              xml += `      <g:custom_label_${idx}>${escapeXml(label)}</g:custom_label_${idx}>\n`;
            }
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

  } catch (error: any) {
    console.error("Facebook Feed Generation Error:", error);
    return new NextResponse(
      `<error><message>${escapeXml(error.message || "Internal Server Error")}</message></error>`,
      { status: 500, headers: { "Content-Type": "application/xml" } }
    );
  }
}