// app/actions/inventory.ts

"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// --- TYPES (FIXED) ---
export type InventoryItem = {
  id: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  locationName: string;
  quantity: number;
  image: string | null;
};

// ✅ FIX: Made fields optional/nullable to match DB response
export type SupplierData = {
  id: string;
  name: string;
  contactName?: string | null; // Optional
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  website?: string | null; // Added website as it appeared in error log
  createdAt?: Date;
};

// ==========================================
// 1. GET INVENTORY
// ==========================================
export async function getInventory(query?: string) {
  try {
    const whereCondition: any = query ? {
      OR: [
        { product: { name: { contains: query, mode: 'insensitive' } } },
        { product: { sku: { contains: query, mode: 'insensitive' } } },
        { location: { name: { contains: query, mode: 'insensitive' } } }
      ]
    } : {};

    const levels = await db.inventoryLevel.findMany({
      where: whereCondition,
      include: {
        product: { select: { name: true, sku: true, featuredImage: true, images: true } },
        variant: { select: { name: true, sku: true, image: true } },
        location: { select: { name: true } }
      },
      orderBy: { product: { name: 'asc' } }
    });

    const data: InventoryItem[] = levels.map(level => ({
      id: level.id,
      productName: level.product.name,
      variantName: level.variant?.name || null,
      sku: level.variant?.sku || level.product.sku,
      locationName: level.location.name,
      quantity: level.quantity,
      image: level.variant?.image || level.product.featuredImage || level.product.images[0]?.url || null
    }));

    return { success: true, data };
  } catch (error) {
    return { success: false, data: [] };
  }
}

// ==========================================
// 2. ADJUST STOCK
// ==========================================
export async function adjustStock(inventoryId: string, adjustment: number, reason: string) {
  try {
    const level = await db.inventoryLevel.findUnique({
      where: { id: inventoryId }
    });

    if (!level) return { success: false, error: "Record not found" };

    const newQuantity = level.quantity + adjustment;
    if (newQuantity < 0) return { success: false, error: "Stock cannot be negative" };

    await db.$transaction([
      db.inventoryLevel.update({
        where: { id: inventoryId },
        data: { quantity: newQuantity }
      }),
      db.activityLog.create({
        data: {
          action: `Stock Adjusted: ${adjustment > 0 ? '+' : ''}${adjustment}`,
          entityId: inventoryId,
          details: { reason, previous: level.quantity, new: newQuantity },
          userId: "ADMIN"
        }
      })
    ]);

    revalidatePath("/admin/inventory");
    return { success: true, message: "Stock updated successfully" };

  } catch (error) {
    return { success: false, error: "Failed to adjust stock" };
  }
}

// ==========================================
// 3. SUPPLIER MANAGEMENT
// ==========================================
export async function getSuppliers() {
  try {
    const suppliers = await db.supplier.findMany({ orderBy: { createdAt: 'desc' } });
    return { success: true, data: suppliers };
  } catch (error) {
    return { success: false, data: [] };
  }
}

export async function saveSupplier(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const contactName = formData.get("contactName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;

    if (!name) return { success: false, error: "Supplier name is required" };

    const data = { name, contactName, email, phone, address };

    if (id) {
      await db.supplier.update({ where: { id }, data });
    } else {
      await db.supplier.create({ data });
    }

    revalidatePath("/admin/inventory");
    return { success: true, message: "Supplier saved successfully" };
  } catch (error) {
    return { success: false, error: "Operation failed" };
  }
}

export async function deleteSupplier(id: string) {
  try {
    await db.supplier.delete({ where: { id } });
    revalidatePath("/admin/inventory");
    return { success: true, message: "Supplier deleted" };
  } catch (error) {
    return { success: false, error: "Failed to delete" };
  }
}

// ==========================================
// 4. LOCATIONS
// ==========================================
export async function getLocations() {
  try {
    const locations = await db.location.findMany({ 
      include: { _count: { select: { inventoryLevels: true } } } 
    });
    return { success: true, data: locations };
  } catch (error) {
    return { success: false, data: [] };
  }
}

export async function saveLocation(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const address = formData.get("address") as string;
    
    if(!name) return { success: false, error: "Name required" };

    if(id) {
        await db.location.update({ where: { id }, data: { name, address } });
    } else {
        await db.location.create({ data: { name, address, isDefault: false } });
    }
    revalidatePath("/admin/inventory");
    return { success: true, message: "Location saved" };
  } catch(error) {
    return { success: false, error: "Failed" };
  }
}