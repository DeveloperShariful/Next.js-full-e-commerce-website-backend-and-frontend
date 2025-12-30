// app/actions/review.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- TYPES ---
export interface ReviewData {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  status: string; // "pending", "approved", "rejected"
  createdAt: Date;
  user: { name: string | null; email: string; image: string | null } | null;
  product: { name: string; slug: string; image: string | null } | null;
}

// --- 1. GET REVIEWS ---
export async function getReviews(status?: string) {
  try {
    const whereCondition = status && status !== 'all' ? { status } : {};

    const reviews = await db.review.findMany({
      where: whereCondition,
      include: {
        user: { select: { name: true, email: true, image: true } },
        product: { select: { name: true, slug: true, featuredImage: true, images: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedReviews: ReviewData[] = reviews.map(r => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      content: r.content,
      status: r.status,
      createdAt: r.createdAt,
      user: r.user,
      product: r.product ? {
        name: r.product.name,
        slug: r.product.slug,
        image: r.product.featuredImage || (r.product.images.length > 0 ? r.product.images[0].url : null)
      } : null
    }));

    return { success: true, data: formattedReviews };

  } catch (error) {
    console.error("GET_REVIEWS_ERROR", error);
    return { success: false, data: [] };
  }
}

// --- 2. UPDATE STATUS (Approve/Reject) ---
export async function updateReviewStatus(id: string, status: string) {
  try {
    await db.review.update({
      where: { id },
      data: { status }
    });
    revalidatePath("/admin/reviews");
    return { success: true, message: `Review marked as ${status}` };
  } catch (error) {
    return { success: false, error: "Update failed" };
  }
}

// --- 3. DELETE REVIEW ---
export async function deleteReview(id: string) {
  try {
    await db.review.delete({ where: { id } });
    revalidatePath("/admin/reviews");
    return { success: true, message: "Review deleted" };
  } catch (error) {
    return { success: false, error: "Delete failed" };
  }
}