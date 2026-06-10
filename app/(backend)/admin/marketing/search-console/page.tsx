//app/(backend)/admin/marketing/search-console/page.tsx

import { db } from "@/lib/prisma";
import GscDashboard from "./_components/GscDashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Google Search Console & Indexing | WooCommerce Style",
};

export default async function SearchConsolePage() {
  // ১. সরাসরি সার্ভার সাইড থেকে ডাটাবেজ কনফিগ রিড করা
  const config = await db.marketingIntegration.findUnique({
    where: { id: "marketing_config" },
    select: {
      googleAccountId: true,
      googleAccountImage: true,
      gscVerificationCode: true,
      gscServiceAccountJson: true,
    }
  }) || { 
    googleAccountId: null, 
    googleAccountImage: null, 
    gscVerificationCode: "", 
    gscServiceAccountJson: "" 
  };

  const sanitizedConfig = JSON.parse(JSON.stringify(config));

  return <GscDashboard config={sanitizedConfig} />;
}