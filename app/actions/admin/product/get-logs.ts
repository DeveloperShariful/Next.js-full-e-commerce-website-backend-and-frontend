"use server";

import { db } from "@/lib/prisma";
import { cleanupOldLogs } from "./delete-log"; 

// 🔥 UPDATE: Pagination এবং Filter প্যারামিটার যোগ করা হয়েছে
export async function getProductActivityLogs(page = 1, limit = 20, actionFilter?: string) {
  try {
    // ব্যাকগ্রাউন্ড ক্লিনআপ (শুধু ১ম পেজে লোড হলে রান হবে)
    if (page === 1) {
        // cleanupOldLogs ফাংশনটি যদি async হয়, তাহলে catch ব্লক রাখা ভালো
        cleanupOldLogs().catch(err => console.error("Cleanup bg error", err));
    }

    const skip = (page - 1) * limit;

    // ফিল্টার কন্ডিশন তৈরি
    const whereCondition: any = {
        entityType: "Product",
    };

    if (actionFilter) {
        whereCondition.action = actionFilter;
    }

    // ডাটা এবং টোটাল কাউন্ট একসাথে আনা (Parallel Fetching)
    const [logs, total] = await Promise.all([
        db.activityLog.findMany({
            where: whereCondition,
            orderBy: { createdAt: "desc" },
            take: limit,
            skip: skip,
            include: {
                user: {
                    select: { name: true, email: true, image: true }
                }
            }
        }),
        db.activityLog.count({ where: whereCondition })
    ]);

    // আরো ডাটা আছে কি না চেক করা
    const hasMore = skip + logs.length < total;

    return { success: true, data: logs, hasMore, total };
  } catch (error) {
    console.error("LOG_FETCH_ERROR", error);
    // এরর হলে সেফ রিটার্ন
    return { success: false, data: [], hasMore: false, total: 0 };
  }
}