// File: app/actions/backend/inventory/supplier-actions.ts
"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";
import { z } from "zod";

// ==========================================
// TYPES
// ==========================================

export type SupplierWithCount = Prisma.SupplierGetPayload<{
  include: { _count: { select: { purchaseOrders: true } } };
}>;

export type PurchaseOrderWithSupplier = Omit<
  Prisma.PurchaseOrderGetPayload<{
    include: { supplier: { select: { name: true; email: true } } };
  }>,
  "totalCost"
> & { totalCost: number };

// ==========================================
// ZOD SCHEMAS
// ==========================================

const supplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  website: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  contactPerson: z.string().optional().nullable(),
});

const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  status: z.string().default("PENDING"),
  totalCost: z.coerce
    .number()
    .nonnegative("Total cost cannot be negative"),
  notes: z.string().optional().nullable(),
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
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

// ==========================================
// 1. GET SUPPLIERS
// ==========================================

export async function getSuppliers(
  searchQuery = ""
): Promise<{ success: boolean; data: SupplierWithCount[] }> {
  try {
    const whereClause: Prisma.SupplierWhereInput = searchQuery
      ? {
          OR: [
            { name: { contains: searchQuery, mode: "insensitive" } },
            { email: { contains: searchQuery, mode: "insensitive" } },
          ],
        }
      : {};

    const suppliers = await db.supplier.findMany({
      where: whereClause,
      include: { _count: { select: { purchaseOrders: true } } },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: suppliers };
  } catch (error) {
    console.error("GET_SUPPLIERS_ERROR", error);
    return { success: false, data: [] };
  }
}

// ==========================================
// 2. UPSERT SUPPLIER (create or update)
// ==========================================

export async function upsertSupplier(
  formData: FormData
): Promise<{ success: boolean; message?: string; error?: string }> {
  const userId = await getDbUserId();
  if (!userId) return { success: false, error: "Unauthorized access." };

  const id = (formData.get("id") as string | null)?.trim() || null;
  const isUpdate = !!id;

  const validation = supplierSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") || null,
    phone: formData.get("phone") || null,
    address: formData.get("address") || null,
    website: formData.get("website") || null,
    contactPerson: formData.get("contactPerson") || null,
  });

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const data = validation.data;
  const writeData = {
    name: data.name,
    email: data.email || null,
    phone: data.phone ?? null,
    address: data.address ?? null,
    website: data.website || null,
    contactPerson: data.contactPerson ?? null,
  };

  try {
    if (isUpdate && id) {
      const oldSupplier = await db.supplier.findUnique({
        where: { id },
        select: { name: true, email: true, phone: true },
      });

      await db.supplier.update({ where: { id }, data: writeData });

      await db.activityLog.create({
        data: {
          userId,
          action: "SUPPLIER_UPDATED",
          entityType: "Supplier",
          entityId: id,
          details: {
            supplierName: data.name,
            changes: {
              ...(oldSupplier?.name !== data.name
                ? { name: { old: oldSupplier?.name, new: data.name } }
                : {}),
              ...(oldSupplier?.email !== (data.email || null)
                ? { email: { old: oldSupplier?.email, new: data.email || null } }
                : {}),
            },
          } as unknown as Prisma.InputJsonValue,
        },
      });
    } else {
      const supplier = await db.supplier.create({ data: writeData });

      await db.activityLog.create({
        data: {
          userId,
          action: "SUPPLIER_CREATED",
          entityType: "Supplier",
          entityId: supplier.id,
          details: {
            name: supplier.name,
            email: supplier.email ?? null,
            contactPerson: supplier.contactPerson ?? null,
          } as unknown as Prisma.InputJsonValue,
        },
      });
    }

    revalidatePath("/admin/inventory");
    return {
      success: true,
      message: isUpdate ? "Supplier updated." : "Supplier created.",
    };
  } catch (error) {
    console.error("UPSERT_SUPPLIER_ERROR", error);
    return { success: false, error: "Failed to save supplier." };
  }
}

// ==========================================
// 3. DELETE SUPPLIER
// ==========================================

export async function deleteSupplier(
  id: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const userId = await getDbUserId();
  if (!userId) return { success: false, error: "Unauthorized access." };

  const supplier = await db.supplier.findUnique({
    where: { id },
    select: { name: true },
  });

  if (!supplier) return { success: false, error: "Supplier not found." };

  const poCount = await db.purchaseOrder.count({ where: { supplierId: id } });
  if (poCount > 0) {
    return {
      success: false,
      error: `Cannot delete: Supplier has ${poCount} Purchase Order(s). Archive or reassign them first.`,
    };
  }

  try {
    await db.supplier.delete({ where: { id } });

    await db.activityLog.create({
      data: {
        userId,
        action: "SUPPLIER_DELETED",
        entityType: "Supplier",
        entityId: id,
        details: {
          name: supplier.name,
          permanent: true,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/admin/inventory");
    return { success: true, message: "Supplier deleted." };
  } catch (error) {
    console.error("DELETE_SUPPLIER_ERROR", error);
    return { success: false, error: "Failed to delete supplier." };
  }
}

// ==========================================
// 4. GET PURCHASE ORDERS
// ==========================================

export async function getPurchaseOrders(): Promise<{
  success: boolean;
  data: PurchaseOrderWithSupplier[];
}> {
  try {
    const pos = await db.purchaseOrder.findMany({
      include: { supplier: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });

    const serialized: PurchaseOrderWithSupplier[] = pos.map((po) => ({
      ...po,
      totalCost: Number(po.totalCost),
    }));

    return { success: true, data: serialized };
  } catch (error) {
    console.error("GET_PO_ERROR", error);
    return { success: false, data: [] };
  }
}

// ==========================================
// 5. CREATE PURCHASE ORDER
// ==========================================

export async function createPurchaseOrder(
  formData: FormData
): Promise<{ success: boolean; message?: string; error?: string }> {
  const userId = await getDbUserId();
  if (!userId) return { success: false, error: "Unauthorized access." };

  const validation = purchaseOrderSchema.safeParse({
    supplierId: formData.get("supplierId"),
    status: formData.get("status") || "PENDING",
    totalCost: formData.get("totalCost"),
    notes: formData.get("notes") || null,
  });

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const data = validation.data;

  const supplier = await db.supplier.findUnique({
    where: { id: data.supplierId },
    select: { name: true },
  });

  if (!supplier) {
    return { success: false, error: "Supplier not found." };
  }

  const poNumber = generateReference("PO");

  try {
    const po = await db.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: data.supplierId,
        status: data.status,
        totalCost: data.totalCost,
        notes: data.notes ?? null,
      },
    });

    await db.activityLog.create({
      data: {
        userId,
        action: "PURCHASE_ORDER_CREATED",
        entityType: "PurchaseOrder",
        entityId: po.id,
        details: {
          poNumber,
          supplierName: supplier.name,
          supplierId: data.supplierId,
          status: data.status,
          totalCost: data.totalCost,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/admin/inventory");
    return { success: true, message: "Purchase Order created successfully." };
  } catch (error) {
    console.error("CREATE_PO_ERROR", error);
    return { success: false, error: "Failed to create Purchase Order." };
  }
}
