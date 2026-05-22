// File: app/actions/backend/product/import-export.ts

"use server";

import { db } from "@/lib/prisma";
import Papa from "papaparse";
import { generateSlug, serializeData } from "./product-utils"; 
import { ProductStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

// --- EXPORT FUNCTION ---
export async function exportProductsCSV() {
  try {
    const products = await db.product.findMany({
      include: { category: true, brand: true, variants: true, tags: true },
      orderBy: { id: 'desc' }
    });

    const safeProducts = serializeData(products);

    const csvData = safeProducts.map((p: any) => ({
      ID: p.id,
      Type: p.productType.toLowerCase(),
      SKU: p.sku || "",
      "GTIN, UPC, EAN, or ISBN": p.barcode || "",
      Name: p.name,
      Published: p.status === "ACTIVE" ? 1 : 0,
      "Is featured?": p.isFeatured ? 1 : 0,
      "Visibility in catalog": "visible",
      "Short description": p.shortDescription || "",
      Description: p.description || "",
      "Regular price": p.price || "",
      "Sale price": p.salePrice || "",
      "Cost of goods": p.costPerItem || "", 
      "In stock?": p.trackQuantity ? 1 : 0,
      Stock: p.stock || 0,
      "Backorders allowed?": p.backorderStatus === "ALLOW" ? 1 : 0,
      "Sold individually?": p.soldIndividually ? 1 : 0,
      "Weight (kg)": p.weight || "",
      "Length (cm)": p.length || "",
      "Width (cm)": p.width || "",
      "Height (cm)": p.height || "",
      "Allow customer reviews?": p.enableReviews ? 1 : 0,
      "Purchase note": p.purchaseNote || "",
      Categories: p.category?.name || "",
      Brands: p.brand?.name || "",
      Tags: p.tags?.map((t: any) => t.name).join(", ") || "",
      Images: [p.featuredImage, ...(p.images?.map((img:any) => img.url) || [])].filter(Boolean).join(", "),
      "Meta: rank_math_title": p.metaTitle || "",
      "Meta: rank_math_description": p.metaDesc || "",
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
        let successCount = 0;
        let failCount = 0;

        // --- PASS 1: Simple & Parent Products ---
        for (const row of data as any[]) {
            try {
                const type = row["Type"]?.toLowerCase() || "simple";
                if (type === "variation") continue; 

                const name = row["Name"];
                if (!name) continue;

                // Unique SKU Logic
                const rawSku = row["SKU"]?.trim();
                const sku = rawSku || `IMP-${crypto.randomUUID().substring(0, 8)}`;
                const slug = generateSlug(name);
                
                // Numbers Conversion
                const price = parseFloat(row["Regular price"]) || 0;
                const salePrice = row["Sale price"] ? parseFloat(row["Sale price"]) : null;
                const costPerItem = row["Cost of goods"] ? parseFloat(row["Cost of goods"]) : null;
                const weight = row["Weight (kg)"] ? parseFloat(row["Weight (kg)"]) : null;
                const length = row["Length (cm)"] ? parseFloat(row["Length (cm)"]) : null;
                const width = row["Width (cm)"] ? parseFloat(row["Width (cm)"]) : null;
                const height = row["Height (cm)"] ? parseFloat(row["Height (cm)"]) : null;

                // Booleans & Enums
                const enableReviews = row["Allow customer reviews?"] == "1";
                const soldIndividually = row["Sold individually?"] == "1";
                const isFeatured = row["Is featured?"] == "1";
                const status = row["Published"] == "1" ? "ACTIVE" : "DRAFT";
                const barcode = row["GTIN, UPC, EAN, or ISBN"] || null;
                const purchaseNote = row["Purchase note"] || null;

                // Metafields & SEO Processing
                let metafields: any = {};
                let metaTitle = "";
                let metaDesc = "";

                Object.keys(row).forEach((key) => {
                    if (key.startsWith("Meta:")) {
                        const metaKey = key.replace("Meta: ", "").trim();
                        const metaValue = row[key];
                        
                        if (metaValue) {
                            if (["rank_math_title", "_aioseo_title", "title"].includes(metaKey)) {
                                metaTitle = metaValue;
                            } else if (["rank_math_description", "_aioseo_description", "description"].includes(metaKey)) {
                                metaDesc = metaValue;
                            } else {
                                metafields[metaKey] = metaValue;
                            }
                        }
                    }
                });

                // Arrays processing
                const upsellIds = row["Upsells"] ? row["Upsells"].split(",").map((i:string) => i.trim()) : [];
                const crossSellIds = row["Cross-sells"] ? row["Cross-sells"].split(",").map((i:string) => i.trim()) : [];

                // --- 🚀 HIERARCHICAL CATEGORY LOGIC (Fixing Parent > Child) ---
                let categoryIdToConnect = null;
                if (row["Categories"]) {
                    const categoryPath = row["Categories"].split(",")[0].split(">").map((c: string) => c.trim()).filter(Boolean);
                    
                    let currentParentId = null;

                    for (const catName of categoryPath) {
                        const catSlug = generateSlug(catName);
                        
                        // Check if category exists with this parent
                        let cat: any = await db.category.findFirst({
                            where: { slug: catSlug, parentId: currentParentId }
                        });

                        // Create if not exists
                        if (!cat) {
                            cat = await db.category.create({
                                data: {
                                    name: catName,
                                    slug: catSlug + (currentParentId ? `-${Math.floor(Math.random()*1000)}` : ''), 
                                    parentId: currentParentId
                                }
                            });
                        }
                        
                        currentParentId = cat.id;
                        categoryIdToConnect = cat.id; // Final child ID
                    }
                }

                const categoryConnect = categoryIdToConnect ? {
                    connect: { id: categoryIdToConnect }
                } : undefined;

                // --- 🚀 BRAND LOGIC FIX ---
                let brandConnect = undefined;
                if (row["Brands"] || row["Brand"]) {
                    const brandString = row["Brands"] || row["Brand"];
                    const brandParts = brandString.split(",")[0].split(">");
                    const finalBrandName = brandParts[brandParts.length - 1].trim();

                    if (finalBrandName) {
                        brandConnect = {
                            connectOrCreate: {
                                where: { slug: generateSlug(finalBrandName) },
                                create: { name: finalBrandName, slug: generateSlug(finalBrandName) }
                            }
                        };
                    }
                }

                // Tags processing
                const tagsConnect = row["Tags"] ? {
                    connectOrCreate: row["Tags"].split(",").filter(Boolean).map((t: string) => ({
                        where: { slug: generateSlug(t.trim()) },
                        create: { name: t.trim(), slug: generateSlug(t.trim()) }
                    }))
                } : undefined;

                // Images Processing
                const images = row["Images"] ? row["Images"].split(",").map((url: string) => url.trim()) : [];
                const featuredImage = images.length > 0 ? images[0] : null;

                // Upsert Product
                const product = await db.product.upsert({
                    where: { sku: rawSku ? rawSku : "NO_MATCH_FOR_RANDOM" }, 
                    update: {
                        name, status: status as ProductStatus,
                        price, salePrice, costPerItem,
                        description: row["Description"] || "",
                        shortDescription: row["Short description"] || "",
                        stock: parseInt(row["Stock"]) || 0,
                        trackQuantity: row["In stock?"] == "1",
                        weight, length, width, height,
                        enableReviews, soldIndividually, isFeatured,
                        barcode, purchaseNote,
                        upsellIds, crossSellIds,
                        metafields, metaTitle, metaDesc,
                        category: categoryConnect,
                        brand: brandConnect,
                        tags: tagsConnect,
                        featuredImage,
                    },
                    create: {
                        name,
                        slug: `${slug}-${crypto.randomBytes(3).toString("hex")}`,
                        sku,
                        productType: type === "variable" ? "VARIABLE" : "SIMPLE",
                        status: status as ProductStatus,
                        price, salePrice, costPerItem,
                        description: row["Description"] || "",
                        shortDescription: row["Short description"] || "",
                        stock: parseInt(row["Stock"]) || 0,
                        trackQuantity: row["In stock?"] == "1",
                        weight, length, width, height,
                        enableReviews, soldIndividually, isFeatured,
                        barcode, purchaseNote,
                        upsellIds, crossSellIds,
                        metafields, metaTitle, metaDesc,
                        category: categoryConnect,
                        brand: brandConnect,
                        tags: tagsConnect,
                        featuredImage,
                        images: {
                            create: images.map((url: string, idx: number) => ({ url, position: idx }))
                        }
                    }
                });

                if (product.sku) skuToIdMap.set(product.sku, product.id);
                successCount++;

            } catch (err) {
                console.error(`Row Failed (SKU: ${row["SKU"]}):`, err);
                failCount++;
            }
        }

        // --- PASS 2: Variations ---
        for (const row of data as any[]) {
            try {
                if (row["Type"]?.toLowerCase() !== "variation") continue;

                const parentSku = row["Parent"];
                const parentId = skuToIdMap.get(parentSku);

                if (!parentId) continue; 

                const varSku = row["SKU"] || `VAR-${crypto.randomUUID().substring(0, 8)}`;
                const price = parseFloat(row["Regular price"]) || 0;
                const salePrice = row["Sale price"] ? parseFloat(row["Sale price"]) : null;
                const stock = parseInt(row["Stock"]) || 0;
                const weight = row["Weight (kg)"] ? parseFloat(row["Weight (kg)"]) : null;
                
                let attributes: any = {};
                Object.keys(row).forEach(key => {
                    if (key.startsWith("Attribute") && key.endsWith("name")) {
                        const index = key.match(/\d+/)?.[0]; 
                        if (index) {
                            const attrName = row[`Attribute ${index} name`];
                            const attrValue = row[`Attribute ${index} value(s)`];
                            if (attrName && attrValue) attributes[attrName] = attrValue;
                        }
                    }
                });

                const existingSku = row["SKU"] ? row["SKU"].trim() : null;

                const existingVariant = existingSku ? await db.productVariant.findFirst({
                    where: { sku: existingSku }
                }) : null;

                if (existingVariant) {
                    await db.productVariant.update({
                        where: { id: existingVariant.id },
                        data: { price, salePrice, stock, weight, attributes }
                    });
                } else {
                    await db.productVariant.create({
                        data: {
                            productId: parentId,
                            name: row["Name"] || "Variation",
                            sku: varSku,
                            price, salePrice, stock, weight,
                            trackQuantity: true,
                            attributes: attributes,
                        }
                    });
                }

            } catch (err) {
                console.error(`Variant Row Failed:`, err);
            }
        }

        revalidatePath("/admin/products");
        return { 
            success: true, 
            message: `Import completed! Success: ${successCount}. Failed: ${failCount}.` 
        };

    } catch (error: any) {
        console.error("Critical Import Error:", error);
        return { success: false, message: "Critical error during import." };
    }
}