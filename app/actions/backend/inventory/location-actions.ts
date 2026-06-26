// File: app/actions/backend/inventory/location-actions.ts
"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";
import { z } from "zod";

// ==========================================
// TYPES
// ==========================================

export type LocationWithCounts = Prisma.LocationGetPayload<{
  include: {
    _count: {
      select: {
        inventoryLevels: true;
        stockTransfers: true;
        stockReceived: true;
      };
    };
  };
}>;

export type StockTransferWithLocations = Prisma.StockTransferGetPayload<{
  include: {
    fromLocation: { select: { name: true } };
    toLocation: { select: { name: true } };
  };
}>;

type TransferItem = {
  productId: string;
  variantId?: string | null;
  quantity: number;
  name?: string;
  sku?: string;
};

// ==========================================
// ZOD SCHEMAS
// ==========================================

const locationSchema = z.object({
  name: z.string().min(1, "Location name is required"),
  address: z.string().optional().nullable(),
  isDefault: z.coerce.boolean().default(false),
  isActive: z.coerce.boolean().default(true),
});

const transferItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional().nullable(),
  quantity: z.number().int().positive("Quantity must be positive"),
  name: z.string().optional(),
  sku: z.string().optional(),
});

const stockTransferSchema = z.object({
  fromLocationId: z.string().min(1, "Source location is required"),
  toLocationId: z.string().min(1, "Destination location is required"),
  items: z.array(transferItemSchema).min(1, "At least one item is required"),
});

// ==========================================
// HELPERS
// ==========================================

async function getDbUserId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.email) return null;
  const dbUser = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  return dbUser?.id ?? null;
}

function generateReference(prefix: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  return `${prefix}-${ts}`;
}

// ==========================================
// 1. GET LOCATIONS
// ==========================================

