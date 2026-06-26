// File Location: app/actions/admin/coupon/coupon-export-import.ts

"use server";

import { db } from "@/lib/prisma";
import Papa from "papaparse";
import { DiscountType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

// ==========================================
// EXPORT COUPONS TO CSV
// ==========================================
export async function exportCouponsCSV() {
  const session = await auth();
  if (!session?.user?.email) return { success: false, error: "Unauthorized." };

  try {
    const coupons = await db.discount.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const csvRows = coupons.map(coupon => ({
        "ID": coupon.id,
        "Code": coupon.code,
        "Type": coupon.type,
        "Amount": coupon.value.toString(),
        "Description": coupon.description || "",
        "Usage Limit": coupon.usageLimit || "",
        "Used Count": coupon.usedCount,
        "Min Spend": coupon.minSpend ? coupon.minSpend.toString() : "",
        "Max Spend": coupon.maxSpend ? coupon.maxSpend.toString() : "",
        "Expiry Date": coupon.endDate ? coupon.endDate.toISOString().split('T')[0] : "",
        "Exclude Sale Items": coupon.excludeSaleItems ? "yes" : "no",
        "Product IDs": coupon.productIds.join(", "),
        "Category IDs": coupon.categoryIds.join(", "),
        "Active": coupon.isActive ? "yes" : "no",
        "Affiliate ID": coupon.affiliateId || ""
    }));

    const csvString = Papa.unparse(csvRows);
    
    return { success: true, csv: csvString };

  } catch (error) {
    console.error("COUPON_EXPORT_ERROR:", error);
    return { success: false, error: "Failed to export coupons." };
  }
}

// ==========================================
// IMPORT COUPONS FROM CSV
// ==========================================
export async function importCouponsCSV(csvString: string) {
    const session = await auth();
    if (!session?.user?.email) return { success: false, error: "Unauthorized." };

    try {
        const { data } = Papa.parse<Record<string, string>>(csvString, { header: true, skipEmptyLines: true });

        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (const row of data) {
            const code = row["Code"]?.toString().trim().toUpperCase();
            if (!code) continue;

            const existing = await db.discount.findUnique({ where: { code } });
            if (existing) {
                skipCount++;
                continue;
            }

            try {
                await db.discount.create({
                    data: {
                        code: code,
                        type: (row["Type"] as DiscountType) || "PERCENTAGE",
                        value: parseFloat(row["Amount"]) || 0,
                        description: row["Description"] || null,
                        usageLimit: row["Usage Limit"] ? parseInt(row["Usage Limit"]) : null,
                        minSpend: row["Min Spend"] ? parseFloat(row["Min Spend"]) : null,
                        maxSpend: row["Max Spend"] ? parseFloat(row["Max Spend"]) : null,
                        endDate: row["Expiry Date"] ? new Date(row["Expiry Date"]) : null,
                        excludeSaleItems: row["Exclude Sale Items"]?.toLowerCase() === "yes",
                        productIds: row["Product IDs"] ? row["Product IDs"].split(",").map((i:string) => i.trim()) : [],
                        categoryIds: row["Category IDs"] ? row["Category IDs"].split(",").map((i:string) => i.trim()) : [],
                        isActive: row["Active"]?.toLowerCase() !== "no", // Default to true unless explicitly 'no'
                    }
                });
                successCount++;
            } catch (err) {
                console.error(`Failed coupon import for code ${code}:`, err);
                errorCount++;
            }
        }

        revalidatePath("/admin/coupons");
        return { success: true, message: `Imported: ${successCount}. Skipped: ${skipCount}. Failed: ${errorCount}` };

    } catch (error: unknown) {
        console.error("CSV Parse Error:", error);
        return { success: false, error: "Critical failure parsing CSV." };
    }
}