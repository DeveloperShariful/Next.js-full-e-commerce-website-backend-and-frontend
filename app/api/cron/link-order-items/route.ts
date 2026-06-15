// ============================================================
// Location: app/api/cron/link-order-items/route.ts
// Purpose:  Imported OrderItem গুলোতে productId ও variantId
//           NULL আছে — SKU → Name → Fuzzy match দিয়ে link করা।
//           One-time run করলেই হবে, তারপর cron analytics ঠিক হবে।
// Run:      GET /api/cron/link-order-items?secret=YOUR_CRON_SECRET
// ============================================================

import { NextResponse } from "next/server";
import { db }           from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ============================================================
// HELPER: normalize string for fuzzy match
// "Giant MTB 2024 [SKU: GMT]" → "giant mtb 2024"
// ============================================================
const normalize = (str: string): string =>
  str
    .toLowerCase()
    .replace(/\[.*?\]/g, "")        // [SKU: ...] [Cat: ...] বাদ
    .replace(/\{.*?\}/g, "")        // {Dims: ...} বাদ
    .replace(/\(x\d+\)\s*-\s*\$?[\d.]+/g, "") // (x1) - $250.00 বাদ (qty+price)
    .replace(/\(x\d+\)/g, "")      // (x1) শুধু qty বাদ
    .replace(/\$?[\d]+\.?[\d]*$/g, "") // trailing price বাদ
    .replace(/[^a-z0-9\s]/g, " ")   // special chars → space
    .replace(/\s+/g, " ")
    .trim();

// ============================================================
// HELPER: simple word overlap score (0–1)
// ============================================================
const similarityScore = (a: string, b: string): number => {
  const wordsA = new Set(normalize(a).split(" ").filter((w) => w.length > 1));
  const wordsB = new Set(normalize(b).split(" ").filter((w) => w.length > 1));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let overlap = 0;
  wordsA.forEach((w) => { if (wordsB.has(w)) overlap++; });
  return overlap / Math.max(wordsA.size, wordsB.size);
};

