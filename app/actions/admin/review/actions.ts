//app/actions/admin/review/actions.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ============================================================================
// 1. FETCH ALL REVIEWS (With Advanced Filters, Pagination & Counts)
// ============================================================================
export async function getReviews(
  filter: string = "all", 
  searchQuery: string = "", 
  ratingFilter: string = "all",
  productSearch: string = "",
  page: number = 1,
  limit: number = 20
) {
  try {
    const [allCount, pendingCount, approvedCount, spamCount, trashCount] = await Promise.all([
      db.review.count({ where: { status: { not: "TRASH" } } }),
      db.review.count({ where: { status: "PENDING" } }),
      db.review.count({ where: { status: "APPROVED" } }),
      db.review.count({ where: { status: "SPAM" } }),
      db.review.count({ where: { status: "TRASH" } })
    ]);

    let baseWhere: any = {};
    if (filter === "trash") baseWhere = { status: "TRASH" };
    else if (filter === "pending") baseWhere = { status: "PENDING" };
    else if (filter === "approved") baseWhere = { status: "APPROVED" };
    else if (filter === "spam" || filter === "rejected") baseWhere = { status: "SPAM" };
    else baseWhere = { status: { not: "TRASH" } };

    const andConditions: any[] = [baseWhere];

    if (ratingFilter !== "all") {
      andConditions.push({ rating: parseInt(ratingFilter) });
    }

    if (productSearch && productSearch.trim() !== "") {
      andConditions.push({
        product: { name: { contains: productSearch.trim(), mode: "insensitive" } }
      });
    }

    if (searchQuery && searchQuery.trim() !== "") {
      andConditions.push({
        OR: [
          { title: { contains: searchQuery.trim(), mode: "insensitive" } },
          { content: { contains: searchQuery.trim(), mode: "insensitive" } },
          { reply: { contains: searchQuery.trim(), mode: "insensitive" } },
          { user: { name: { contains: searchQuery.trim(), mode: "insensitive" } } },
          { user: { email: { contains: searchQuery.trim(), mode: "insensitive" } } }
        ]
      });
    }

    const finalWhere = { AND: andConditions };
    const skip = (page - 1) * limit;
    
    const [reviews, totalItemsCount] = await Promise.all([
      db.review.findMany({
        where: finalWhere,
        include: {
          user: { select: { name: true, email: true, image: true } },
          product: { 
            select: { 
              name: true, 
              slug: true, 
              featuredImage: true,
              _count: { select: { reviews: { where: { status: "APPROVED" } } } } 
            } 
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.review.count({ where: finalWhere })
    ]);

    return { 
      success: true, 
      data: reviews as any, 
      pagination: {
        totalItems: totalItemsCount,
        totalPages: Math.ceil(totalItemsCount / limit) || 1,
        currentPage: page,
        limit
      },
      counts: { all: allCount, pending: pendingCount, approved: approvedCount, rejected: spamCount, trash: trashCount }
    };
  } catch (error) {
    console.error("GET_REVIEWS_ERROR:", error);
    return { success: false, data: [], pagination: { totalItems: 0, totalPages: 1, currentPage: 1, limit: 20 }, counts: { all: 0, pending: 0, approved: 0, rejected: 0, trash: 0 } };
  }
}

// ============================================================================
// 2. GET SINGLE REVIEW BY ID (For Separate Edit Page)
// ============================================================================
export async function getReviewById(id: string) {
  try {
    if (!id) return { success: false, error: "Review ID is required." };

    const review = await db.review.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, image: true } },
        product: { select: { name: true, slug: true, featuredImage: true } }
      }
    });

    if (!review) return { success: false, error: "Review not found." };

    return { success: true, data: review as any };
  } catch (error) {
    console.error("GET_SINGLE_REVIEW_ERROR:", error);
    return { success: false, error: "Failed to fetch review details." };
  }
}

