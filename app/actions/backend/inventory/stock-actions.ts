//app/actions/admin/inventory/stock-actions.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

// ==========================================
// 1. GET INVENTORY LEVELS (With Reservations)
// ==========================================
export async function getInventoryList(searchQuery: string = "") {
  try {
    const where = searchQuery ? {
      OR: [
        { product: { name: { contains: searchQuery, mode: 'insensitive' as const } } },
        { product: { sku: { contains: searchQuery, mode: 'insensitive' as const } } },
        { variant: { sku: { contains: searchQuery, mode: 'insensitive' as const } } },
      ]
    } : {};

    const inventory = await db.inventoryLevel.findMany({
      where,
      include: {
        product: { 
          select: { id: true, name: true, sku: true, featuredImage: true, trackQuantity: true } 
        },
        variant: { 
          select: { id: true, name: true, sku: true, image: true, trackQuantity: true } 
        },
        location: { 
          select: { id: true, name: true } 
        }
      },
      orderBy: { quantity: 'asc' },
    });

    // 🚀 Fetch Reservations to calculate "Available Stock"
    const reservations = await db.inventoryReservation.groupBy({
      by: ['productId', 'variantId', 'locationId'],
      _sum: { quantity: true },
      where: { expiresAt: { gt: new Date() } } // Only active reservations
    });

    const data = inventory.map(item => {
      const reserved = reservations.find(r => 
        r.productId === item.productId && 
        r.variantId === item.variantId && 
        r.locationId === item.locationId
      )?._sum.quantity || 0;

      return {
        ...item,
        reserved,
        available: item.quantity - reserved // Real available stock
      };
    });

    return { success: true, data };
  } catch (error) {
    console.error("GET_INVENTORY_ERROR:", error);
    return { success: false, data: [] };
  }
}

// ==========================================
// 2. ADJUST STOCK (Creates History Log)
// ==========================================
export async function adjustStock(id: string, newQuantity: number, reason: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) return { success: false, error: "Unauthorized" };

    const dbUser = await db.user.findUnique({ where: { email: session.user.email } });
    if (!dbUser) return { success: false, error: "User not found" };

    const level = await db.inventoryLevel.findUnique({ where: { id } });
    if (!level) return { success: false, error: "Inventory record not found" };

    if (newQuantity < 0) return { success: false, error: "Stock cannot be negative" };

    const change = newQuantity - level.quantity;
    if (change === 0) return { success: false, error: "No changes made." };

    // 🚀 Transaction ensures both Level and History are updated safely
    await db.$transaction([
      // 1. Update Inventory Level
      db.inventoryLevel.update({
        where: { id },
        data: { quantity: newQuantity }
      }),
      // 2. Log to StockHistory (Schema Compliant)
      db.stockHistory.create({
        data: {
          productId: level.productId,
          variantId: level.variantId,
          locationId: level.locationId,
          change: change,
          finalStock: newQuantity,
          reason: reason || "Manual Adjustment",
          userId: dbUser.id
        }
      })
    ]);

    revalidatePath("/admin/inventory");
    return { success: true, message: "Stock updated successfully." };
  } catch (error) {
    console.error("ADJUST_STOCK_ERROR:", error);
    return { success: false, error: "Failed to adjust stock." };
  }
}

// ==========================================
// 3. GET STOCK HISTORY
// ==========================================
export async function getStockHistory(limit: number = 50) {
  try {
    const history = await db.stockHistory.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true } },
      }
    });
    return { success: true, data: history };
  } catch (error) {
    console.error("GET_STOCK_HISTORY_ERROR:", error);
    return { success: false, data: [] };
  }
}