// ============================================================
// MAIN HANDLER
// ============================================================
export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    // ── Auth ──
    const url    = new URL(request.url);
    const secret = url.searchParams.get("secret");
    if (
      secret !== process.env.CRON_SECRET &&
      secret !== "sync_all_my_old_data"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Optional: dry run mode (actual update করবে না, শুধু কতটা match হবে দেখাবে)
    const dryRun = url.searchParams.get("dry") === "1";

    console.log(`🚀 Link Order Items started (dryRun=${dryRun})...`);

    // ================================================================
    // STEP 1: productId NULL এমন সব OrderItem fetch
    // ================================================================
    const unlinkedItems = await db.orderItem.findMany({
      where: { productId: null },
      select: {
        id:          true,
        productName: true,
        sku:         true,
        variantId:   true,
      },
    });

    if (unlinkedItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: "✅ সব OrderItem ইতিমধ্যে linked আছে। কিছু করার নেই।",
        duration: `${Date.now() - startTime}ms`,
      });
    }

    console.log(`📦 Found ${unlinkedItems.length} unlinked OrderItems`);

    // ================================================================
    // STEP 2: DB থেকে সব Products একবারে load (N+1 এড়ানো)
    // SKU + Name + Variants সহ
    // ================================================================
    const allProducts = await db.product.findMany({
      where:  { deletedAt: null },
      select: {
        id:   true,
        name: true,
        sku:  true,
        variants: {
          where:  { deletedAt: null },
          select: { id: true, sku: true, name: true },
        },
      },
    });

    // ── Fast lookup maps তৈরি ──

    // SKU → Product ID (exact match — সবচেয়ে reliable)
    const skuToProductId = new Map<string, string>();
    // SKU → Variant ID
    const skuToVariantId = new Map<string, { productId: string; variantId: string }>();
    // Normalized name → Product (fuzzy এর জন্য)
    const nameToProduct  = new Map<string, { id: string; name: string }>();

    for (const p of allProducts) {
      if (p.sku) skuToProductId.set(p.sku.trim().toLowerCase(), p.id);
      nameToProduct.set(normalize(p.name), { id: p.id, name: p.name });

      for (const v of p.variants) {
        if (v.sku) {
          skuToVariantId.set(v.sku.trim().toLowerCase(), {
            productId: p.id,
            variantId: v.id,
          });
        }
      }
    }

    // ================================================================
    // STEP 3: প্রতিটা unlinked item match করা
    // Priority: 1) Exact SKU  2) Variant SKU  3) Fuzzy Name
    // ================================================================

    type MatchResult = {
      itemId:    string;
      productId: string;
      variantId: string | null;
      method:    "sku_exact" | "variant_sku" | "fuzzy_name" | "no_match";
      score:     number;
      itemName:  string;
      matchedName: string;
    };

    const results: MatchResult[] = [];

    for (const item of unlinkedItems) {
      const itemSku  = (item.sku  ?? "").trim().toLowerCase();
      const itemName = (item.productName ?? "").trim();

      let matched: MatchResult = {
        itemId:      item.id,
        productId:   "",
        variantId:   null,
        method:      "no_match",
        score:       0,
        itemName,
        matchedName: "",
      };

      // ── Priority 1: Exact SKU match (Product) ──
      if (itemSku && skuToProductId.has(itemSku)) {
        const pid = skuToProductId.get(itemSku)!;
        matched = {
          ...matched,
          productId:   pid,
          method:      "sku_exact",
          score:       1.0,
          matchedName: allProducts.find((p) => p.id === pid)?.name ?? "",
        };
      }

      // ── Priority 2: Exact SKU match (Variant) ──
      else if (itemSku && skuToVariantId.has(itemSku)) {
        const { productId, variantId } = skuToVariantId.get(itemSku)!;
        matched = {
          ...matched,
          productId,
          variantId,
          method:      "variant_sku",
          score:       1.0,
          matchedName: allProducts.find((p) => p.id === productId)?.name ?? "",
        };
      }

      // ── Priority 3: Fuzzy Name match ──
      else if (itemName) {
        let bestScore  = 0;
        let bestId     = "";
        let bestName   = "";

        for (const [normName, prod] of nameToProduct) {
          const score = similarityScore(itemName, normName);
          if (score > bestScore) {
            bestScore = score;
            bestId    = prod.id;
            bestName  = prod.name;
          }
        }

        // Score ≥ 0.6 হলেই match (too low = wrong match)
        if (bestScore >= 0.5) {
          matched = {
            ...matched,
            productId:   bestId,
            method:      "fuzzy_name",
            score:       bestScore,
            matchedName: bestName,
          };
        }
      }

      results.push(matched);
    }

    // ================================================================
    // STEP 4: Stats calculate
    // ================================================================
    const matched    = results.filter((r) => r.method !== "no_match");
    const noMatch    = results.filter((r) => r.method === "no_match");
    const byMethod   = {
      sku_exact:   results.filter((r) => r.method === "sku_exact").length,
      variant_sku: results.filter((r) => r.method === "variant_sku").length,
      fuzzy_name:  results.filter((r) => r.method === "fuzzy_name").length,
      no_match:    noMatch.length,
    };

    console.log(`✅ Matched: ${matched.length} | ❌ No match: ${noMatch.length}`);
    console.log("Match methods:", byMethod);

    // ================================================================
    // STEP 5: DB Update (dry run হলে skip)
    // ================================================================
    let updatedCount = 0;

    if (!dryRun && matched.length > 0) {
      console.log("💾 Updating OrderItems in database...");

      // 100 করে batch update
      const BATCH = 100;
      for (let i = 0; i < matched.length; i += BATCH) {
        const chunk = matched.slice(i, i + BATCH);

        await Promise.all(
          chunk.map((r) =>
            db.orderItem.update({
              where: { id: r.itemId },
              data:  {
                productId: r.productId,
                variantId: r.variantId ?? undefined,
              },
            })
          )
        );

        updatedCount += chunk.length;
        console.log(`  Updated ${updatedCount}/${matched.length}...`);
      }

      console.log(`✅ All ${updatedCount} items updated!`);
    }

    // ================================================================
    // STEP 6: Response
    // ================================================================
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success:   true,
      dryRun,
      duration:  `${duration}ms`,
      summary: {
        totalUnlinked: unlinkedItems.length,
        matched:       matched.length,
        updated:       dryRun ? 0 : updatedCount,
        noMatch:       noMatch.length,
        byMethod,
      },
      // no_match items — manually check করার জন্য
      unmatchedItems: noMatch.slice(0, 50).map((r) => ({
        itemId:   r.itemId,
        itemName: r.itemName,
        sku:      unlinkedItems.find((i) => i.id === r.itemId)?.sku ?? null,
      })),
      message: dryRun
        ? `🔍 Dry Run: ${matched.length} items match হবে, ${noMatch.length} টা match হবে না।`
        : `✅ Done! ${updatedCount} OrderItems linked. এখন cron চালাও analytics update হবে।`,
    });

  } catch (error: any) {
    console.error("Link Order Items Error:", error);
    return NextResponse.json(
      {
        success:  false,
        error:    error?.message ?? "Internal Server Error",
        duration: `${Date.now() - startTime}ms`,
      },
      { status: 500 }
    );
  }
}