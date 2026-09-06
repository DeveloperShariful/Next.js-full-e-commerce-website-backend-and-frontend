// app/api/feeds/google-product-reviews/route.ts
//
// Google Merchant Center PRODUCT REVIEWS feed (Product Ratings program).
// ----------------------------------------------------------------------------
// এই feed নিজে থেকে কোনো third-party reviews aggregator (Yotpo/Trustpilot ইত্যাদি)
// ব্যবহার করে না — GoBike-এর নিজের review system থেকে সরাসরি Google-কে data
// পাঠায় (Merchant Center-এর "Product Ratings Interest Form"-এ "No" বেছে নেওয়ার
// পরের ধাপ)। শুধু status: APPROVED review (মানুষ moderate করে approve করেছে)
// পাঠানো হয় — কখনো auto-approve হয় না (app/actions/backend/review/actions.ts
// দেখুন)।
//
// ★ is_verified_purchase/collection_method প্রতিটা review-এর real Review.isVerified
//   মান অনুযায়ী পাঠানো হয় — এই field একটা আসল DELIVERED/COMPLETED Order-এর সাথে
//   email+productId মিলিয়েই সেট হয় (lib/verified-purchase.ts, submitReviewAction.ts-এ
//   নতুন review submit হওয়ার সময় ব্যবহার হয়) — কখনো অনুমান করে/target percentage
//   ধরে সেট করা হয় না। true হলে is_verified_purchase + collection_method=post_fulfillment,
//   নাহলে unsolicited।
// ★ review_url এর type="group" — কারণ আমাদের প্রতিটা review-এর নিজস্ব আলাদা পেজ
//   নেই, সবগুলো একই product page-এর #reviews সেকশনে একসাথে দেখা যায়।
// ★ product identifier logic গুলো (gtin=barcode, mpn, brand fallback "GoBike")
//   ঠিক gmc-product-sync.actions.ts / facebook/route.ts-এর সাথে এক রাখা হয়েছে,
//   যাতে একই product-এর জন্য সব জায়গায় সামঞ্জস্যপূর্ণ identifier যায়।
//
// Merchant Center → Data sources → "Add product reviews data source" →
// Scheduled fetch → এই URL → recurring "Monthly" (বা বেশি ঘনঘন)।
//
// Schema reference: https://developers.google.com/product-review-feeds/schema

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://gobike.au").replace(/\/+$/, "");
const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;

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

// ============================================================================
// GET — PRODUCT REVIEWS XML FEED
// ============================================================================
export async function GET() {
  try {
    const reviews = await db.review.findMany({
      where: {
        status: "APPROVED",
        deletedAt: null,
        product: { status: "ACTIVE", deletedAt: null },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        rating: true,
        content: true,
        images: true,
        createdAt: true,
        isVerified: true,
        user: { select: { name: true } },
        product: {
          select: {
            slug: true,
            barcode: true,
            mpn: true,
            brand: { select: { name: true } },
          },
        },
      },
    });

    // content ছাড়া review Google-এর required <content> ট্যাগ পূরণ করতে পারবে
    // না, তাই feed-এ পাঠানোর যোগ্য না
    const validReviews = reviews.filter((r) => r.content && r.content.trim());

    const entries = validReviews.map((r) => {
      const productUrl = `${SITE_URL}/product/${r.product.slug}`;
      const reviewUrl = `${productUrl}#reviews`;
      const reviewerName = escapeXml(r.user?.name?.trim() || "Customer");
      const gtin = r.product.barcode?.trim();
      const mpn = r.product.mpn?.trim();
      const brand = r.product.brand?.name?.trim() || "GoBike";
      const reviewerImages = (r.images || []).filter((url) => IMAGE_EXT.test(url));

      let e = "    <review>\n";
      e += `      <review_id>${escapeXml(r.id)}</review_id>\n`;
      e += `      <reviewer>\n        <name>${reviewerName}</name>\n      </reviewer>\n`;
      // isVerified সত্যিই একটা DELIVERED/COMPLETED Order-এর সাথে মেলার পরই true হয়
      // (lib/verified-purchase.ts) — তাই এখানে honestly claim করা যায়
      if (r.isVerified) e += `      <is_verified_purchase>true</is_verified_purchase>\n`;
      e += `      <is_incentivized_review>false</is_incentivized_review>\n`;
      e += `      <review_timestamp>${r.createdAt.toISOString()}</review_timestamp>\n`;
      // <title> ইচ্ছাকৃতভাবে বাদ — এই সিস্টেমে review.title আসলে কোনো headline না,
      // পুরনো WooCommerce import-এর internal "wc-XXXX" duplicate-marker (দেখুন
      // app/actions/backend/review/import-export.ts), Google-কে সেটা পাঠানো ভুল হতো
      e += `      <content>${escapeXml(r.content!.trim())}</content>\n`;
      e += `      <review_url type="group">${escapeXml(reviewUrl)}</review_url>\n`;
      if (reviewerImages.length > 0) {
        e += "      <reviewer_images>\n";
        for (const img of reviewerImages) {
          e += `        <reviewer_image>\n          <url>${escapeXml(img)}</url>\n        </reviewer_image>\n`;
        }
        e += "      </reviewer_images>\n";
      }
      e += `      <ratings>\n        <overall min="1" max="5">${r.rating}</overall>\n      </ratings>\n`;
      e += "      <products>\n        <product>\n";
      if (gtin || mpn) {
        e += "          <product_ids>\n";
        if (gtin) e += `            <gtins>\n              <gtin>${escapeXml(gtin)}</gtin>\n            </gtins>\n`;
        if (mpn) {
          e += `            <mpns>\n              <mpn>${escapeXml(mpn)}</mpn>\n            </mpns>\n`;
          e += `            <brands>\n              <brand>${escapeXml(brand)}</brand>\n            </brands>\n`;
        }
        e += "          </product_ids>\n";
      }
      e += `          <product_url>${escapeXml(productUrl)}</product_url>\n`;
      e += "        </product>\n      </products>\n";
      e += `      <collection_method>${r.isVerified ? "post_fulfillment" : "unsolicited"}</collection_method>\n`;
      e += "    </review>";
      return e;
    });

    const body =
      entries.length > 0
        ? entries.join("\n")
        : "    <!-- এখনো কোনো Approved review নেই — Admin → Reviews থেকে review approve করলে এখানে দেখা যাবে। -->";

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:vc="http://www.w3.org/2007/XMLSchema-versioning"
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
 xsi:noNamespaceSchemaLocation="http://www.google.com/shopping/reviews/schema/product/2.4/product_reviews.xsd">
  <version>2.4</version>
  <publisher>
    <name>GoBike Australia</name>
  </publisher>
  <reviews>
${body}
  </reviews>
</feed>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        // Google মাসে অন্তত একবার fetch করলেই চলে, কিন্তু আমরা মোটামুটি fresh
        // রাখছি। ৬ ঘণ্টার CDN cache DB-কে রক্ষা করে (public + unauthenticated
        // endpoint)।
        "Cache-Control": "public, max-age=0, s-maxage=21600",
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Google Product Reviews Feed Error:", error);
    return new NextResponse(
      `<error><message>${escapeXml(msg)}</message></error>`,
      { status: 500, headers: { "Content-Type": "application/xml" } }
    );
  }
}
