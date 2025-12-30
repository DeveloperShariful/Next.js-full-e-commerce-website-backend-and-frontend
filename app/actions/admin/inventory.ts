// app/actions/inventory.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";

// --- SCHEMAS ---
const SupplierSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const LocationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
});

// --- TYPES ---
export type ActionState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data?: any;
};

// ==========================================
// 1. STOCK MANAGEMENT
// ==========================================

export async function getInventory(query: string = "") {
  try {
    const where = query ? {
      OR: [
        { product: { name: { contains: query, mode: 'insensitive' as const } } },
        { product: { sku: { contains: query, mode: 'insensitive' as const } } },
      ]
    } : {};

    const levels = await db.inventoryLevel.findMany({
      where,
      include: {
        product: { select: { name: true, sku: true, featuredImage: true } },
        variant: { select: { name: true, sku: true, image: true } },
        location: { select: { name: true } }
      },
      orderBy: { quantity: 'asc' },
      take: 50 
    });

    const data = levels.map(l => ({
      id: l.id,
      name: l.product.name,
      variant: l.variant?.name,
      sku: l.variant?.sku || l.product.sku,
      location: l.location.name,
      quantity: l.quantity,
      image: l.variant?.image || l.product.featuredImage
    }));

    return { success: true, data };
  } catch (error) {
    return { success: false, message: "Failed to fetch inventory" };
  }
}

export async function adjustStock(id: string, adjustment: number, reason: string) {
  try {
    // [FIXED] Clerk Authentication
    const { userId } = await auth();

    if (!userId) {
      return { success: false, message: "Unauthorized: User not found" };
    }

    const level = await db.inventoryLevel.findUnique({ where: { id } });
    if (!level) return { success: false, message: "Inventory record not found" };

    const newQty = level.quantity + adjustment;
    if (newQty < 0) return { success: false, message: "Stock cannot be negative" };

    await db.$transaction([
      db.inventoryLevel.update({
        where: { id },
        data: { quantity: newQty }
      }),
      db.activityLog.create({
        data: {
          action: `Stock Adjusted (${adjustment > 0 ? '+' : ''}${adjustment})`,
          entityId: id,
          details: { reason, old: level.quantity, new: newQty },
          userId: userId 
        }
      })
    ]);

    revalidatePath("/admin/inventory");
    return { success: true, message: "Stock updated successfully" };
  } catch (error) {
    console.error("ADJUST_STOCK_ERROR", error);
    return { success: false, message: "Update failed" };
  }
}

// ==========================================
// 2. SUPPLIERS
// ==========================================

export async function getSuppliers() {
  try {
    const data = await db.supplier.findMany({ orderBy: { createdAt: 'desc' } });
    return { success: true, data };
  } catch (error) {
    return { success: false, message: "Failed to load suppliers" };
  }
}

export async function saveSupplier(prevState: any, formData: FormData): Promise<ActionState> {
  const rawData = Object.fromEntries(formData.entries());
  
  const validated = SupplierSchema.safeParse(rawData);

  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  const { id, ...data } = validated.data;

  try {
    if (id) {
      await db.supplier.update({ where: { id }, data });
    } else {
      await db.supplier.create({ data });
    }
    revalidatePath("/admin/inventory");
    return { success: true, message: "Supplier saved successfully" };
  } catch (error) {
    console.error("SAVE_SUPPLIER_ERROR", error);
    return { success: false, message: "Database error" };
  }
}

export async function deleteSupplier(id: string) {
  try {
    await db.supplier.delete({ where: { id } });
    revalidatePath("/admin/inventory");
    return { success: true, message: "Supplier deleted" };
  } catch (error) {
    return { success: false, message: "Failed to delete" };
  }
}

// ==========================================
// 3. LOCATIONS
// ==========================================

export async function getLocations() {
  try {
    const data = await db.location.findMany({
      include: { _count: { select: { inventoryLevels: true } } }
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, message: "Failed to load locations" };
  }
}

export async function saveLocation(prevState: any, formData: FormData): Promise<ActionState> {
  const rawData = Object.fromEntries(formData.entries());
  const validated = LocationSchema.safeParse(rawData);

  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  const { id, ...data } = validated.data;

  try {
    if (id) {
      await db.location.update({ where: { id }, data });
    } else {
      await db.location.create({ data: { ...data, isDefault: false } });
    }
    revalidatePath("/admin/inventory");
    return { success: true, message: "Location saved successfully" };
  } catch (error) {
    return { success: false, message: "Database error" };
  }
}