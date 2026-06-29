"use server";

import { db } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity-logger";

async function checkAdminAccess(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.email) return null;
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });
  const allowed = ["SUPER_ADMIN", "ADMIN", "MANAGER"] as const;
  if (!user || !(allowed as readonly string[]).includes(user.role)) return null;
  return user.id;
}

function toSlug(value: string) {
  return value.toLowerCase().trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type ImportResult = {
  success: boolean;
  created: number;
  skipped: number;
  errors: string[];
  error?: string;
};

// ==========================================
// IMPORT TAGS
// ==========================================

export async function importTagsCsv(
  rows: { name?: string; slug?: string; color?: string; description?: string; metaTitle?: string; metaDesc?: string }[]
): Promise<ImportResult> {
  const userId = await checkAdminAccess();
  if (!userId) return { success: false, created: 0, skipped: 0, errors: [], error: "Unauthorized." };

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const name = row.name?.trim();
    if (!name) { errors.push(`Row skipped: missing name`); continue; }

    const slug = toSlug(row.slug?.trim() || name);

    const exists = await db.tag.findFirst({ where: { OR: [{ slug }, { name }] }, select: { id: true } });
    if (exists) { skipped++; continue; }

    try {
      await db.tag.create({
        data: {
          name,
          slug,
          color: row.color?.trim() || null,
          description: row.description?.trim() || null,
          metaTitle: row.metaTitle?.trim() || null,
          metaDesc: row.metaDesc?.trim() || null,
        },
      });
      created++;
    } catch (e) {
      errors.push(`Failed to create tag "${name}"`);
    }
  }

  if (created > 0) {
    await logActivity({
      action: "TAG_BULK_IMPORTED",
      entityType: "Tag",
      details: { created, skipped, errors: errors.slice(0, 5) },
    });
    revalidatePath("/admin/tags");
  }

  return { success: true, created, skipped, errors };
}

// ==========================================
// IMPORT BRANDS
// ==========================================

export async function importBrandsCsv(
  rows: { name?: string; slug?: string; website?: string; countryOfOrigin?: string; isFeatured?: string; description?: string; metaTitle?: string; metaDesc?: string }[]
): Promise<ImportResult> {
  const userId = await checkAdminAccess();
  if (!userId) return { success: false, created: 0, skipped: 0, errors: [], error: "Unauthorized." };

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const name = row.name?.trim();
    if (!name) { errors.push(`Row skipped: missing name`); continue; }

    const slug = toSlug(row.slug?.trim() || name);

    const exists = await db.brand.findFirst({ where: { OR: [{ slug }, { name }] }, select: { id: true } });
    if (exists) { skipped++; continue; }

    try {
      await db.brand.create({
        data: {
          name,
          slug,
          website: row.website?.trim() || null,
          countryOfOrigin: row.countryOfOrigin?.trim() || null,
          isFeatured: row.isFeatured?.toLowerCase() === "yes" || row.isFeatured === "true",
          description: row.description?.trim() || null,
          metaTitle: row.metaTitle?.trim() || null,
          metaDesc: row.metaDesc?.trim() || null,
        },
      });
      created++;
    } catch (e) {
      errors.push(`Failed to create brand "${name}"`);
    }
  }

  if (created > 0) {
    await logActivity({
      action: "BRAND_BULK_IMPORTED",
      entityType: "Brand",
      details: { created, skipped, errors: errors.slice(0, 5) },
    });
    revalidatePath("/admin/brands");
  }

  return { success: true, created, skipped, errors };
}

// ==========================================
// IMPORT ATTRIBUTES
// ==========================================

export async function importAttributesCsv(
  rows: { name?: string; slug?: string; type?: string; values?: string }[]
): Promise<ImportResult> {
  const userId = await checkAdminAccess();
  if (!userId) return { success: false, created: 0, skipped: 0, errors: [], error: "Unauthorized." };

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  const validTypes = ["TEXT", "COLOR", "BUTTON"];

  for (const row of rows) {
    const name = row.name?.trim();
    if (!name) { errors.push(`Row skipped: missing name`); continue; }

    const slug = toSlug(row.slug?.trim() || name);
    const type = validTypes.includes(row.type?.toUpperCase() ?? "") ? row.type!.toUpperCase() as "TEXT" | "COLOR" | "BUTTON" : "TEXT";
    const values = row.values ? row.values.split("|").map(v => v.trim()).filter(Boolean) : [];

    const exists = await db.attribute.findFirst({ where: { OR: [{ slug }, { name }] }, select: { id: true } });
    if (exists) { skipped++; continue; }

    try {
      await db.attribute.create({
        data: {
          name,
          slug,
          type,
          values,
        },
      });
      created++;
    } catch (e) {
      errors.push(`Failed to create attribute "${name}"`);
    }
  }

  if (created > 0) {
    await logActivity({
      action: "ATTRIBUTE_BULK_IMPORTED",
      entityType: "Attribute",
      details: { created, skipped, errors: errors.slice(0, 5) },
    });
    revalidatePath("/admin/attributes");
  }

  return { success: true, created, skipped, errors };
}