// ============================================================================
// 3. UPDATE FULL REVIEW (Used in Separate Edit Page)
// ============================================================================
export async function updateFullReview(id: string, payload: { 
  title: string | null;  // 🚀 Added title here to fix the error
  content: string; 
  rating: number; 
  status: "PENDING" | "APPROVED" | "SPAM" | "TRASH"; 
  createdAt: Date; 
}) {
  try {
    if (!id) return { success: false, error: "Review ID is required." };
    
    if (payload.rating < 1 || payload.rating > 5) {
      return { success: false, error: "Rating must be between 1 and 5." };
    }

    if (!payload.content || payload.content.trim() === "") {
      return { success: false, error: "Review content cannot be empty." };
    }

    await db.review.update({
      where: { id },
      data: { 
        title: payload.title && payload.title.trim() !== "" ? payload.title.trim() : null,
        content: payload.content.trim(),
        rating: payload.rating,
        status: payload.status,
        createdAt: payload.createdAt, 
        updatedAt: new Date()
      }
    });
    
    revalidatePath("/admin/reviews");
    revalidatePath(`/admin/reviews/${id}`);
    
    return { success: true, message: "Review updated successfully." };
  } catch (error) {
    console.error("UPDATE_FULL_REVIEW_ERROR:", error);
    return { success: false, error: "Failed to update review details." };
  }
}


// ============================================================================
// 4. SUBMIT OR UPDATE REPLY (Inline Reply Feature)
// ============================================================================
export async function submitReply(id: string, replyText: string) {
  try {
    if (!id) return { success: false, error: "Review ID is required." };
    
    const processedReply = replyText && replyText.trim() !== "" ? replyText.trim() : null;

    await db.review.update({
      where: { id },
      data: { reply: processedReply }
    });
    
    revalidatePath("/admin/reviews");
    return { success: true, message: processedReply ? "Reply published successfully." : "Reply removed successfully." };
  } catch (error) {
    console.error("SUBMIT_REPLY_ERROR:", error);
    return { success: false, error: "Failed to process reply." };
  }
}

// ============================================================================
// 5. QUICK UPDATE STATUS (Approve / Unapprove / Spam)
// ============================================================================
export async function updateReviewStatus(id: string, status: "PENDING" | "APPROVED" | "SPAM") {
  try {
    if (!id || !status) return { success: false, error: "Invalid parameters." };

    await db.review.update({
      where: { id },
      data: { status }
    });
    revalidatePath("/admin/reviews");
    return { success: true, message: `Review successfully marked as ${status.toLowerCase()}.` };
  } catch (error) {
    console.error("UPDATE_STATUS_ERROR:", error);
    return { success: false, error: "Failed to update review status." };
  }
}

// ============================================================================
// 6. SOFT DELETE (MOVE TO TRASH)
// ============================================================================
export async function deleteReview(id: string) {
  try {
    await db.review.update({
      where: { id },
      data: { status: "TRASH", deletedAt: new Date() }
    });
    revalidatePath("/admin/reviews");
    return { success: true, message: "Review moved to trash." };
  } catch (error) {
    console.error("DELETE_REVIEW_ERROR:", error);
    return { success: false, error: "Failed to move review to trash." };
  }
}

// ============================================================================
// 7. RESTORE REVIEW
// ============================================================================
export async function restoreReview(id: string) {
  try {
    await db.review.update({
      where: { id },
      data: { status: "PENDING", deletedAt: null }
    });
    revalidatePath("/admin/reviews");
    return { success: true, message: "Review restored from trash." };
  } catch (error) {
    console.error("RESTORE_REVIEW_ERROR:", error);
    return { success: false, error: "Failed to restore review." };
  }
}

// ============================================================================
// 8. FORCE DELETE (PERMANENT)
// ============================================================================
export async function forceDeleteReview(id: string) {
  try {
    await db.review.delete({ where: { id } });
    revalidatePath("/admin/reviews");
    return { success: true, message: "Review permanently deleted." };
  } catch (error) {
    console.error("FORCE_DELETE_REVIEW_ERROR:", error);
    return { success: false, error: "Failed to permanently delete review." };
  }
}