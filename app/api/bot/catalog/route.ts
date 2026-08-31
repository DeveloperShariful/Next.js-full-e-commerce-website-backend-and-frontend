// GET /api/bot/catalog
//
// Read-only snapshot of the live product catalogue for the Messenger bot's
// knowledge base. Server-to-server only (x-api-key). No caching.

import { db } from "@/lib/prisma";
import {
  assertBotAuth,
  botJson,
  plainText,
  activeSalePrice,
} from "../_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Prefer the canonical public domain — NEXT_PUBLIC_SITE_URL is set to
// localhost in dev, which would give the bot unusable product links.
const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://gobike.au"
).replace(/\/+$/, "");

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: Request) {
  const denied = assertBotAuth(req);
  if (denied) return denied;

  try {
    const [settings, products] = await Promise.all([
      db.storeSettings.findFirst({
        select: { storeName: true, currency: true, currencySymbol: true },
      }),
      db.product.findMany({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          productType: { notIn: ["DOWNLOADABLE", "VIRTUAL", "GIFT_CARD"] },
        },
        select: {
          name: true,
          slug: true,
          shortDescription: true,
          description: true,
          price: true,
          salePrice: true,
          saleStart: true,
          saleEnd: true,
          stock: true,
          trackQuantity: true,
          backorderStatus: true,
          isPreOrder: true,
          preOrderMessage: true,
          rating: true,
          reviewCount: true,
          enableReviews: true,
          brand: { select: { name: true } },
          categories: { select: { name: true } },
          attributes: {
            where: { visible: true },
            orderBy: { position: "asc" },
            select: { name: true, values: true },
          },
          variants: {
            where: { deletedAt: null },
            select: {
              name: true,
              price: true,
              salePrice: true,
              stock: true,
              trackQuantity: true,
            },
          },
        },
        orderBy: { price: "asc" },
        take: 200,
      }),
    ]);

    const catalog = products.map((p) => {
      const backorderAllowed = p.backorderStatus !== "DO_NOT_ALLOW";
      const inStock =
        !p.trackQuantity || p.stock > 0 || backorderAllowed || p.isPreOrder;

      return {
        name: p.name,
        slug: p.slug,
        url: `${SITE_URL}/product/${p.slug}`,
        price: num(p.price),
        salePrice: activeSalePrice(p.salePrice, p.saleStart, p.saleEnd),
        inStock,
        stock: p.trackQuantity ? p.stock : null,
        backorderAllowed,
        isPreOrder: p.isPreOrder,
        preOrderMessage: p.isPreOrder ? p.preOrderMessage || null : null,
        shortDescription:
          plainText(p.shortDescription, 700) || plainText(p.description, 700),
        description: plainText(p.description, 1200) || null,
        rating:
          p.enableReviews && p.reviewCount > 0 ? Number(p.rating) : null,
        reviewCount: p.enableReviews ? p.reviewCount : 0,
        brand: p.brand?.name || null,
        categories: p.categories.map((c) => c.name),
        attributes: p.attributes
          .filter((a) => a.values && a.values.length > 0)
          .map((a) => ({ name: a.name, values: a.values })),
        variants: p.variants.map((v) => {
          const vInStock = !v.trackQuantity || v.stock > 0;
          return {
            name: v.name,
            price: num(v.price),
            salePrice: num(v.salePrice),
            inStock: vInStock,
            stock: v.trackQuantity ? v.stock : null,
          };
        }),
      };
    });

    return botJson({
      storeName: settings?.storeName || "GoBike",
      currency: settings?.currency || "AUD",
      currencySymbol: settings?.currencySymbol || "$",
      productCount: catalog.length,
      generatedAt: new Date().toISOString(),
      products: catalog,
    });
  } catch (err) {
    console.error("[bot/catalog] failed:", err);
    return botJson({ error: "Failed to load catalogue." }, { status: 500 });
  }
}
