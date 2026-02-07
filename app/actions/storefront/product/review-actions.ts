// File: app/actions/storefront/product/review-actions.ts

"use server";

import { db } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function createReview(productId: string, data: any) {
  const user = await currentUser();
  if (!user) {
    return { success: false, message: "You must be logged in to leave a review." };
  }

  try {
    const email = user.emailAddresses[0]?.emailAddress;
    await db.user.upsert({
        where: { clerkId: user.id }, 
        update: {
            name: `${user.firstName} ${user.lastName}`,
            email: email,
            image: user.imageUrl,
        },
        create: {
            clerkId: user.id,
            email: email,
            name: `${user.firstName} ${user.lastName}`,
            image: user.imageUrl,
            role: "CUSTOMER" 
        }
    });

    const dbUser = await db.user.findUnique({
        where: { clerkId: user.id }
    });

    if (!dbUser) {
        return { success: false, message: "User synchronization failed." };
    }
    const existingReview = await db.review.findFirst({
      where: { 
        userId: dbUser.id, 
        productId 
      }
    });

    if (existingReview) {
      return { success: false, message: "You have already reviewed this product." };
    }

    await db.review.create({
      data: {
        userId: dbUser.id, 
        productId,
        rating: Number(data.rating),
        title: data.title,
        content: data.content,
        status: "pending", 
        images: data.images || [], 
      }
    });

    revalidatePath(`/product/${productId}`);
    return { success: true, message: "Review submitted! Waiting for approval." };

  } catch (error) {
    console.error("CREATE_REVIEW_ERROR", error);
    return { success: false, message: "Failed to submit review. Please try again." };
  }
}

export async function getProductReviews(productId: string) {
  try {
    const reviews = await db.review.findMany({
      where: { 
        productId,
        status: "approved" 
      },
      include: {
        user: {
          select: { name: true, image: true } 
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return reviews;
  } catch (error) {
    return [];
  }
}

export async function getReviewStats(productId: string) {
  try {
    const result = await db.review.groupBy({
      by: ['rating'],
      where: { productId, status: "approved" },
      _count: { rating: true },
    });

    const totalReviews = result.reduce((acc, curr) => acc + curr._count.rating, 0);
    
    const weightedSum = result.reduce((acc, curr) => acc + (curr.rating * curr._count.rating), 0);
    const average = totalReviews > 0 ? (weightedSum / totalReviews).toFixed(1) : 0;

    const breakdown = [5, 4, 3, 2, 1].map(star => {
      const count = result.find(r => r.rating === star)?._count.rating || 0;
      const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
      return { star, count, percentage };
    });

    return { totalReviews, average, breakdown };

  } catch (error) {
    return { totalReviews: 0, average: 0, breakdown: [] };
  }
}