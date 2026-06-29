// app/actions/backend/review/import-export.ts
"use server";

import { db } from "@/lib/prisma";
import Papa from "papaparse";
import { ReviewStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

interface WcReviewRow {
  "Review ID": string;
  "Date": string;
  "Status": string;
  "Star Rating": string;
  "Verified Buyer": string;
  "Review Content": string;
  "Is Reply To (Parent ID)": string;
  "Author Name": string;
  "Author Email": string;
  "Registered User ID": string;
  "Product ID": string;
  "Product Name": string;
  "Product SKU": string;
  "Product URL": string;
}

// Extract slug from WC product URL
// e.g. "https://gobikes.au/product/gobike-24-inch-electric-bike/" → "gobike-24-inch-electric-bike"
function extractSlugFromUrl(url: string): string {
  try {
    const clean = url.replace(/\/$/, "");
    return clean.split("/").pop() || "";
  } catch {
    return "";
  }
}

export async function importReviewsFromCSV(csvText: string) {
  try {
    const { data } = Papa.parse<WcReviewRow>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (!data.length) return { success: false, message: "CSV-তে কোনো data নেই" };

    // Only import main reviews, skip replies
    const mainReviews = data.filter(
      (row) => (row["Is Reply To (Parent ID)"] || "").toString().toLowerCase() === "main review"
    );

    if (!mainReviews.length) return { success: false, message: "কোনো main review পাওয়া যায়নি" };

    // ── Duplicate detection ──
    const wcTitles = mainReviews.map((r) => `wc-${r["Review ID"]}`).filter(Boolean);
    const existingReviews = await db.review.findMany({
      where: { title: { in: wcTitles } },
      select: { title: true },
    });
    const existingSet = new Set(existingReviews.map((r) => r.title ?? ""));

    // ── Pre-scan all 4 match fields ──
    const allSkus   = [...new Set(mainReviews.map((r) => (r["Product SKU"] || "").trim()).filter(Boolean))];
    const allSlugs  = [...new Set(mainReviews.map((r) => extractSlugFromUrl(r["Product URL"] || "")).filter(Boolean))];
    const allNames  = [...new Set(mainReviews.map((r) => (r["Product Name"] || "").trim()).filter(Boolean))];
    const allCodes  = [...new Set(mainReviews.map((r) => parseInt(r["Product ID"])).filter((n) => !isNaN(n)))];

    // ── Batch fetch products by all 4 fields at once ──
    const matchedProducts = await db.product.findMany({
      where: {
        deletedAt: null,
        OR: [
          ...(allSkus.length  ? [{ sku:         { in: allSkus  } }] : []),
          ...(allSlugs.length ? [{ slug:        { in: allSlugs } }] : []),
          ...(allNames.length ? [{ name:        { in: allNames } }] : []),
          ...(allCodes.length ? [{ productCode: { in: allCodes } }] : []),
        ],
      },
      select: { id: true, sku: true, slug: true, name: true, productCode: true },
    });

    // ── Build lookup maps (priority: SKU > slug > name > productCode) ──
    const skuMap         = new Map<string, string>(); // sku → productId
    const slugMap        = new Map<string, string>(); // slug → productId
    const nameMap        = new Map<string, string>(); // name → productId
    const productCodeMap = new Map<number, string>(); // productCode → productId

    for (const p of matchedProducts) {
      if (p.sku)         skuMap.set(p.sku, p.id);
      if (p.slug)        slugMap.set(p.slug, p.id);
      if (p.name)        nameMap.set(p.name, p.id);
      if (p.productCode) productCodeMap.set(p.productCode, p.id);
    }

    // ── User lookup by email ──
    const emails = [
      ...new Set(
        mainReviews.map((r) => (r["Author Email"] || "").trim().toLowerCase()).filter(Boolean)
      ),
    ];
    const existingUsers = await db.user.findMany({
      where: { email: { in: emails } },
      select: { id: true, email: true },
    });
    const emailToUserId = new Map(existingUsers.map((u) => [u.email.toLowerCase(), u.id]));

    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;
    const errors: string[] = [];
    const importedProductIds = new Set<string>();

    for (const row of mainReviews) {
      const wcId = `wc-${row["Review ID"]}`;

      // Skip duplicates
      if (existingSet.has(wcId)) {
        skipCount++;
        continue;
      }

      // ── Product match: SKU → slug → name → productCode ──
      const sku      = (row["Product SKU"] || "").trim();
      const slug     = extractSlugFromUrl(row["Product URL"] || "");
      const name     = (row["Product Name"] || "").trim();
      const wcCode   = parseInt(row["Product ID"]);

      const productId =
        (sku  && skuMap.get(sku))          ||
        (slug && slugMap.get(slug))         ||
        (name && nameMap.get(name))         ||
        (!isNaN(wcCode) && productCodeMap.get(wcCode)) ||
        undefined;

      if (!productId) {
        failCount++;
        errors.push(
          `Review ID ${row["Review ID"]}: Product not found` +
          ` (SKU: "${sku}", Slug: "${slug}", Name: "${name}", WC ID: ${wcCode})`
        );
        continue;
      }

      const email      = (row["Author Email"] || "").trim().toLowerCase();
      const authorName = (row["Author Name"] || "Guest").trim();

      // Find or create user by email
      let userId = email ? emailToUserId.get(email) : undefined;
      if (!userId && email) {
        try {
          const newUser = await db.user.create({
            data: { email, name: authorName, role: "CUSTOMER" },
          });
          userId = newUser.id;
          emailToUserId.set(email, userId);
        } catch {
          const found = await db.user.findUnique({ where: { email }, select: { id: true } });
          if (found) {
            userId = found.id;
            emailToUserId.set(email, userId);
          }
        }
      }

      if (!userId) {
        failCount++;
        errors.push(`Review ID ${row["Review ID"]}: User তৈরি করা যায়নি (${email})`);
        continue;
      }

      const statusStr = (row["Status"] || "").toLowerCase();
      const status: ReviewStatus =
        statusStr === "approved" ? "APPROVED"
        : statusStr === "spam"     ? "SPAM"
        : statusStr === "rejected" ? "REJECTED"
        : "PENDING";

      const isVerified = (row["Verified Buyer"] || "").toLowerCase() === "yes";
      const rating     = Math.min(5, Math.max(1, parseInt(row["Star Rating"]) || 5));
      const createdAt  = row["Date"] ? new Date(row["Date"]) : new Date();

      try {
        await db.review.create({
          data: {
            title: wcId,
            content: row["Review Content"] || "",
            rating,
            isVerified,
            status,
            userId,
            productId,
            images: [],
            createdAt,
            updatedAt: createdAt,
          },
        });
        existingSet.add(wcId);
        importedProductIds.add(productId);
        successCount++;
      } catch {
        failCount++;
        errors.push(`Review ID ${row["Review ID"]}: DB error`);
      }
    }

    // ── Update product rating + reviewCount for affected products ──
    for (const productId of importedProductIds) {
      const approvedReviews = await db.review.findMany({
        where: { productId, status: "APPROVED", deletedAt: null },
        select: { rating: true },
      });
      if (approvedReviews.length > 0) {
        const avg = approvedReviews.reduce((s, r) => s + r.rating, 0) / approvedReviews.length;
        await db.product.update({
          where: { id: productId },
          data: {
            rating: parseFloat(avg.toFixed(2)),
            reviewCount: approvedReviews.length,
          },
        });
      }
    }

    revalidatePath("/admin/reviews");

    return {
      success: true,
      message: `Import সম্পন্ন: ${successCount} import হয়েছে, ${skipCount} skip (duplicate), ${failCount} failed`,
      successCount,
      skipCount,
      failCount,
      errors,
    };
  } catch (error) {
    console.error("[importReviewsFromCSV]", error);
    return { success: false, message: "Import failed" };
  }
}

export async function exportReviewsToCSV(): Promise<string> {
  const reviews = await db.review.findMany({
    where: { deletedAt: null },
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { name: true, slug: true, sku: true, productCode: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = reviews.map((r) => ({
    "Review ID": r.title?.startsWith("wc-") ? r.title.replace("wc-", "") : r.id,
    "Date": r.createdAt.toISOString().replace("T", " ").substring(0, 19),
    "Status":
      r.status === "APPROVED" ? "Approved" : r.status === "SPAM" ? "Spam" : r.status === "REJECTED" ? "Rejected" : "Pending",
    "Star Rating": r.rating,
    "Verified Buyer": r.isVerified ? "Yes" : "No",
    "Review Content": r.content || "",
    "Is Reply To (Parent ID)": "Main Review",
    "Author Name": r.user?.name || "",
    "Author Email": r.user?.email || "",
    "Author Website": "",
    "Author IP": "",
    "User Agent (Browser)": "",
    "Registered User ID": 0,
    "Product ID": r.product?.productCode || 0,
    "Product Name": r.product?.name || "",
    "Product SKU": r.product?.sku || "",
    "Product Category": "",
    "Product URL": `https://gobike.au/product/${r.product?.slug || ""}`,
    "Product Image URL": "",
  }));

  return Papa.unparse(rows);
}
