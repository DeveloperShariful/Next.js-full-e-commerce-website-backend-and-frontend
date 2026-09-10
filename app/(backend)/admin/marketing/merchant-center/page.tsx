// File: app/(backend)/admin/marketing/merchant-center/page.tsx

import { Suspense } from "react";
import { db } from "@/lib/prisma";
import MainDashboard from "./_components/MainDashboard";

export const dynamic = "force-dynamic";
// bulk GMC sync (Server Action) এই route segment-এ চলে — VARIABLE product-এর
// variant-প্রতি Google API call হয় বলে প্রতিটা chunk-এ কিছুটা সময় লাগে, তাই
// default (~15s)-এর বদলে বেশি headroom দরকার।
export const maxDuration = 60;

export const metadata = {
  title: "Google Listings & Ads",
};

export default async function MerchantCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; message?: string; tab?: string; action?: string }>;
}) {
  // Next.js 15 — searchParams is async, must be awaited
  const resolvedParams = await searchParams;

  const [config, productsViews, syncedCount, failedCount, pendingCount, totalProductsCount, rawProducts] =
    await Promise.all([
      db.marketingIntegration.findUnique({ where: { id: "marketing_config" } }),
      db.product.aggregate({ _sum: { viewCount: true }, where: { deletedAt: null } }),
      db.productChannelStatus.count({ where: { channel: "GOOGLE", status: "SYNCED" } }),
      db.productChannelStatus.count({ where: { channel: "GOOGLE", status: "FAILED" } }),
      db.productChannelStatus.count({ where: { channel: "GOOGLE", status: "PENDING" } }),
      db.product.count({ where: { deletedAt: null, status: "ACTIVE" } }),
      db.product.findMany({
        where: { deletedAt: null, status: "ACTIVE" },
        include: {
          categories: { select: { id: true, name: true } },
          channelStatuses: { where: { channel: "GOOGLE" } },
          // VARIABLE product-এর প্রতিটা variant Google-এ আলাদা item — feed item
          // সংখ্যা মেলাতে live variant count লাগে।
          variants: { where: { deletedAt: null }, select: { id: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

  const safeConfig = config || { googleRefreshToken: null, gmcSetupStep: 0 };

  let currentStep = safeConfig.gmcSetupStep || 0;
  if (!safeConfig.googleRefreshToken && currentStep > 0) {
    currentStep = 0;
  }

  const formattedSyncLogs = rawProducts.map((p) => {
    const gmcStatus = p.channelStatuses[0] || null;
    return {
      id: gmcStatus?.id || `temp_${p.id}`,
      status: gmcStatus ? gmcStatus.status : "PENDING",
      errorMessage: gmcStatus ? gmcStatus.errorMessage : null,
      googleIssues: gmcStatus ? gmcStatus.googleIssues : null,
      lastSyncedAt: gmcStatus ? gmcStatus.lastSyncedAt : null,
      product: {
        id: p.id,
        name: p.name,
        slug: p.slug,
        featuredImage: p.featuredImage,
        sku: p.sku,
        productType: p.productType,
        // VARIABLE হলে Google-এ কতগুলো আলাদা item যায় (প্রতি live variant = ১টা)
        variantCount: p.productType === "VARIABLE" ? p.variants.length : 0,
      },
    };
  });

  const syncLogs = JSON.parse(JSON.stringify(formattedSyncLogs));

  return (
    <Suspense fallback={null}>
      <MainDashboard
        config={safeConfig}
        currentStep={currentStep}
        searchParams={resolvedParams}
        dbStats={{
          totalStoreViews: productsViews._sum.viewCount || 0,
          syncedCount,
          failedCount,
          pendingCount,
          totalProductsCount,
          syncLogs,
        }}
      />
    </Suspense>
  );
}
