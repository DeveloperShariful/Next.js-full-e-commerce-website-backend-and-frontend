// app/actions/review/review.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ==========================================
// 1. FETCH REVIEWS (With Filters & Counts)
// ==========================================
export async function getReviews(filter: string = "all", query: string = "") {
  try {
    // 🚀 Get counts for WP style tabs
    const [allCount, pendingCount, approvedCount, rejectedCount, trashCount] = await Promise.all([
      db.review.count({ where: { deletedAt: null } }),
      db.review.count({ where: { status: "pending", deletedAt: null } }),
      db.review.count({ where: { status: "approved", deletedAt: null } }),
      db.review.count({ where: { status: "rejected", deletedAt: null } }),
      db.review.count({ where: { deletedAt: { not: null } } })
    ]);

    // Determine where clause based on filter
    let baseWhere: any = { deletedAt: null };
    
    if (filter === "trash") {
      baseWhere = { deletedAt: { not: null } };
    } else if (filter !== "all") {
      baseWhere = { status: filter, deletedAt: null };
    }

    // Add search query if exists (Searching by title or content)
    const whereCondition = query
      ? {
          ...baseWhere,
          OR: [
            { title: { contains: query, mode: "insensitive" as const } },
            { content: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : baseWhere;

    const reviews = await db.review.findMany({
      where: whereCondition,
      include: {
        user: { select: { name: true, email: true, image: true } },
        product: { select: { name: true, slug: true, featuredImage: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return { 
      success: true, 
      data: reviews as any, 
      counts: {
        all: allCount,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        trash: trashCount
      }
    };
  } catch (error) {
    console.error("GET_REVIEWS_ERROR", error);
    return { success: false, data: [], counts: { all: 0, pending: 0, approved: 0, rejected: 0, trash: 0 } };
  }
}

// ==========================================
// 2. UPDATE STATUS (Approve / Unapprove)
// ==========================================
export async function updateReviewStatus(id: string, status: string) {
  try {
    await db.review.update({
      where: { id },
      data: { status }
    });
    revalidatePath("/admin/reviews");
    return { success: true, message: `Review marked as ${status}.` };
  } catch (error) {
    return { success: false, error: "Failed to update status." };
  }
}

// ==========================================
// 3. SOFT DELETE (MOVE TO TRASH)
// ==========================================
export async function deleteReview(id: string) {
  try {
    await db.review.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
    
    revalidatePath("/admin/reviews");
    return { success: true, message: "Review moved to trash." };
  } catch (error) {
    return { success: false, error: "Failed to move review to trash." };
  }
}

// ==========================================
// 4. RESTORE REVIEW
// ==========================================
export async function restoreReview(id: string) {
  try {
    await db.review.update({
      where: { id },
      data: { deletedAt: null }
    });
    
    revalidatePath("/admin/reviews");
    return { success: true, message: "Review restored from trash." };
  } catch (error) {
    return { success: false, error: "Failed to restore review." };
  }
}

// ==========================================
// 5. FORCE DELETE (PERMANENT)
// ==========================================
export async function forceDeleteReview(id: string) {
  try {
    await db.review.delete({
      where: { id }
    });
    
    revalidatePath("/admin/reviews");
    return { success: true, message: "Review permanently deleted." };
  } catch (error) {
    return { success: false, error: "Failed to permanently delete review." };
  }
}