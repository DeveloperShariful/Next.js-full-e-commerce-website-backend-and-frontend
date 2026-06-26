"use server";

import { db } from "@/lib/prisma";
import { auth } from "@/auth";

async function checkAdminAccess(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.email) return false;
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });
  const allowed = ["SUPER_ADMIN", "ADMIN", "MANAGER"] as const;
  return !!user && (allowed as readonly string[]).includes(user.role);
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [
    headers.join(","),
    ...rows.map(row => headers.map(h => escape(row[h])).join(",")),
  ];
  return lines.join("\n");
}

// ==========================================
// EXPORT TAGS
// ==========================================

export async function exportTagsCsv(): Promise<{ success: boolean; csv?: string; error?: string }> {
  if (!(await checkAdminAccess())) return { success: false, error: "Unauthorized." };

  try {
    const tags = await db.tag.findMany({
      where: { deletedAt: null },
      select: { name: true, slug: true, color: true, description: true, metaTitle: true, metaDesc: true, createdAt: true },
      orderBy: { name: "asc" },
    });

    const rows = tags.map(t => ({
      name: t.name,
      slug: t.slug,
      color: t.color ?? "",
      description: t.description ?? "",
      metaTitle: t.metaTitle ?? "",
      metaDesc: t.metaDesc ?? "",
      createdAt: t.createdAt.toISOString(),
    }));

    return { success: true, csv: toCsv(rows) };
  } catch (error) {
    console.error("EXPORT_TAGS_CSV_ERROR", error);
    return { success: false, error: "Failed to export tags." };
  }
}

// ==========================================
// EXPORT BRANDS
// ==========================================

export async function exportBrandsCsv(): Promise<{ success: boolean; csv?: string; error?: string }> {
  if (!(await checkAdminAccess())) return { success: false, error: "Unauthorized." };

  try {
    const brands = await db.brand.findMany({
      where: { deletedAt: null },
      select: { name: true, slug: true, website: true, countryOfOrigin: true, isFeatured: true, description: true, metaTitle: true, metaDesc: true, createdAt: true },
      orderBy: { name: "asc" },
    });

    const rows = brands.map(b => ({
      name: b.name,
      slug: b.slug,
      website: b.website ?? "",
      countryOfOrigin: b.countryOfOrigin ?? "",
      isFeatured: b.isFeatured ? "yes" : "no",
      description: b.description ?? "",
      metaTitle: b.metaTitle ?? "",
      metaDesc: b.metaDesc ?? "",
      createdAt: b.createdAt.toISOString(),
    }));

    return { success: true, csv: toCsv(rows) };
  } catch (error) {
    console.error("EXPORT_BRANDS_CSV_ERROR", error);
    return { success: false, error: "Failed to export brands." };
  }
}

// ==========================================
// EXPORT ATTRIBUTES
// ==========================================

export async function exportAttributesCsv(): Promise<{ success: boolean; csv?: string; error?: string }> {
  if (!(await checkAdminAccess())) return { success: false, error: "Unauthorized." };

  try {
    const attributes = await db.attribute.findMany({
      where: { deletedAt: null },
      select: { name: true, slug: true, type: true, values: true, createdAt: true },
      orderBy: { name: "asc" },
    });

    const rows = attributes.map(a => ({
      name: a.name,
      slug: a.slug,
      type: a.type,
      values: (a.values as string[]).join(" | "),
      createdAt: a.createdAt.toISOString(),
    }));

    return { success: true, csv: toCsv(rows) };
  } catch (error) {
    console.error("EXPORT_ATTRIBUTES_CSV_ERROR", error);
    return { success: false, error: "Failed to export attributes." };
  }
}
