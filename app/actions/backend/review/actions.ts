// File: app/actions/backend/review/actions.ts
"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { Prisma, ReviewStatus } from "@prisma/client";
import { z } from "zod";

// ==========================================
// TYPES
// ==========================================

export type ReviewWithRelations = Prisma.ReviewGetPayload<{
  include: {
    user: { select: { name: true; email: true; image: true } };
    product: {
      select: {
        name: true;
        slug: true;
        featuredImage: true;
        _count: { select: { reviews: { where: { status: "APPROVED" } } } };
      };
    };
  };
}>;

type PaginationMeta = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
};

type ReviewCounts = {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
  trash: number;
};

// ==========================================
// ZOD SCHEMA
// ==========================================

const updateReviewSchema = z.object({
  title: z.string().optional().nullable(),
  content: z.string().min(1, "Review content cannot be empty"),
  rating: z.number().int().min(1).max(5),
  status: z.enum(["PENDING", "APPROVED", "SPAM", "TRASH"]),
});

// ==========================================
// HELPERS
// ==========================================

async function getDbUserId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.email) return null;
  const dbUser = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });
  if (!dbUser) return null;
  const allowed = ["SUPER_ADMIN", "ADMIN", "MANAGER", "EDITOR", "SUPPORT"] as const;
  if (!(allowed as readonly string[]).includes(dbUser.role)) return null;
  return dbUser.id;
}

async function recalculateProductRating(productId: string): Promise<void> {
  const result = await db.review.aggregate({
    where: { productId, status: ReviewStatus.APPROVED },
    _avg: { rating: true },
    _count: { id: true },
  });

  await db.product.update({
    where: { id: productId },
    data: {
      rating: result._avg.rating ?? 0,
      reviewCount: result._count.id,
    },
  });
}

function buildReviewWhere(
  filter: string,
  searchQuery: string,
  ratingFilter: string,
  productSearch: string
): Prisma.ReviewWhereInput {
  const statusWhere: Prisma.ReviewWhereInput =
    filter === "trash"
      ? { status: ReviewStatus.TRASH }
      : filter === "pending"
        ? { status: ReviewStatus.PENDING }
        : filter === "approved"
          ? { status: ReviewStatus.APPROVED }
          : filter === "spam" || filter === "rejected"
            ? { status: ReviewStatus.SPAM }
            : { status: { not: ReviewStatus.TRASH } };

  const andConditions: Prisma.ReviewWhereInput[] = [statusWhere];

  if (ratingFilter !== "all") {
    const ratingNum = parseInt(ratingFilter);
    if (!isNaN(ratingNum)) {
      andConditions.push({ rating: ratingNum });
    }
  }

  if (productSearch.trim()) {
    andConditions.push({
      product: {
        name: { contains: productSearch.trim(), mode: "insensitive" },
      },
    });
  }

  if (searchQuery.trim()) {
    andConditions.push({
      OR: [
        { title: { contains: searchQuery.trim(), mode: "insensitive" } },
        { content: { contains: searchQuery.trim(), mode: "insensitive" } },
        { reply: { contains: searchQuery.trim(), mode: "insensitive" } },
        {
          user: {
            name: { contains: searchQuery.trim(), mode: "insensitive" },
          },
        },
        {
          user: {
            email: { contains: searchQuery.trim(), mode: "insensitive" },
          },
        },
      ],
    });
  }

  return { AND: andConditions };
}

// ==========================================
// 1. GET REVIEWS (filters + pagination)
// ==========================================

