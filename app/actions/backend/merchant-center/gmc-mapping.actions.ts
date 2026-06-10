//File Path: app/actions/backend/merchant-center/gmc-mapping.actions.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ============================================================================
// 1. GOOGLE TAXONOMY (CATEGORY) SEARCH ENGINE
// ============================================================================
let cachedTaxonomy: string[] | null = null;

export async function searchGoogleCategories(query: string) {
  try {
    if (!cachedTaxonomy) {
      const res = await fetch("https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt");
      const text = await res.text();
      cachedTaxonomy = text.split('\n').slice(1).filter(Boolean);
    }

    if (!query || query.length < 2) {
      return { success: true, data: cachedTaxonomy.slice(0, 50) }; 
    }

    const q = query.toLowerCase();
    const results = cachedTaxonomy
      .filter((line) => line.toLowerCase().includes(q))
      .slice(0, 50); 

    return { success: true, data: results };
  } catch (error) {
    console.error("Error fetching Google Taxonomy:", error);
    return { success: false, data: [] };
  }
}

// ============================================================================
// 2. FETCH ALL STORE DATA (WITH VALUE PREVIEW)
// ============================================================================
export async function getStoreMappingData() {
  try {
    const categories = await db.category.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, name: true, googleCategoryName: true },
      orderBy: { name: "asc" },
    });

    const attributes = await db.attribute.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, slug: true, values: true }, 
      orderBy: { name: "asc" },
    });

    const config = await db.marketingIntegration.findUnique({
      where: { id: "marketing_config" },
      select: { gmcAttributeMapping: true },
    });

    const defaultMapping = {
      attributes: {
        color: [], size: [], material: [], pattern: [], 
        gender: [], ageGroup: []
      },
      customLabels: {
        customLabel0: [], customLabel1: [], customLabel2: [], customLabel3: [], customLabel4: []
      }
    };

    const savedMapping = config?.gmcAttributeMapping 
      ? (typeof config.gmcAttributeMapping === "string" ? JSON.parse(config.gmcAttributeMapping) : config.gmcAttributeMapping)
      : defaultMapping;

    return {
      success: true,
      data: { categories, attributes, savedMapping }
    };
  } catch (error: any) {
    return { success: false, error: "Failed to load store attributes and categories." };
  }
}

// ============================================================================
// 3. SAVE ADVANCED MAPPING DATA (🚀 FIXED: BULLETPROOF UPDATE & UPSERT)
// ============================================================================
export async function saveGmcMapping(
  categoryMapping: { categoryId: string; googleCategory: string }[],
  attributeMappingPayload: any
) {
  try {
    // 🚀 FIX 1: update এর জায়গায় updateMany ব্যবহার করা হয়েছে যাতে ডিলিট হওয়া আইডির কারণে ক্র্যাশ না করে
    if (categoryMapping && categoryMapping.length > 0) {
      await db.$transaction(
        categoryMapping.map((cat) => 
          db.category.updateMany({
            where: { id: cat.categoryId },
            data: { googleCategoryName: cat.googleCategory.trim() }
          })
        )
      );
    }

    // 🚀 FIX 2: update এর জায়গায় upsert ব্যবহার করা হয়েছে যাতে রো-টি না থাকলে অটো তৈরি হয়
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
      }
    });

    revalidatePath("/admin/marketing/merchant-center");
    return { success: true, message: "Advanced Mapping Configuration Saved Successfully!" };
  } catch (error: any) {
    console.error("Save GMC Mapping Error:", error);
    return { success: false, error: "Failed to save mapping configuration." };
  }
}