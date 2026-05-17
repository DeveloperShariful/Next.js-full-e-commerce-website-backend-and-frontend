// app/actions/storefront/home/getHomePageReviewsAction.ts
"use server";

import { db } from "@/lib/prisma";

export async function getHomePageReviewsAction() {
  try {
    // ১. সম্পূর্ণ ডায়নামিক Summary ক্যালকুলেশনের জন্য সব Approved রিভিউ আনা হচ্ছে
    const allApprovedReviews = await db.review.findMany({
      where: {
        status: "APPROVED",
        deletedAt: null,
      },
      select: {
        rating: true,
      },
    });

    const reviewCount = allApprovedReviews.length;
    
    // এভারেজ রেটিং ক্যালকুলেশন (0.0 ফরম্যাটে)
    const totalRating = allApprovedReviews.reduce((acc, curr) => acc + curr.rating, 0);
    const averageRating = reviewCount > 0 ? Number((totalRating / reviewCount).toFixed(1)) : 0;

    // কোন রেটিং কতজন দিয়েছে তার ডায়নামিক কাউন্ট (5 star, 4 star...)
    const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
      rating: star,
      count: allApprovedReviews.filter((r) => r.rating === star).length,
    }));

    // ২. UI তে দেখানোর জন্য লেটেস্ট ১০ টি রিভিউ ফেচ করা হচ্ছে 
    const latestReviews = await db.review.findMany({
      where: {
        status: "APPROVED",
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10, // আপনি চাইলে লিমিট বাড়াতে বা কমাতে পারেন
      include: {
        user: {
          select: { name: true }, // রিভিউয়ারের নাম
        },
        product: {
          select: { name: true, slug: true, featuredImage: true }, // প্রোডাক্টের ইনফরমেশন
        },
      },
    });

    // ৩. WordPress এর API রেসপন্সের মতো করে ডেটা ম্যাপ করা
    const mappedReviews = latestReviews.map((review) => {
      // স্কিমার images: String[] থেকে ডায়নামিকভাবে মিডিয়া টাইপ (image/video) বের করা
      const reviewMedia = (review.images || []).map((url) => {
        // ভিডিও ফরম্যাট চেক করা (mp4, webm, ogg ইত্যাদি)
        const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i);
        return {
          url: url,
          type: isVideo ? "video" : "image",
        };
      });

      return {
        id: review.id, // Prisma UUID 
        reviewer: review.user?.name || "Verified Customer",
        review: review.content || "",
        rating: review.rating,
        date: review.createdAt.toISOString(),
        product_name: review.product?.name || "GoBike",
        product_permalink: `/${review.product?.slug}`, 
        product_image: review.product?.featuredImage || "",
        review_media: reviewMedia, 
      };
    });

    // হুবহু আগের API এর মত স্ট্রাকচারে রিটার্ন করা হলো
    return {
      success: true,
      data: {
        summary: {
          review_count: reviewCount,
          average_rating: averageRating,
          rating_counts: ratingCounts,
        },
        reviews: mappedReviews,
      },
    };
  } catch (error) {
    console.error("[getHomePageReviewsAction] Error fetching reviews:", error);
    return {
      success: false,
      data: null,
      error: "Failed to fetch homepage reviews",
    };
  }
}