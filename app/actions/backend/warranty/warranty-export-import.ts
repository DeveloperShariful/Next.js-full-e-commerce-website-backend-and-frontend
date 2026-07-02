"use server";

import { db } from "@/lib/prisma";
import Papa from "papaparse";
import { ClaimStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

// ==========================================
// EXPORT WARRANTY CLAIMS TO CSV
// ==========================================
export async function exportWarrantyClaimsCSV() {
  const session = await auth();
  if (!session?.user?.email) return { success: false, error: "Unauthorized." };

  try {
    const claims = await db.warrantyClaim.findMany({
      orderBy: { createdAt: "desc" },
    });

    const csvRows = claims.map((claim) => ({
      "ID": claim.id,
      "Name": claim.name,
      "Email": claim.email,
      "Phone": claim.phone || "",
      "Order Number": claim.orderNumber,
      "Order Date": claim.orderDate ? claim.orderDate.toISOString().split("T")[0] : "",
      "Shop Purchased": claim.shopPurchased,
      "Description": claim.description,
      "Status": claim.status,
      "Replacement Part": claim.replacementPart || "",
      "Tracking Number": claim.trackingNumber || "",
      "Address": claim.address || "",
      "Suburb": claim.suburb || "",
      "State": claim.state || "",
      "Postcode": claim.postcode || "",
      "Country": claim.country || "AU",
      "Media URL": claim.mediaUrl || "",
      "Created At": claim.createdAt.toISOString().split("T")[0],
    }));

    const csvString = Papa.unparse(csvRows);
    return { success: true, csv: csvString };
  } catch (error) {
    console.error("WARRANTY_EXPORT_ERROR:", error);
    return { success: false, error: "Failed to export warranty claims." };
  }
}

// ==========================================
// IMPORT WARRANTY CLAIMS FROM CSV
// ==========================================
export async function importWarrantyClaimsCSV(csvString: string) {
  const session = await auth();
  if (!session?.user?.email) return { success: false, error: "Unauthorized." };

  try {
    const { data } = Papa.parse<Record<string, string>>(csvString, {
      header: true,
      skipEmptyLines: true,
    });

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    const validStatuses: ClaimStatus[] = ["PENDING", "APPROVED", "REJECTED", "TRASHED"];

    for (const row of data) {
      const id = row["ID"]?.trim();
      if (!id) continue;

      const existing = await db.warrantyClaim.findUnique({ where: { id } });
      if (existing) {
        skipCount++;
        continue;
      }

      try {
        const rawStatus = row["Status"]?.trim().toUpperCase();
        const status: ClaimStatus = validStatuses.includes(rawStatus as ClaimStatus)
          ? (rawStatus as ClaimStatus)
          : "PENDING";

        await db.warrantyClaim.create({
          data: {
            id,
            name: row["Name"] || "Unknown",
            email: row["Email"] || "",
            phone: row["Phone"] || null,
            orderNumber: row["Order Number"] || "",
            orderDate: row["Order Date"] ? new Date(row["Order Date"]) : null,
            shopPurchased: row["Shop Purchased"] || "",
            description: row["Description"] || "",
            status,
            replacementPart: row["Replacement Part"] || null,
            trackingNumber: row["Tracking Number"] || null,
            address: row["Address"] || null,
            suburb: row["Suburb"] || null,
            state: row["State"] || null,
            postcode: row["Postcode"] || null,
            country: row["Country"] || "AU",
            mediaUrl: row["Media URL"] || null,
          },
        });
        successCount++;
      } catch (err) {
        console.error(`Failed warranty claim import for id ${id}:`, err);
        errorCount++;
      }
    }

    revalidatePath("/admin/warranty-claims");
    return {
      success: true,
      message: `Imported: ${successCount}. Skipped: ${skipCount}. Failed: ${errorCount}`,
    };
  } catch (error: unknown) {
    console.error("WARRANTY_CSV_PARSE_ERROR:", error);
    return { success: false, error: "Critical failure parsing CSV." };
  }
}