export async function getLocations(): Promise<{
  success: boolean;
  data: LocationWithCounts[];
}> {
  try {
    const locations = await db.location.findMany({
      include: {
        _count: {
          select: {
            inventoryLevels: true,
            stockTransfers: true,
            stockReceived: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    return { success: true, data: locations };
  } catch (error) {
    console.error("GET_LOCATIONS_ERROR", error);
    return { success: false, data: [] };
  }
}

// ==========================================
// 2. UPSERT LOCATION (create or update)
// ==========================================

export async function upsertLocation(
  formData: FormData
): Promise<{ success: boolean; message?: string; error?: string }> {
  const userId = await getDbUserId();
  if (!userId) return { success: false, error: "Unauthorized access." };

  const id = (formData.get("id") as string | null)?.trim() || null;
  const isUpdate = !!id;

  const validation = locationSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address") || null,
    isDefault: formData.get("isDefault"),
    isActive: formData.get("isActive"),
  });

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const data = validation.data;

  try {
    if (data.isDefault) {
      await db.location.updateMany({
        where: { isDefault: true, ...(id ? { id: { not: id } } : {}) },
        data: { isDefault: false },
      });
    }

    if (isUpdate && id) {
      const oldLocation = await db.location.findUnique({
        where: { id },
        select: { name: true, isDefault: true, isActive: true },
      });

      await db.location.update({
        where: { id },
        data: {
          name: data.name,
          address: data.address ?? null,
          isDefault: data.isDefault,
          isActive: data.isActive,
        },
      });

      await db.activityLog.create({
        data: {
          userId,
          action: "LOCATION_UPDATED",
          entityType: "Location",
          entityId: id,
          details: {
            name: data.name,
            changes: {
              ...(oldLocation?.name !== data.name
                ? { name: { old: oldLocation?.name, new: data.name } }
                : {}),
              ...(oldLocation?.isDefault !== data.isDefault
                ? { isDefault: { old: oldLocation?.isDefault, new: data.isDefault } }
                : {}),
              ...(oldLocation?.isActive !== data.isActive
                ? { isActive: { old: oldLocation?.isActive, new: data.isActive } }
                : {}),
            },
          } as unknown as Prisma.InputJsonValue,
        },
      });
    } else {
      const count = await db.location.count();
      const location = await db.location.create({
        data: {
          name: data.name,
          address: data.address ?? null,
          isDefault: data.isDefault || count === 0,
          isActive: data.isActive,
        },
      });

      await db.activityLog.create({
        data: {
          userId,
          action: "LOCATION_CREATED",
          entityType: "Location",
          entityId: location.id,
          details: {
            name: location.name,
            isDefault: location.isDefault,
            isActive: location.isActive,
          } as unknown as Prisma.InputJsonValue,
        },
      });
    }

    revalidatePath("/admin/inventory");
    return {
      success: true,
      message: isUpdate ? "Location updated." : "Location created.",
    };
  } catch (error) {
    console.error("UPSERT_LOCATION_ERROR", error);
    return { success: false, error: "Failed to save location." };
  }
}

// ==========================================
// 3. DELETE LOCATION
// ==========================================

export async function deleteLocation(
  id: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const userId = await getDbUserId();
  if (!userId) return { success: false, error: "Unauthorized access." };

  const location = await db.location.findUnique({
    where: { id },
    select: { name: true, isDefault: true },
  });

  if (!location) return { success: false, error: "Location not found." };
  if (location.isDefault) {
    return {
      success: false,
      error: "Cannot delete the default location. Set another location as default first.",
    };
  }

  const inventoryCount = await db.inventoryLevel.count({
    where: { locationId: id },
  });

  if (inventoryCount > 0) {
    return {
      success: false,
      error: `Cannot delete: Location contains ${inventoryCount} inventory record(s). Transfer or clear stock first.`,
    };
  }

  try {
    await db.location.delete({ where: { id } });

    await db.activityLog.create({
      data: {
        userId,
        action: "LOCATION_DELETED",
        entityType: "Location",
        entityId: id,
        details: {
          name: location.name,
          permanent: true,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/admin/inventory");
    return { success: true, message: "Location deleted successfully." };
  } catch (error) {
    console.error("DELETE_LOCATION_ERROR", error);
    return { success: false, error: "Failed to delete location." };
  }
}

// ==========================================
// 4. GET STOCK TRANSFERS
// ==========================================

export async function getStockTransfers(): Promise<{
  success: boolean;
  data: StockTransferWithLocations[];
}> {
  try {
    const transfers = await db.stockTransfer.findMany({
      include: {
        fromLocation: { select: { name: true } },
        toLocation: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: transfers };
  } catch (error) {
    console.error("GET_TRANSFERS_ERROR", error);
    return { success: false, data: [] };
  }
}

// ==========================================
// 5. CREATE STOCK TRANSFER
// ==========================================

export async function createStockTransfer(payload: {
  fromLocationId: string;
  toLocationId: string;
  items: TransferItem[];
}): Promise<{ success: boolean; message?: string; error?: string }> {
  const userId = await getDbUserId();
  if (!userId) return { success: false, error: "Unauthorized access." };

  const validation = stockTransferSchema.safeParse(payload);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const data = validation.data;

  if (data.fromLocationId === data.toLocationId) {
    return { success: false, error: "Cannot transfer to the same location." };
  }

  const [fromLoc, toLoc] = await Promise.all([
    db.location.findUnique({
      where: { id: data.fromLocationId },
      select: { name: true },
    }),
    db.location.findUnique({
      where: { id: data.toLocationId },
      select: { name: true },
    }),
  ]);

  if (!fromLoc || !toLoc) {
    return { success: false, error: "One or both locations not found." };
  }

  const reference = generateReference("TRF");

  try {
    const transfer = await db.stockTransfer.create({
      data: {
        reference,
        fromLocationId: data.fromLocationId,
        toLocationId: data.toLocationId,
        status: "PENDING",
        items: data.items as unknown as Prisma.InputJsonValue,
      },
    });

    await db.activityLog.create({
      data: {
        userId,
        action: "STOCK_TRANSFER_CREATED",
        entityType: "StockTransfer",
        entityId: transfer.id,
        details: {
          reference,
          fromLocation: fromLoc.name,
          toLocation: toLoc.name,
          itemCount: data.items.length,
          totalQuantity: data.items.reduce((sum, i) => sum + i.quantity, 0),
        } as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/admin/inventory");
    return { success: true, message: "Stock transfer initiated." };
  } catch (error) {
    console.error("CREATE_TRANSFER_ERROR", error);
    return { success: false, error: "Failed to initiate transfer." };
  }
}
