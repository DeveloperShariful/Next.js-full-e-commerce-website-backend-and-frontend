// app/api/feeds/google-local-inventory/route.ts
//
// Google LOCAL PRODUCT INVENTORY feed (single physical store).
// ----------------------------------------------------------------------------
// এটা primary Merchant API product feed-এর replacement নয় — supplement। primary
// feed product-এর মূল তথ্য (title, price, image, gtin…) পাঠায়; এই feed শুধু
// per-store availability/quantity + pickup তথ্য পাঠায়। Google `id` + `store_code`
// মিলিয়ে দুটো জোড়া লাগায়।
//
// ★ `id` অবশ্যই primary feed-এর offerId-এর সাথে হুবহু মিলতে হবে:
//     SIMPLE / BUNDLE → googleOfferIdOverride || product.id
//     VARIABLE        → শুধু variantId (gmc-product-sync.actions.ts-এর
//                       buildVariantOfferId()-এর সাথে এক রাখতে হবে)
//     ✅ FIX: আগে "{base}_v_{variantId}" (দুটো UUID জোড়া = ৭৫ ক্যারেক্টার)
//     ব্যবহার হতো, Google-এর ৫০-ক্যারেক্টার `id` সীমা ছাড়িয়ে primary sync-এ
//     সব variant reject হয়ে যেতো ("Value too long in attribute: id") — যার
//     ফলে local inventory data-ও কখনো match করতো না। item_group_id আলাদা
//     attribute হিসেবে grouping করে, তাই id-তে base প্রেফিক্স লাগে না।
//
// Merchant Center → Data sources → "Add local product inventory feed" →
// Scheduled fetch → এই URL → দিনে ১ বার। Google-এর কাছে store locations
// sync হতে ২৪ ঘণ্টা লাগতে পারে, তাই Business Profile link করার ২৪ ঘণ্টা পর feed
// যোগ করা ভালো।

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

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

// Google local inventory availability — সমর্থিত মান: in_stock, limited_availability,
// on_display_to_order, out_of_stock। preorder এখানে valid নয় (জিনিসটা দোকানে নেই),
// তাই stock-ভিত্তিক in/out ব্যবহার করা হয়।
function localAvailability(stock: number, trackQuantity: boolean): "in_stock" | "out_of_stock" {
  if (trackQuantity === false) return "in_stock";
  return stock > 0 ? "in_stock" : "out_of_stock";
}

function safeQty(n: number): number {
  return Math.max(0, Math.trunc(n ?? 0));
}

// ============================================================================
// GET — ATOM XML LOCAL INVENTORY FEED
// ============================================================================
export async function GET() {
  try {
    const config = await db.marketingIntegration.findUnique({
      where: { id: "marketing_config" },
      select: {
        gmcLocalInventoryEnabled: true,
        gmcStoreCode: true,
        gmcStorePickupMethod: true,
        gmcStorePickupSla: true,
      },
    });

    const storeCode = config?.gmcStoreCode?.trim() || "";
    const active = !!config?.gmcLocalInventoryEnabled && storeCode !== "";
    const pickupMethod = config?.gmcStorePickupMethod?.trim() || "";
    const pickupSla = config?.gmcStorePickupSla?.trim() || "";

    const entries: string[] = [];

    if (active) {
      const products = await db.product.findMany({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          // digital/downloadable বাদ — local inventory শুধু physical goods
          productType: { notIn: ["DOWNLOADABLE", "VIRTUAL", "GIFT_CARD"] },
          // Merchant Center tab-এ "Hide" করা product গুলো বাদ (primary feed-এও নেই)
          NOT: { channelStatuses: { some: { channel: "GOOGLE", status: "EXCLUDED" } } },
        },
        select: {
          id: true,
          googleOfferIdOverride: true,
          productType: true,
          stock: true,
          trackQuantity: true,
          variants: {
            where: { deletedAt: null },
            orderBy: { id: "asc" },
            select: { id: true, stock: true, trackQuantity: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const buildEntry = (id: string, stock: number, trackQuantity: boolean): string => {
        let e = "  <entry>\n";
        e += `    <g:id>${escapeXml(id)}</g:id>\n`;
        e += `    <g:store_code>${escapeXml(storeCode)}</g:store_code>\n`;
        e += `    <g:availability>${localAvailability(stock, trackQuantity)}</g:availability>\n`;
        if (trackQuantity) e += `    <g:quantity>${safeQty(stock)}</g:quantity>\n`;
        if (pickupMethod) e += `    <g:pickup_method>${escapeXml(pickupMethod)}</g:pickup_method>\n`;
        if (pickupSla) e += `    <g:pickup_sla>${escapeXml(pickupSla)}</g:pickup_sla>\n`;
        e += "  </entry>";
        return e;
      };

      for (const p of products) {
        const base = p.googleOfferIdOverride || p.id;
        if (p.productType === "VARIABLE" && p.variants.length > 0) {
          for (const v of p.variants) {
            entries.push(buildEntry(v.id, v.stock, v.trackQuantity));
          }
        } else {
          entries.push(buildEntry(base, p.stock, p.trackQuantity));
        }
      }
    }

    const body = active
      ? entries.join("\n")
      : "  <!-- Local inventory feed নিষ্ক্রিয় বা store code সেট করা নেই।\n" +
        "       Admin → Marketing → Merchant Center → Settings → Local Inventory. -->";

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:g="http://base.google.com/ns/1.0">
  <title>GoBike Local Product Inventory</title>
  <updated>${new Date().toISOString()}</updated>
${body}
</feed>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        // Google দিনে একবার fetch করে। ৬ ঘণ্টার CDN cache DB-কে রক্ষা করে (এই
        // endpoint public + unauthenticated)। fresh copy দরকার হলে ?t=123 জুড়ে
        // দিলে CDN নতুন URL ধরে; নতুন deploy-ও cache clear করে। availability
        // real-time নয় — product save/refresh না হলে Google পুরনো stock দেখে।
        "Cache-Control": "public, max-age=0, s-maxage=21600",
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Google Local Inventory Feed Error:", error);
    return new NextResponse(
      `<error><message>${escapeXml(msg)}</message></error>`,
      { status: 500, headers: { "Content-Type": "application/xml" } }
    );
  }
}
