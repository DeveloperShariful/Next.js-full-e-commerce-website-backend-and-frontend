//app/(backend)/admin/marketing/klaviyo/page.tsx

import { db } from "@/lib/prisma";
import KlaviyoDashboard from "./_components/KlaviyoDashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Klaviyo Marketing | WooCommerce Style",
};

export default async function KlaviyoPage() {
  // ১. সরাসরি সার্ভার সাইড থেকে Klaviyo কনফিগারেশন এবং প্রোফাইল রিড করা
  const config = await db.marketingIntegration.findUnique({
    where: { id: "marketing_config" },
    select: {
      googleAccountId: true,
      googleAccountImage: true,
      klaviyoEnabled: true,
      klaviyoPublicKey: true,
      klaviyoPrivateKey: true,
      klaviyoListIds: true,
    }
  }) || { 
    googleAccountId: null, 
    googleAccountImage: null, 
    klaviyoEnabled: false, 
    klaviyoPublicKey: "", 
    klaviyoPrivateKey: "", 
    klaviyoListIds: null 
  };

  const listIds = config.klaviyoListIds as Record<string, any> | null;
  const selectedListId = listIds?.newsletter || "";

  // ক্লায়েন্ট কম্পোনেন্টে পাঠানোর জন্য ডাটা সিরিয়ালাইজ করা
  const sanitizedConfig = JSON.parse(JSON.stringify({
    ...config,
    selectedListId
  }));

  return <KlaviyoDashboard config={sanitizedConfig} />;
}