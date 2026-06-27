// File: app/(backend)/admin/marketing/merchant-center/page.tsx

import { Suspense } from "react";
import { db } from "@/lib/prisma";
import MainDashboard from "./_components/MainDashboard";

export const dynamic = "force-dynamic";

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