export async function getReviews(
  filter = "all",
  searchQuery = "",
  ratingFilter = "all",
  productSearch = "",
  page = 1,
  limit = 20
): Promise<{
  success: boolean;
  data: ReviewWithRelations[];
  pagination: PaginationMeta;
  counts: ReviewCounts;
}> {
  const emptyResult = {
    success: false,
    data: [],
    pagination: { totalItems: 0, totalPages: 1, currentPage: 1, limit },
    counts: { all: 0, pending: 0, approved: 0, rejected: 0, trash: 0 },
  };

  try {
    const [allCount, pendingCount, approvedCount, spamCount, trashCount] =
      await Promise.all([
        db.review.count({ where: { status: { not: ReviewStatus.TRASH } } }),
        db.review.count({ where: { status: ReviewStatus.PENDING } }),
        db.review.count({ where: { status: ReviewStatus.APPROVED } }),
        db.review.count({ where: { status: ReviewStatus.SPAM } }),
        db.review.count({ where: { status: ReviewStatus.TRASH } }),
      ]);

    const whereClause = buildReviewWhere(
      filter,
      searchQuery,
      ratingFilter,
      productSearch
    );

    const skip = (page - 1) * limit;

    const [reviews, totalItemsCount] = await Promise.all([
      db.review.findMany({
        where: whereClause,
        include: {
          user: { select: { name: true, email: true, image: true } },
          product: {
            select: {
              name: true,
              slug: true,
              featuredImage: true,
              _count: {
                select: {
                  reviews: { where: { status: ReviewStatus.APPROVED } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.review.count({ where: whereClause }),
    ]);

    return {
      success: true,
      data: reviews,
      pagination: {
        totalItems: totalItemsCount,
        totalPages: Math.ceil(totalItemsCount / limit) || 1,
        currentPage: page,
        limit,
      },
      counts: {
        all: allCount,
        pending: pendingCount,
        approved: approvedCount,
        rejected: spamCount,
        trash: trashCount,
      },
    };
  } catch (error) {
    console.error("GET_REVIEWS_ERROR", error);
    return emptyResult;
  }
}

// ==========================================
// 2. GET SINGLE REVIEW
// ==========================================

export async function getReviewById(id: string): Promise<{
  success: boolean;
  data?: ReviewWithRelations;
  error?: string;
}> {
  if (!id) return { success: false, error: "Review ID is required." };

  try {
    const review = await db.review.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, image: true } },
        product: {
          select: {
            name: true,
            slug: true,
            featuredImage: true,
            _count: {
              select: {
                reviews: { where: { status: ReviewStatus.APPROVED } },
              },
            },
          },
        },
      },
    });

    if (!review) return { success: false, error: "Review not found." };

    return { success: true, data: review };
  } catch (error) {
    console.error("GET_SINGLE_REVIEW_ERROR", error);
    return { success: false, error: "Failed to fetch review details." };
  }
}

// ==========================================
// 3. UPDATE FULL REVIEW (admin edit page)
// ==========================================

export async function updateFullReview(
  id: string,
  payload: {
    title: string | null;
    content: string;
    rating: number;
    status: "PENDING" | "APPROVED" | "SPAM" | "TRASH";
  }
): Promise<{ success: boolean; message?: string; error?: string }> {
  const userId = await getDbUserId();
  if (!userId) return { success: false, error: "Unauthorized access." };

  if (!id) return { success: false, error: "Review ID is required." };

  const validation = updateReviewSchema.safeParse(payload);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const data = validation.data;

  const oldReview = await db.review.findUnique({
    where: { id },
    select: {
      productId: true,
      status: true,
      rating: true,
      content: true,
      title: true,
    },
  });

  if (!oldReview) return { success: false, error: "Review not found." };

  try {
    await db.review.update({
      where: { id },
      data: {
        title: data.title?.trim() || null,
        content: data.content.trim(),
        rating: data.rating,
        status: data.status,
        updatedAt: new Date(),
      },
    });

    const statusChanged = oldReview.status !== data.status;
    const ratingChanged = oldReview.rating !== data.rating;

    if (statusChanged || ratingChanged) {
      await recalculateProductRating(oldReview.productId);
    }

    await db.activityLog.create({
      data: {
        userId,
        action: "REVIEW_UPDATED",
        entityType: "Review",
        entityId: id,
        details: {
          productId: oldReview.productId,
          changes: {
            ...(oldReview.status !== data.status
              ? { status: { old: oldReview.status, new: data.status } }
              : {}),
            ...(oldReview.rating !== data.rating
              ? { rating: { old: oldReview.rating, new: data.rating } }
              : {}),
            ...(oldReview.content !== data.content
              ? { contentEdited: true }
              : {}),
          },
          productRatingRecalculated: statusChanged || ratingChanged,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/admin/reviews");
    revalidatePath(`/admin/reviews/${id}`);

    return { success: true, message: "Review updated successfully." };
  } catch (error) {
    console.error("UPDATE_FULL_REVIEW_ERROR", error);
    return { success: false, error: "Failed to update review details." };
  }
}

// ==========================================
// 4. SUBMIT OR UPDATE REPLY
// ==========================================

export async function submitReply(
  id: string,
  replyText: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const userId = await getDbUserId();
  if (!userId) return { success: false, error: "Unauthorized access." };

  if (!id) return { success: false, error: "Review ID is required." };

  const processedReply =
    replyText && replyText.trim() !== "" ? replyText.trim() : null;

  const review = await db.review.findUnique({
    where: { id },
    select: { productId: true, reply: true },
  });

  if (!review) return { success: false, error: "Review not found." };

  try {
    await db.review.update({
      where: { id },
      data: { reply: processedReply },
    });

    await db.activityLog.create({
      data: {
        userId,
        action: processedReply ? "REVIEW_REPLY_ADDED" : "REVIEW_REPLY_REMOVED",
        entityType: "Review",
        entityId: id,
        details: {
          productId: review.productId,
          hadPreviousReply: !!review.reply,
          replyAdded: !!processedReply,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/admin/reviews");
    return {
      success: true,
      message: processedReply
        ? "Reply published successfully."
        : "Reply removed successfully.",
    };
  } catch (error) {
    console.error("SUBMIT_REPLY_ERROR", error);
    return { success: false, error: "Failed to process reply." };
  }
}

// ==========================================
// 5. QUICK STATUS UPDATE (approve/spam/etc.)
// ==========================================

export async function updateReviewStatus(
  id: string,
  status: "PENDING" | "APPROVED" | "SPAM"
): Promise<{ success: boolean; message?: string; error?: string }> {
  const userId = await getDbUserId();
  if (!userId) return { success: false, error: "Unauthorized access." };

  if (!id || !status) return { success: false, error: "Invalid parameters." };

  const review = await db.review.findUnique({
    where: { id },
    select: { productId: true, status: true, rating: true },
  });

  if (!review) return { success: false, error: "Review not found." };

  try {
    await db.review.update({
      where: { id },
      data: { status },
    });

    await recalculateProductRating(review.productId);

    await db.activityLog.create({
      data: {
        userId,
        action: "REVIEW_STATUS_CHANGED",
        entityType: "Review",
        entityId: id,
        details: {
          productId: review.productId,
          oldStatus: review.status,
          newStatus: status,
          rating: review.rating,
          productRatingRecalculated: true,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/admin/reviews");
    return {
      success: true,
      message: `Review marked as ${status.toLowerCase()}.`,
    };
  } catch (error) {
    console.error("UPDATE_REVIEW_STATUS_ERROR", error);
    return { success: false, error: "Failed to update review status." };
  }
}

// ==========================================
// 6. BULK STATUS UPDATE
// ==========================================

export async function bulkUpdateReviewStatus(
  ids: string[],
  status: "PENDING" | "APPROVED" | "SPAM" | "TRASH"
): Promise<{ success: boolean; message?: string; error?: string }> {
  const userId = await getDbUserId();
  if (!userId) return { success: false, error: "Unauthorized access." };

  if (!ids.length) return { success: false, error: "No reviews selected." };

  const reviews = await db.review.findMany({
    where: { id: { in: ids } },
    select: { id: true, productId: true },
  });

  const affectedProductIds = [...new Set(reviews.map((r) => r.productId))];

  try {
    await db.review.updateMany({
      where: { id: { in: ids } },
      data: {
        status,
        ...(status === "TRASH" ? { deletedAt: new Date() } : {}),
        ...(status !== "TRASH" ? { deletedAt: null } : {}),
      },
    });

    await Promise.all(
      affectedProductIds.map((pid) => recalculateProductRating(pid))
    );

    await db.activityLog.create({
      data: {
        userId,
        action: "REVIEW_BULK_STATUS_CHANGED",
        entityType: "Review",
        entityId: ids[0],
        details: {
          reviewIds: ids,
          totalCount: ids.length,
          newStatus: status,
          affectedProducts: affectedProductIds,
          productRatingsRecalculated: true,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/admin/reviews");
    return {
      success: true,
      message: `${ids.length} review(s) marked as ${status.toLowerCase()}.`,
    };
  } catch (error) {
    console.error("BULK_UPDATE_REVIEW_STATUS_ERROR", error);
    return { success: false, error: "Failed to bulk update review status." };
  }
}

// ==========================================
// 6b. BULK RESTORE
// ==========================================

export async function bulkRestoreReviews(
  ids: string[]
): Promise<{ success: boolean; message?: string; error?: string }> {
  const userId = await getDbUserId();
  if (!userId) return { success: false, error: "Unauthorized access." };
  if (!ids.length) return { success: false, error: "No reviews selected." };

  try {
    await db.review.updateMany({
      where: { id: { in: ids }, status: ReviewStatus.TRASH },
      data: { status: ReviewStatus.PENDING, deletedAt: null },
    });

    await db.activityLog.create({
      data: {
        userId,
        action: "REVIEW_BULK_RESTORED",
        entityType: "Review",
        entityId: ids[0],
        details: { reviewIds: ids, totalCount: ids.length } as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/admin/reviews");
    return { success: true, message: `${ids.length} review(s) restored.` };
  } catch (error) {
    console.error("BULK_RESTORE_REVIEWS_ERROR", error);
    return { success: false, error: "Failed to bulk restore reviews." };
  }
}

// ==========================================
// 6c. BULK FORCE DELETE (PERMANENT)
// ==========================================

export async function bulkForceDeleteReviews(
  ids: string[]
): Promise<{ success: boolean; message?: string; error?: string }> {
  const userId = await getDbUserId();
  if (!userId) return { success: false, error: "Unauthorized access." };
  if (!ids.length) return { success: false, error: "No reviews selected." };

  const reviews = await db.review.findMany({
    where: { id: { in: ids } },
    select: { id: true, productId: true },
  });

  const affectedProductIds = [...new Set(reviews.map((r) => r.productId))];

  try {
    await db.review.deleteMany({ where: { id: { in: ids } } });

    await Promise.all(affectedProductIds.map((pid) => recalculateProductRating(pid)));

    await db.activityLog.create({
      data: {
        userId,
        action: "REVIEW_BULK_FORCE_DELETED",
        entityType: "Review",
        entityId: ids[0],
        details: {
          reviewIds: ids,
          totalCount: ids.length,
          affectedProducts: affectedProductIds,
          permanent: true,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/admin/reviews");
    return { success: true, message: `${ids.length} review(s) permanently deleted.` };
  } catch (error) {
    console.error("BULK_FORCE_DELETE_REVIEWS_ERROR", error);
    return { success: false, error: "Failed to permanently delete reviews." };
  }
}

// ==========================================
// 7. SOFT DELETE (MOVE TO TRASH)
// ==========================================

export async function deleteReview(
  id: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const userId = await getDbUserId();
  if (!userId) return { success: false, error: "Unauthorized access." };

  const review = await db.review.findUnique({
    where: { id },
    select: { productId: true, status: true, rating: true },
  });

  if (!review) return { success: false, error: "Review not found." };

  try {
    await db.review.update({
      where: { id },
      data: { status: ReviewStatus.TRASH, deletedAt: new Date() },
    });

    await recalculateProductRating(review.productId);

    await db.activityLog.create({
      data: {
        userId,
        action: "REVIEW_SOFT_DELETED",
        entityType: "Review",
        entityId: id,
        details: {
          productId: review.productId,
          previousStatus: review.status,
          rating: review.rating,
          productRatingRecalculated: true,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/admin/reviews");
    return { success: true, message: "Review moved to trash." };
  } catch (error) {
    console.error("DELETE_REVIEW_ERROR", error);
    return { success: false, error: "Failed to move review to trash." };
  }
}

// ==========================================
// 8. RESTORE REVIEW
// ==========================================

export async function restoreReview(
  id: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const userId = await getDbUserId();
  if (!userId) return { success: false, error: "Unauthorized access." };

  const review = await db.review.findUnique({
    where: { id },
    select: { productId: true, status: true },
  });

  if (!review) return { success: false, error: "Review not found." };
  if (review.status !== ReviewStatus.TRASH) {
    return { success: false, error: "Review is not in trash." };
  }

  try {
    await db.review.update({
      where: { id },
      data: { status: ReviewStatus.PENDING, deletedAt: null },
    });

    await db.activityLog.create({
      data: {
        userId,
        action: "REVIEW_RESTORED",
        entityType: "Review",
        entityId: id,
        details: {
          productId: review.productId,
          restoredToStatus: ReviewStatus.PENDING,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/admin/reviews");
    return { success: true, message: "Review restored from trash." };
  } catch (error) {
    console.error("RESTORE_REVIEW_ERROR", error);
    return { success: false, error: "Failed to restore review." };
  }
}

// ==========================================
// 9. FORCE DELETE (PERMANENT)
// ==========================================

export async function forceDeleteReview(
  id: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const userId = await getDbUserId();
  if (!userId) return { success: false, error: "Unauthorized access." };

  const review = await db.review.findUnique({
    where: { id },
    select: { productId: true, status: true, rating: true },
  });

  if (!review) return { success: false, error: "Review not found." };

  try {
    await db.review.delete({ where: { id } });

    await recalculateProductRating(review.productId);

    await db.activityLog.create({
      data: {
        userId,
        action: "REVIEW_FORCE_DELETED",
        entityType: "Review",
        entityId: id,
        details: {
          productId: review.productId,
          previousStatus: review.status,
          rating: review.rating,
          permanent: true,
          productRatingRecalculated: true,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/admin/reviews");
    return { success: true, message: "Review permanently deleted." };
  } catch (error) {
    console.error("FORCE_DELETE_REVIEW_ERROR", error);
    return { success: false, error: "Failed to permanently delete review." };
  }
}
