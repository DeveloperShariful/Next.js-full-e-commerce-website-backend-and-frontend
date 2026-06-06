//File Path: app/actions/backend/merchant-center/gmc-mapping.actions.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ============================================================================
// 1. GOOGLE TAXONOMY (CATEGORY) SEARCH ENGINE
// ============================================================================
// মেমোরি ক্যাশ (যাতে বারবার গুগলের সার্ভার থেকে ডাউনলোড করতে না হয়)
let cachedTaxonomy: string[] | null = null;

export async function searchGoogleCategories(query: string) {
  try {
    // যদি ক্যাশ খালি থাকে, তবে গুগলের অফিসিয়াল সার্ভার থেকে 5500+ ক্যাটাগরি ডাউনলোড করবে
    if (!cachedTaxonomy) {
      const res = await fetch("https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt");
      const text = await res.text();
      // প্রথম লাইনটি (হেডার) বাদ দিয়ে সব ক্যাটাগরি array তে নেওয়া হলো
      cachedTaxonomy = text.split('\n').slice(1).filter(Boolean);
    }

    if (!query || query.length < 2) {
      return { success: true, data: cachedTaxonomy.slice(0, 50) }; // ডিফল্ট প্রথম ৫০টি দেখাবে
    }

    // সার্চ কুয়েরি অনুযায়ী ফিল্টার করা (Case Insensitive)
    const q = query.toLowerCase();
    const results = cachedTaxonomy
      .filter((line) => line.toLowerCase().includes(q))
      .slice(0, 50); // স্পিড ঠিক রাখার জন্য সর্বোচ্চ ৫০টি রেজাল্ট দিবে

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

    // 🔥 FIX: values সহ ডাটা আনা হলো, যাতে UI-তে প্রিভিউ দেখানো যায়!
    const attributes = await db.attribute.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, slug: true, values: true }, 
      orderBy: { name: "asc" },
    });

    const config = await db.marketingIntegration.findUnique({
      where: { id: "marketing_config" },
      select: { gmcAttributeMapping: true },
    });

    // Default Multi-Select Mapping Structure
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
// 3. SAVE ADVANCED MAPPING DATA
// ============================================================================
export async function saveGmcMapping(
  categoryMapping: { categoryId: string; googleCategory: string }[],
  attributeMappingPayload: any
) {
  try {
    if (categoryMapping && categoryMapping.length > 0) {
      await db.$transaction(
        categoryMapping.map((cat) => 
          db.category.update({
            where: { id: cat.categoryId },
            data: { googleCategoryName: cat.googleCategory.trim() }
          })
        )
      );
    }

    await db.marketingIntegration.update({
      where: { id: "marketing_config" },
      data: {
        gmcAttributeMapping: attributeMappingPayload,
        gmcSetupStep: 4, 
        gmcContentApiEnabled: true, 
      },
    });

    revalidatePath("/admin/marketing/merchant-center");
    return { success: true, message: "Advanced Mapping Configuration Saved Successfully!" };
  } catch (error: any) {
    return { success: false, error: "Failed to save mapping configuration." };
  }
}