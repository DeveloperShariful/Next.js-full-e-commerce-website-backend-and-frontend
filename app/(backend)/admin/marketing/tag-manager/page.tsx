//app/(backend)/admin/marketing/tag-manager/page.tsx

import { db } from "@/lib/prisma";
import GtmDashboard from "./_components/GtmDashboard";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Google Tag Manager | WooCommerce Style",
};

export default async function GtmPage() {

  const config = await db.marketingIntegration.findUnique({
    where: { id: "marketing_config" },
    select: {
      googleAccountId: true,
      googleAccountImage: true,
      gtmContainerId: true,
      gtmEnabled: true,
    }
  }) || { googleAccountId: null, googleAccountImage: null, gtmContainerId: null, gtmEnabled: false };

  const sanitizedConfig = JSON.parse(JSON.stringify(config));

  return <GtmDashboard config={sanitizedConfig} />;
}