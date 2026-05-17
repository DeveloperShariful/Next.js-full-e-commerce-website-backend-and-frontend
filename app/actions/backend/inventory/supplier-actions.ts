//app/actions/admin/inventory/supplier-actions.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ==========================================
// 1. SUPPLIER CRUD
// ==========================================
export async function getSuppliers(searchQuery: string = "") {
  try {
    const suppliers = await db.supplier.findMany({
      where: searchQuery ? {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { email: { contains: searchQuery, mode: 'insensitive' } }
        ]
      } : {},
      include: {
        _count: { select: { purchaseOrders: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: suppliers };
  } catch (error) {
    console.error("GET_SUPPLIERS_ERROR:", error);
    return { success: false, data: [] };
  }
}

export async function upsertSupplier(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const data = {
      name: formData.get("name") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      address: (formData.get("address") as string) || null,
      website: (formData.get("website") as string) || null,
      contactPerson: (formData.get("contactPerson") as string) || null,
    };

    if (!data.name) return { success: false, error: "Supplier name is required" };

    if (id) {
      await db.supplier.update({ where: { id }, data });
    } else {
      await db.supplier.create({ data });
    }

    revalidatePath("/admin/inventory");
    return { success: true, message: id ? "Supplier updated." : "Supplier created." };
  } catch (error) {
    console.error("UPSERT_SUPPLIER_ERROR:", error);
    return { success: false, error: "Failed to save supplier." };
  }
}

export async function deleteSupplier(id: string) {
  try {
    // Prevent deletion if they have active Purchase Orders
    const poCount = await db.purchaseOrder.count({ where: { supplierId: id } });
    if (poCount > 0) {
      return { success: false, error: `Cannot delete: Supplier has ${poCount} Purchase Orders.` };
    }

    await db.supplier.delete({ where: { id } });
    revalidatePath("/admin/inventory");
    return { success: true, message: "Supplier deleted." };
  } catch (error) {
    return { success: false, error: "Failed to delete supplier." };
  }
}

// ==========================================
// 2. PURCHASE ORDERS (PO)
// ==========================================
export async function getPurchaseOrders() {
  try {
    const pos = await db.purchaseOrder.findMany({
      include: {
        supplier: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 🚀 FIXED: Convert Prisma Decimal to standard JS Number for the frontend
    const serializedPos = pos.map(po => ({
      ...po,
      totalCost: Number(po.totalCost) 
    }));

    return { success: true, data: serializedPos };
  } catch (error) {
    console.error("GET_PO_ERROR:", error);
    return { success: false, data: [] };
  }
}

export async function createPurchaseOrder(formData: FormData) {
  try {
    const supplierId = formData.get("supplierId") as string;
    const status = formData.get("status") as string;
    const totalCost = parseFloat(formData.get("totalCost") as string);
    const notes = formData.get("notes") as string;

    if (!supplierId || isNaN(totalCost)) {
      return { success: false, error: "Supplier and valid total cost are required." };
    }

    // Auto-generate PO Number
    const poNumber = `PO-${Math.floor(100000 + Math.random() * 900000)}`;

    await db.purchaseOrder.create({
      data: {
        poNumber,
        supplierId,
        status: status || "PENDING",
        totalCost,
        notes: notes || null
      }
    });

    revalidatePath("/admin/inventory");
    return { success: true, message: "Purchase Order created successfully." };
  } catch (error) {
    console.error("CREATE_PO_ERROR:", error);
    return { success: false, error: "Failed to create Purchase Order." };
  }
}