//File Path: app/actions/backend/marketing/gmc-mapping.actions.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { security } from "@/lib/security";
import { Prisma } from "@prisma/client";

// ============================================================================
// 1. GOOGLE TAXONOMY (CATEGORY) SEARCH ENGINE
// ============================================================================
let cachedTaxonomy: string[] | null = null;

export async function searchGoogleCategories(query: string) {
  try {
    if (!cachedTaxonomy) {
      const res = await fetch("https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt");
      const text = await res.text();
      cachedTaxonomy = text.split("\n").slice(1).filter(Boolean);
    }

    if (!query || query.length < 2) {
      return { success: true, data: cachedTaxonomy.slice(0, 50) };
    }

    const q = query.trim();
    let results: string[];

    if (/^\d+$/.test(q)) {
      // Numeric query → exact ID match at start of line (e.g. "3618" → only that ID)
      results = cachedTaxonomy.filter((line) => {
        const idMatch = line.match(/^(\d+)\s*-/);
        return idMatch?.[1] === q;
      });
      // Fallback: substring search if no exact ID found
      if (results.length === 0) {
        results = cachedTaxonomy.filter((line) => line.toLowerCase().includes(q.toLowerCase()));
      }
    } else {
      // Text query → search in path portion only (after " - "), ignore the ID prefix
      const ql = q.toLowerCase();
      results = cachedTaxonomy.filter((line) => {
        const dashIdx = line.indexOf(" - ");
        const pathPart = dashIdx >= 0 ? line.slice(dashIdx + 3) : line;
        return pathPart.toLowerCase().includes(ql);
      });
    }

    return { success: true, data: results.slice(0, 50) };
  } catch (error: unknown) {
    console.error("Error fetching Google Taxonomy:", error);
    return { success: false, data: [] };
  }
}

// ============================================================================
// 1b. FETCH GOOGLE CATEGORY MAPPINGS FOR GIVEN CATEGORY IDs (used in product form hint)
// ============================================================================
export async function getCategoryGoogleMappings(categoryIds: string[]) {
  try {
    if (!categoryIds || categoryIds.length === 0) return [];
    const cats = await db.category.findMany({
      where: { id: { in: categoryIds }, deletedAt: null },
      select: { id: true, name: true, googleCategoryName: true },
    });
    return cats;
  } catch {
    return [];
  }
}

// ============================================================================
// 2. FETCH ALL STORE DATA (read-only)
// ============================================================================
export async function getStoreMappingData() {
  try {
    const [categories, attributes, config] = await Promise.all([
      db.category.findMany({
        where: { isActive: true, deletedAt: null },
        select: { id: true, name: true, googleCategoryName: true },
        orderBy: { name: "asc" },
      }),
      db.attribute.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true, slug: true, values: true },
        orderBy: { name: "asc" },
      }),
      db.marketingIntegration.findUnique({
        where: { id: "marketing_config" },
        select: { gmcAttributeMapping: true },
      }),
    ]);

    const defaultMapping = {
      attributes: { color: [], size: [], material: [], pattern: [], gender: [], ageGroup: [] },
      customLabels: {
        customLabel0: [], customLabel1: [], customLabel2: [], customLabel3: [], customLabel4: [],
      },
    };

    const savedMapping =
      config?.gmcAttributeMapping
        ? typeof config.gmcAttributeMapping === "string"
          ? JSON.parse(config.gmcAttributeMapping)
          : config.gmcAttributeMapping
        : defaultMapping;

    return { success: true, data: { categories, attributes, savedMapping } };
  } catch (error: unknown) {
    console.error("Error loading store mapping data:", error);
    return { success: false, error: "Failed to load store attributes and categories." };
  }
}

// ============================================================================
// 3. SAVE ADVANCED MAPPING DATA
// ============================================================================
export async function saveGmcMapping(
  categoryMapping: { categoryId: string; googleCategory: string }[],
  attributeMappingPayload: Prisma.InputJsonValue
) {
  try {
  await security.assertAdmin();
    if (categoryMapping && categoryMapping.length > 0) {
      await db.$transaction(
        categoryMapping.map((cat) =>
          db.category.updateMany({
            where: { id: cat.categoryId },
            data: { googleCategoryName: cat.googleCategory.trim() },
          })
        )
      );
    }

    await db.marketingIntegration.upsert({
      where: { id: "marketing_config" },
      update: {
        gmcAttributeMapping: attributeMappingPayload,
        gmcSetupStep: 4,
        gmcContentApiEnabled: true,
      },
      create: {
        id: "marketing_config",
        gmcAttributeMapping: attributeMappingPayload,
        gmcSetupStep: 4,
        gmcContentApiEnabled: true,
      },
    });

    revalidatePath("/admin/marketing/merchant-center");
    return { success: true, message: "Advanced Mapping Configuration Saved Successfully!" };
  } catch (error: unknown) {
    console.error("Save GMC Mapping Error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("Can't reach database") || msg.includes("P1001") || msg.includes("DatabaseNotReachable")) {
      return { success: false, error: "Database is temporarily unavailable. Please wait a moment and try again." };
    }
    return { success: false, error: "Failed to save mapping configuration." };
  }
}
