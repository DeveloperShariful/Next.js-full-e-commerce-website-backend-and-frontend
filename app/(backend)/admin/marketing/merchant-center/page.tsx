// File: app/(backend)/admin/marketing/merchant-center/page.tsx

import { db } from "@/lib/prisma";
import MainDashboard from "./_components/MainDashboard";
import { syncLiveProductStatuses } from "@/app/actions/backend/merchant-center/gmc-product-sync.actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Google Listings & Ads | WooCommerce Style",
};

export default async function MerchantCenterPage({
  searchParams,
}: {
  searchParams: { status?: string; message?: string; tab?: string };
}) {
  // ১. ড্যাশবোর্ড লোড হওয়ামাত্রই গুগলের সার্ভার থেকে আসল লাইভ স্ট্যাটাস ডাটাবেসে সিঙ্ক হবে
  try {
    await syncLiveProductStatuses();
  } catch (e) {
    console.error("Failed to run live status sync on page load:", e);
  }

  // ২. মার্কেটিং সেটিংস আনা
  const config = await db.marketingIntegration.findUnique({
    where: { id: "marketing_config" },
  }) || { googleRefreshToken: null, gmcSetupStep: 0 };

  let currentStep = config.gmcSetupStep || 0;
  if (!config.googleRefreshToken && currentStep > 0) {
    currentStep = 0; 
  }

  // ৩. প্রোডাক্টের টোটাল ভিউ কাউন্ট
  const productsViews = await db.product.aggregate({
    _sum: { viewCount: true },
    where: { deletedAt: null }
  });
  const totalStoreViews = productsViews._sum.viewCount || 0;

  // ৪. সিঙ্ক হওয়া প্রোডাক্টের সংখ্যা
  const syncedCount = await db.productChannelStatus.count({
    where: { channel: "GOOGLE", status: "SYNCED" }
  });

  // ৫. ফেইল হওয়া প্রোডাক্টের সংখ্যা
  const failedCount = await db.productChannelStatus.count({
    where: { channel: "GOOGLE", status: "FAILED" }
  });

  // ৬. টোটাল একটিভ প্রোডাক্ট সংখ্যা
  const totalProductsCount = await db.product.count({
    where: { deletedAt: null, status: "ACTIVE" }
  });

  // 🚀 ৭. NEW & DYNAMIC: ডাটাবেসের `Product` টেবিল থেকে সব একটিভ প্রোডাক্ট তুলে আনা হচ্ছে
  const rawProducts = await db.product.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
    include: {
      categories: { select: { id: true, name: true } },
      channelStatuses: {
        where: { channel: "GOOGLE" }
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  // 🚀 ৮. BACKWARD COMPATIBLE MAPPING: 
  // সব প্রোডাক্টকে এমনভাবে ফরম্যাট করা হচ্ছে যেন Unsynced প্রোডাক্টগুলো অটোমেটিক PENDING স্ট্যাটাস পেয়ে যায়
  // এবং আমাদের ফ্রন্টএন্ড টেবিলটি না ভেঙে ১০০% নিখুঁতভাবে কাজ করে।
  const formattedSyncLogs = rawProducts.map((p) => {
    const gmcStatus = p.channelStatuses[0] || null;

    return {
      id: gmcStatus?.id || `temp_${p.id}`, // ইউনিক আইডি
      status: gmcStatus ? gmcStatus.status : "PENDING", // না থাকলে PENDING
      errorMessage: gmcStatus ? gmcStatus.errorMessage : null,
      googleIssues: gmcStatus ? gmcStatus.googleIssues : null,
      lastSyncedAt: gmcStatus ? gmcStatus.lastSyncedAt : null,
      // প্রোডাক্টের বেসিক তথ্য
      product: {
        id: p.id,
        name: p.name,
        slug: p.slug,
        featuredImage: p.featuredImage,
        sku: p.sku
      }
    };
  });

  const syncLogs = JSON.parse(JSON.stringify(formattedSyncLogs));
  const activeTab = searchParams.tab || "dashboard";

  return (
    <MainDashboard 
      config={config} 
      currentStep={currentStep}
      searchParams={searchParams}
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