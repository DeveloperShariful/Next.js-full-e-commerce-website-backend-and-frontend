// File: app/actions/admin/product/product-list-and-delete.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ProductStatus } from "@prisma/client";
import { currentUser } from "@clerk/nextjs/server";

// Helper to get DB User ID
async function getDbUserId() {
    const user = await currentUser();
    if (!user) return null;
    const dbUser = await db.user.findUnique({ where: { clerkId: user.id } });
    return dbUser?.id;
}

// --- ১. সিঙ্গেল প্রোডাক্ট ডিলিট (Smart Logic) ---
export async function deleteProduct(id: string) {
    try {
        const userId = await getDbUserId();

        // চেক: এই প্রোডাক্ট কি কখনো বিক্রি হয়েছে?
        const hasOrders = await db.orderItem.findFirst({
            where: { productId: id }
        });

        if (hasOrders) {
            // A. বিক্রি হয়ে থাকলে => শুধু Archive করব (নিরাপদ)
            await db.product.update({
                where: { id },
                data: { 
                    deletedAt: new Date(), 
                    status: ProductStatus.ARCHIVED 
                }
            });
            
            if (userId) {
                await db.activityLog.create({
                    data: {
                        userId,
                        action: "ARCHIVED_PRODUCT_SAFE",
                        entityType: "Product",
                        entityId: id,
                        details: { reason: "Has sales history, soft deleted instead." }
                    }
                });
            }
            revalidatePath("/admin/products");
            return { success: true, message: "Product archived (Has sales history)" };

        } else {
            // B. বিক্রি না হয়ে থাকলে => সব ক্লিন করে পার্মানেন্ট ডিলিট
            await db.$transaction(async (tx) => {
                // ১. ডিপেন্ডেন্সি ক্লিন করা
                await tx.inventoryLevel.deleteMany({ where: { productId: id } });
                await tx.cartItem.deleteMany({ where: { productId: id } });
                await tx.wishlist.deleteMany({ where: { productId: id } });
                await tx.review.deleteMany({ where: { productId: id } });
                await tx.digitalFile.deleteMany({ where: { productId: id } });
                await tx.productAttribute.deleteMany({ where: { productId: id } });
                
                await tx.bundleItem.deleteMany({ 
                    where: { OR: [{ parentProductId: id }, { childProductId: id }] } 
                });

                // ২. মেইন প্রোডাক্ট ডিলিট
                await tx.product.delete({ where: { id } });
            });

            if (userId) {
                await db.activityLog.create({
                    data: {
                        userId,
                        action: "DELETED_PRODUCT_PERMANENT",
                        entityType: "Product",
                        entityId: id,
                        details: { reason: "No sales history, permanently deleted." }
                    }
                });
            }
            
            revalidatePath("/admin/products");
            return { success: true, message: "Product permanently deleted" };
        }

    } catch (error) {
        console.error("DELETE_PRODUCT_ERROR", error);
        return { success: false, error: "Failed to delete product" };
    }
}

// --- ২. বাল্ক অ্যাকশন (Smart Bulk Logic) ---
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
                    data: { status: ProductStatus.ARCHIVED, deletedAt: new Date() }
                });
                break;
            
            case "delete":
                // 🔥 SMART DELETE LOGIC FOR BULK
                // ১. চেক করা কোন কোন প্রোডাক্টের অর্ডার আছে
                const soldItems = await db.orderItem.findMany({
                    where: { productId: { in: ids } },
                    select: { productId: true },
                    distinct: ['productId']
                });

                // ২. লিস্ট আলাদা করা
                const soldProductIds = soldItems.map(item => item.productId).filter((id): id is string => id !== null);
                const unsoldProductIds = ids.filter((id: string) => !soldProductIds.includes(id));

                await db.$transaction(async (tx) => {
                    
                    // A. যেগুলো বিক্রি হয়েছে => সেগুলোকে জোর করে ARCHIVED করা হবে
                    if (soldProductIds.length > 0) {
                        await tx.product.updateMany({
                            where: { id: { in: soldProductIds } },
                            data: { 
                                status: ProductStatus.ARCHIVED,
                                deletedAt: new Date() 
                            }
                        });
                    }

                    // B. যেগুলো বিক্রি হয়নি => সেগুলোকে পার্মানেন্ট ডিলিট করা হবে
                    if (unsoldProductIds.length > 0) {
                        // ১. ইনভেন্টরি, কার্ট, উইশলিস্ট ডিলিট
                        await tx.inventoryLevel.deleteMany({ where: { productId: { in: unsoldProductIds } } });
                        await tx.cartItem.deleteMany({ where: { productId: { in: unsoldProductIds } } });
                        await tx.wishlist.deleteMany({ where: { productId: { in: unsoldProductIds } } });
                        await tx.review.deleteMany({ where: { productId: { in: unsoldProductIds } } });
                        await tx.digitalFile.deleteMany({ where: { productId: { in: unsoldProductIds } } });
                        
                        await tx.bundleItem.deleteMany({ 
                            where: { OR: [{ parentProductId: { in: unsoldProductIds } }, { childProductId: { in: unsoldProductIds } }] } 
                        });

                        // ২. প্রোডাক্ট ডিলিট
                        await tx.product.deleteMany({
                            where: { id: { in: unsoldProductIds } }
                        });
                    }
                });

                let msg = "";
                if (unsoldProductIds.length > 0) msg += `${unsoldProductIds.length} deleted permanently. `;
                if (soldProductIds.length > 0) msg += `${soldProductIds.length} archived (has orders).`;
                
                if (userId) {
                    await db.activityLog.create({
                        data: {
                            userId,
                            action: "BULK_SMART_DELETE",
                            details: { 
                                deleted: unsoldProductIds.length, 
                                archived: soldProductIds.length 
                            }
                        }
                    });
                }

                revalidatePath("/admin/products");
                return { success: true, message: msg || "Action completed" };

            case "restore":
                await db.product.updateMany({
                    where: { id: { in: ids } },
                    data: { status: ProductStatus.DRAFT, deletedAt: null }
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
        
        if (action !== "delete" && userId) {
            await db.activityLog.create({
                data: {
                    userId,
                    action: `BULK_${action.toUpperCase()}`,
                    entityType: "Product",
                    details: { count: ids.length, affectedIds: ids }
                }
            });
        }

        revalidatePath("/admin/products");
        return { success: true, message: "Bulk action applied" };
    } catch (error) {
        console.error("BULK_ACTION_ERROR", error);
        return { success: false, message: "Action failed" };
    }
}

export async function moveToTrash(id: string) {
    try {
        const userId = await getDbUserId();
        
        await db.product.update({
            where: { id },
            data: { status: ProductStatus.ARCHIVED, deletedAt: new Date() }
        });

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