// File: app/actions/admin/product/import-export.ts

"use server";

import { db } from "@/lib/prisma";
import Papa from "papaparse";
import { generateSlug, serializeData } from "./product-utils"; // 🔥 serializeData imported
import { ProductStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

// --- EXPORT FUNCTION ---
export async function exportProductsCSV() {
  try {
    const products = await db.product.findMany({
      include: { category: true, brand: true, variants: true, tags: true },
      orderBy: { id: 'desc' }
    });

    // 🔥 FIX: Serialize data to handle Decimals & Dates before CSV conversion
    const safeProducts = serializeData(products);

    const csvData = safeProducts.map((p: any) => ({
      ID: p.id,
      Type: p.productType.toLowerCase(),
      SKU: p.sku || "",
      Name: p.name,
      Published: p.status === "ACTIVE" ? 1 : 0,
      "Is featured?": p.isFeatured ? 1 : 0,
      "Short description": p.shortDescription || "",
      Description: p.description || "",
      "Regular price": p.price, // Now it's a number
      "Sale price": p.salePrice || "",
      "Cost of goods": p.costPerItem || "", 
      Stock: p.stock,
      "Weight (kg)": p.weight || "",
      "Length (cm)": p.length || "",
      "Width (cm)": p.width || "",
      "Height (cm)": p.height || "",
      "Allow customer reviews?": p.enableReviews ? 1 : 0,
      
      "Is Pre-order?": p.isPreOrder ? 1 : 0,
      "Pre-order Release Date": p.preOrderReleaseDate ? p.preOrderReleaseDate.split('T')[0] : "",
      "Pre-order Limit": p.preOrderLimit || "",
      "Pre-order Message": p.preOrderMessage || "",

      Categories: p.category?.name || "",
      Brands: p.brand?.name || "",
      Tags: p.tags.map((t: any) => t.name).join(", "),
      Images: p.featuredImage || "",
      Parent: ""
    }));

    const csvString = Papa.unparse(csvData);
    return { success: true, csv: csvString };
  } catch (error) {
    console.error("Export Error:", error);
    return { success: false, message: "Export failed" };
  }
}

// --- IMPORT FUNCTION ---
export async function importProductsCSV(csvString: string) {
    try {
        const { data } = Papa.parse(csvString, { header: true, skipEmptyLines: true });
        const skuToIdMap = new Map<string, string>();

        // --- PASS 1: Simple & Parent Products ---
        for (const row of data as any[]) {
            const type = row["Type"]?.toLowerCase() || "simple";
            if (type === "variation") continue; 

            const name = row["Name"];
            if (!name) continue;

            const sku = row["SKU"] || `IMP-${Date.now()}-${Math.floor(Math.random()*1000)}`;
            const slug = generateSlug(name);
            
            const price = parseFloat(row["Regular price"]) || 0;
            const salePrice = row["Sale price"] ? parseFloat(row["Sale price"]) : null;
            const costPerItem = row["Cost of goods"] ? parseFloat(row["Cost of goods"]) : null;
            
            const weight = row["Weight (kg)"] ? parseFloat(row["Weight (kg)"]) : null;
            const length = row["Length (cm)"] ? parseFloat(row["Length (cm)"]) : null;
            const width = row["Width (cm)"] ? parseFloat(row["Width (cm)"]) : null;
            const height = row["Height (cm)"] ? parseFloat(row["Height (cm)"]) : null;

            const enableReviews = row["Allow customer reviews?"] == "1";
            const soldIndividually = row["Sold individually?"] == "1";
            const isFeatured = row["Is featured?"] == "1";
            const status = row["Published"] == "1" ? "ACTIVE" : "DRAFT";

            const isPreOrder = row["Is Pre-order?"] == "1";
            const preOrderReleaseDate = row["Pre-order Release Date"] ? new Date(row["Pre-order Release Date"]) : null;
            const preOrderLimit = row["Pre-order Limit"] ? parseInt(row["Pre-order Limit"]) : null;
            const preOrderMessage = row["Pre-order Message"] || null;

            let categoryConnect = undefined;
            if (row["Categories"]) {
                const catName = row["Categories"].split(",")[0].trim(); 
                if(catName) {
                    categoryConnect = {
                        connectOrCreate: {
                            where: { slug: generateSlug(catName) },
                            create: { name: catName, slug: generateSlug(catName) }
                        }
                    };
                }
            }

            let brandConnect = undefined;
            const brandName = (row["Brands"] || row["Brand"])?.trim();
            if (brandName) {
                brandConnect = {
                    connectOrCreate: {
                        where: { slug: generateSlug(brandName) },
                        create: { name: brandName, slug: generateSlug(brandName) }
                    }
                };
            }

            let tagsConnect = undefined;
            if (row["Tags"]) {
                const tagNames = row["Tags"].split(",").map((t: string) => t.trim()).filter((t: string) => t !== "");
                if (tagNames.length > 0) {
                    tagsConnect = {
                        connectOrCreate: tagNames.map((t: string) => ({
                            where: { slug: generateSlug(t) },
                            create: { name: t, slug: generateSlug(t) }
                        }))
                    };
                }
            }

            const images = row["Images"] ? row["Images"].split(",").map((url: string) => url.trim()) : [];
            const featuredImage = images.length > 0 ? images[0] : null;

            const product = await db.product.create({
                data: {
                    name,
                    slug: `${slug}-${Math.floor(Math.random() * 1000)}`,
                    sku,
                    productType: type === "variable" ? "VARIABLE" : "SIMPLE",
                    status: status as ProductStatus,
                    price,
                    salePrice,
                    costPerItem,
                    description: row["Description"] || "",
                    shortDescription: row["Short description"] || "",
                    stock: parseInt(row["Stock"]) || 0,
                    trackQuantity: row["In stock?"] == "1",
                    weight,
                    length,
                    width,
                    height,
                    enableReviews,
                    soldIndividually,
                    isFeatured,
                    isPreOrder,
                    preOrderReleaseDate,
                    preOrderLimit,
                    preOrderMessage,
                    category: categoryConnect,
                    brand: brandConnect,
                    tags: tagsConnect,
                    featuredImage,
                    images: {
                        create: images.map((url: string, idx: number) => ({
                            url,
                            position: idx
                        }))
                    }
                }
            });

            if (sku) skuToIdMap.set(sku, product.id);
        }

        // --- PASS 2: Variations ---
        for (const row of data as any[]) {
            if (row["Type"]?.toLowerCase() !== "variation") continue;

            const parentSku = row["Parent"];
            const parentId = skuToIdMap.get(parentSku);

            if (!parentId) continue;

            const price = parseFloat(row["Regular price"]) || 0;
            const stock = parseInt(row["Stock"]) || 0;
            const weight = row["Weight (kg)"] ? parseFloat(row["Weight (kg)"]) : null;
            
            const isPreOrder = row["Is Pre-order?"] == "1";
            const preOrderReleaseDate = row["Pre-order Release Date"] ? new Date(row["Pre-order Release Date"]) : null;

            let attributes: any = {};
            Object.keys(row).forEach(key => {
                if (key.startsWith("Attribute") && key.endsWith("name")) {
                    const index = key.match(/\d+/)?.[0]; 
                    if (index) {
                        const attrName = row[`Attribute ${index} name`];
                        const attrValue = row[`Attribute ${index} value(s)`];
                        if (attrName && attrValue) {
                            attributes[attrName] = attrValue;
                        }
                    }
                }
            });

            await db.productVariant.create({
                data: {
                    productId: parentId,
                    name: row["Name"] || "Variation",
                    sku: row["SKU"],
                    price: price,
                    stock: stock,
                    trackQuantity: true,
                    weight: weight,
                    attributes: attributes,
                    isPreOrder,
                    preOrderReleaseDate
                }
            });
        }

        revalidatePath("/admin/products");
        return { success: true, message: `Imported successfully!` };

    } catch (error: any) {
        console.error("Import Error:", error);
        return { success: false, message: error.message || "Import failed" };
    }
}