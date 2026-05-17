//app/actions/admin/inventory/location-actions.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ==========================================
// 1. LOCATION CRUD
// ==========================================
export async function getLocations() {
  try {
    const locations = await db.location.findMany({
      include: { 
        _count: { select: { inventoryLevels: true, stockTransfers: true, stockReceived: true } } 
      },
      orderBy: { createdAt: 'asc' }
    });
    return { success: true, data: locations };
  } catch (error) {
    console.error("GET_LOCATIONS_ERROR:", error);
    return { success: false, data: [] };
  }
}

export async function upsertLocation(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const address = formData.get("address") as string;
    const isDefault = formData.get("isDefault") === "true";
    const isActive = formData.get("isActive") !== "false";

    if (!name) return { success: false, error: "Location name is required" };

    // If setting as default, remove default from others
    if (isDefault) {
      await db.location.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    if (id) {
      await db.location.update({ 
        where: { id }, 
        data: { name, address: address || null, isDefault, isActive } 
      });
    } else {
      // First location created should automatically be default
      const count = await db.location.count();
      await db.location.create({ 
        data: { name, address: address || null, isDefault: isDefault || count === 0, isActive } 
      });
    }

    revalidatePath("/admin/inventory");
    return { success: true, message: id ? "Location updated." : "Location created." };
  } catch (error) {
    console.error("UPSERT_LOCATION_ERROR:", error);
    return { success: false, error: "Failed to save location." };
  }
}

export async function deleteLocation(id: string) {
  try {
    const loc = await db.location.findUnique({ where: { id } });
    if (!loc) return { success: false, error: "Location not found." };
    if (loc.isDefault) return { success: false, error: "Cannot delete the default location." };

    // Check if location has inventory
    const inventoryCount = await db.inventoryLevel.count({ where: { locationId: id } });
    if (inventoryCount > 0) {
      return { success: false, error: `Cannot delete: Location contains ${inventoryCount} inventory records.` };
    }

    await db.location.delete({ where: { id } });
    revalidatePath("/admin/inventory");
    return { success: true, message: "Location deleted successfully." };
  } catch (error) {
    console.error("DELETE_LOCATION_ERROR:", error);
    return { success: false, error: "Failed to delete location." };
  }
}

// ==========================================
// 2. STOCK TRANSFERS (Store to Store)
// ==========================================
export async function getStockTransfers() {
  try {
    const transfers = await db.stockTransfer.findMany({
      include: {
        fromLocation: { select: { name: true } },
        toLocation: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: transfers };
  } catch (error) {
    console.error("GET_TRANSFERS_ERROR:", error);
    return { success: false, data: [] };
  }
}

export async function createStockTransfer(payload: { 
  fromLocationId: string, 
  toLocationId: string, 
  items: any[] 
}) {
  try {
    if (payload.fromLocationId === payload.toLocationId) {
      return { success: false, error: "Cannot transfer to the same location." };
    }

    if (!payload.items || payload.items.length === 0) {
      return { success: false, error: "No items selected for transfer." };
    }

    // Auto-generate Transfer Reference
    const reference = `TRF-${Math.floor(100000 + Math.random() * 900000)}`;

    await db.stockTransfer.create({
      data: {
        reference,
        fromLocationId: payload.fromLocationId,
        toLocationId: payload.toLocationId,
        status: "PENDING", // PENDING, IN_TRANSIT, COMPLETED
        items: payload.items as any
      }
    });

    revalidatePath("/admin/inventory");
    return { success: true, message: "Stock transfer initiated." };
  } catch (error) {
    console.error("CREATE_TRANSFER_ERROR:", error);
    return { success: false, error: "Failed to initiate transfer." };
  }
}