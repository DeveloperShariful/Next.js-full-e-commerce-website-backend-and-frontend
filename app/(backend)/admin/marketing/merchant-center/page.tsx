// File: app/(backend)/admin/marketing/merchant-center/page.tsx

import { db } from "@/lib/prisma";
import MainDashboard from "./_components/MainDashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Google Listings & Ads | WooCommerce Style",
};

export default async function MerchantCenterPage({
  searchParams,
}: {
  searchParams: { status?: string; message?: string; tab?: string };
}) {
  // ====================================================================
  // 🚀 FETCHING ALL DATABASE DATA AT ONCE ON SERVER SIDE
  // ====================================================================
  
  // ১. মার্কেটিং সেটিংস আনা
  const config = await db.marketingIntegration.findUnique({
    where: { id: "marketing_config" },
  }) || { googleRefreshToken: null, gmcSetupStep: 0 };

  let currentStep = config.gmcSetupStep || 0;
  if (!config.googleRefreshToken && currentStep > 0) {
    currentStep = 0; 
  }

  // ২. প্রোডাক্টের টোটাল ভিউ কাউন্ট
  const productsViews = await db.product.aggregate({
    _sum: { viewCount: true },
    where: { deletedAt: null }
  });
  const totalStoreViews = productsViews._sum.viewCount || 0;

  // ৩. সিঙ্ক হওয়া প্রোডাক্টের সংখ্যা
  const syncedCount = await db.productChannelStatus.count({
    where: { channel: "GOOGLE", status: "SYNCED" }
  });

  // ৪. ফেইল হওয়া প্রোডাক্টের সংখ্যা
  const failedCount = await db.productChannelStatus.count({
    where: { channel: "GOOGLE", status: "FAILED" }
  });

  // ৫. টোটাল একটিভ প্রোডাক্ট সংখ্যা
  const totalProductsCount = await db.product.count({
    where: { deletedAt: null, status: "ACTIVE" }
  });

  // ৬. গুগল সিঙ্ক লগের লিস্ট
  const rawSyncLogs = await db.productChannelStatus.findMany({
    where: { channel: "GOOGLE" },
    include: {
      product: {
        select: { id: true, name: true, slug: true, featuredImage: true, sku: true }
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  // ডাটা সিরিয়ালাইজ করা (যাতে ক্লায়েন্ট সাইডে কোনো ডেট বা ডেসিমেল এরর না আসে)
  const syncLogs = JSON.parse(JSON.stringify(rawSyncLogs));

  return (
    <MainDashboard 
      config={config} 
      currentStep={currentStep}
      searchParams={searchParams}
      // 🚀 এই রিয়েল-টাইম ডাটাগুলো প্রপস হিসেবে চলে যাচ্ছে
      dbStats={{
        totalStoreViews,
        syncedCount,
        failedCount,
        totalProductsCount,
        syncLogs
      }}
    />
  );
}