// File: app/actions/admin/product/product-list.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ProductStatus } from "@prisma/client";
import { currentUser } from "@clerk/nextjs/server"; // 🔥 UPDATE

// Helper to get DB User ID
async function getDbUserId() {
    const user = await currentUser();
    if (!user) return null;
    const dbUser = await db.user.findUnique({ where: { clerkId: user.id } });
    return dbUser?.id;
}

export async function deleteProduct(id: string) {
    try {
        const userId = await getDbUserId();
        
        await db.product.update({
            where: { id },
            data: { 
                deletedAt: new Date(), 
                status: ProductStatus.ARCHIVED 
            }
        });

        // 🔥 Log
        if (userId) {
            await db.activityLog.create({
                data: {
                    userId,
                    action: "ARCHIVED_PRODUCT",
                    entityType: "Product",
                    entityId: id,
                    details: { method: "Single Action" }
                }
            });
        }

        revalidatePath("/admin/products");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete" };
    }
}

export async function bulkProductAction(formData: FormData) {
    const ids = JSON.parse(formData.get("ids") as string);
    const action = formData.get("action") as string;
    const userId = await getDbUserId();

    if (!ids.length) return { success: false, message: "No items selected" };

    try {
        switch (action) {
            case "trash":
                await db.product.updateMany({
                    where: { id: { in: ids } },
                    data: { status: ProductStatus.ARCHIVED }
                });
                break;
            
            case "delete":
                await db.product.deleteMany({
                    where: { id: { in: ids } }
                });
                break;

            case "restore":
                await db.product.updateMany({
                    where: { id: { in: ids } },
                    data: { status: ProductStatus.DRAFT }
                });
                break;

            case "publish":
                await db.product.updateMany({
                    where: { id: { in: ids } },
                    data: { status: ProductStatus.ACTIVE }
                });
                break;

            case "unpublish":
                await db.product.updateMany({
                    where: { id: { in: ids } },
                    data: { status: ProductStatus.DRAFT }
                });
                break;
        }
        
        // 🔥 Log Bulk Action
        if (userId) {
            await db.activityLog.create({
                data: {
                    userId,
                    action: `BULK_${action.toUpperCase()}`,
                    entityType: "Product",
                    details: { 
                        count: ids.length, 
                        affectedIds: ids 
                    }
                }
            });
        }

        revalidatePath("/admin/products");
        return { success: true, message: "Bulk action applied" };
    } catch (error) {
        return { success: false, message: "Action failed" };
    }
}

export async function moveToTrash(id: string) {
    try {
        const userId = await getDbUserId();
        
        await db.product.update({
            where: { id },
            data: { status: ProductStatus.ARCHIVED }
        });

        // 🔥 Log
        if (userId) {
            await db.activityLog.create({
                data: {
                    userId,
                    action: "MOVED_TO_TRASH",
                    entityType: "Product",
                    entityId: id
                }
            });
        }

        revalidatePath("/admin/products");
    } catch (error) {
        console.error(error);
    }
}