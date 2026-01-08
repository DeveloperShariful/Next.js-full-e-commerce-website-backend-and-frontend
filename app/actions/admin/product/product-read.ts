// File: app/actions/admin/product/product-read.ts

"use server";

import { db } from "@/lib/prisma";
import { ProductStatus } from "@prisma/client";

// --- SINGLE PRODUCT READ ---
export async function getProductById(id: string) {
  try {
    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        collections: true, 
        shippingClass: true,
        taxRate: true,
        downloadFiles: true,
        
        // Main Product Images
        images: { 
            where: { variantId: null },
            orderBy: { position: 'asc' } 
        },
        attributes: { orderBy: { position: 'asc' } },
        
        // Variants with Inventory
        variants: {
          include: {
            // 🔥 UPDATE: লোকেশন সহ ইনভেন্টরি
            inventoryLevels: { include: { location: true } },
            images: { orderBy: { position: 'asc' }, select: { url: true } }
          },
          orderBy: { id: 'asc' }
        },
        // 🔥 UPDATE: মেইন প্রোডাক্টের ইনভেন্টরি
        inventoryLevels: { include: { location: true } },
        tags: true,

        // Bundle Items
        bundleItems: {
            include: {
                childProduct: {
                    select: {
                        id: true,
                        name: true,
                        featuredImage: true,
                        images: { take: 1, select: { url: true } }, 
                        sku: true
                    }
                }
            }
        }
      },
    });
    
    if (!product) return { success: false, error: "Product not found" };
    return { success: true, product };
  } catch (error) {
    console.error("GET_PRODUCT_ERROR", error);
    return { success: false, error: "Database error" };
  }
}

// 🔥 NEW: GET CONFIG OPTIONS (GENDER & AGE GROUP)
export async function getConfigOptions() {
    try {
        const attributes = await db.attribute.findMany({
            where: {
                name: { in: ["Gender", "Age Group"] } 
            },
            select: { name: true, values: true }
        });

        const genderAttr = attributes.find(a => a.name === "Gender");
        const ageAttr = attributes.find(a => a.name === "Age Group");

        return {
            success: true,
            data: {
                genders: genderAttr?.values || ["Male", "Female", "Unisex", "Kids"], // Default Fallback
                ageGroups: ageAttr?.values || ["Adult", "Teen", "Kids", "Toddler", "Infant"] // Default Fallback
            }
        };
    } catch (error) {
        return { success: false, data: { genders: [], ageGroups: [] } };
    }
}

// 🔥 NEW: GET ALL LOCATIONS
export async function getLocations() {
    try {
        const locations = await db.location.findMany({
            where: { isActive: true },
            orderBy: { isDefault: 'desc' }, // ডিফল্ট লোকেশন সবার আগে থাকবে
            select: { id: true, name: true, isDefault: true }
        });
        return { success: true, data: locations };
    } catch (error) {
        console.error("GET_LOCATIONS_ERROR", error);
        return { success: false, data: [] };
    }
}

export async function getBrands() {
    try {
        const brands = await db.brand.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true }
        });
        return { success: true, data: brands };
    } catch (error) {
        return { success: false, data: [] };
    }
}

export async function getCategories() {
    try {
        const categories = await db.category.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true }
        });
        return { success: true, data: categories };
    } catch (error) {
        return { success: false, data: [] };
    }
}

export async function getCollections() {
    try {
        const collections = await db.collection.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" },
            select: { id: true, name: true }
        });
        return { success: true, data: collections };
    } catch (error) {
        return { success: false, data: [] };
    }
}

export async function getTaxRates() {
    try {
        const rates = await db.taxRate.findMany({
            where: { isActive: true },
            orderBy: { priority: "asc" },
            select: { id: true, name: true, rate: true }
        });
        return { success: true, data: rates };
    } catch (error) {
        return { success: false, data: [] };
    }
}

export async function getShippingClasses() {
    try {
        const classes = await db.shippingClass.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true }
        });
        return { success: true, data: classes };
    } catch (error) {
        return { success: false, data: [] };
    }
}

export async function getAttributes() {
    try {
        const attributes = await db.attribute.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true, values: true }
        });
        return { success: true, data: attributes };
    } catch (error) {
        return { success: false, data: [] };
    }
}

export async function searchProducts(query: string) {
  if (!query || query.length < 2) return { success: true, data: [] };
  
  try {
    const products = await db.product.findMany({
      where: {
        OR: [
          { name: { search: query.split(" ").join(" & ") } },
          { name: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
        ],
        status: ProductStatus.ACTIVE, 
      },
      take: 20, 
      orderBy: {
        _relevance: { 
          fields: ['name'],
          search: query.split(" ").join(" & "),
          sort: 'desc'
        }
      },
      select: { 
        id: true, 
        name: true, 
        images: { take: 1, select: { url: true }, orderBy: { position: 'asc' } }, 
        featuredImage: true,
        sku: true,
        price: true 
      }
    });
    return { success: true, data: products };
  } catch (error) {
    try {
        const fallbackData = await db.product.findMany({
            where: {
                name: { contains: query, mode: 'insensitive' },
                status: ProductStatus.ACTIVE, 
            },
            take: 10,
            select: { id: true, name: true, featuredImage: true, sku: true, price: true }
        });
        return { success: true, data: fallbackData };
    } catch(e) {
        return { success: false, data: [] };
    }
  }
}

export async function getTaxClasses() {
    try {
        const taxRates = await db.taxRate.findMany({
            select: { id: true, name: true }
        });
        return { success: true, data: taxRates };
    } catch (error) {
        return { success: false, data: [] };
    }
}