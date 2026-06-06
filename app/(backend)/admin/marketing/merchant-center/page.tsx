// File: app/(backend)/admin/marketing/merchant-center/page.tsx

import { db } from "@/lib/prisma";
import Link from "next/link";
// কম্পোনেন্টগুলো আমরা পরবর্তী ধাপে বানাবো
import OnboardingWizard from "./_components/OnboardingWizard";
import MainDashboard from "./_components/MainDashboard";

export const metadata = {
  title: "Google Merchant Center | Advanced Integration",
};

export default async function MerchantCenterSmartPage({
  searchParams,
}: {
  searchParams: { status?: string; message?: string };
}) {
  // ডাটাবেস থেকে কারেন্ট কনফিগারেশন আনা
  const config = await db.marketingIntegration.findUnique({
    where: { id: "marketing_config" },
  }) || {
    googleRefreshToken: null,
    gmcSetupStep: 0,
  };

  // Step Calculation
  // 0 = Not connected
  // 1 = Connected, waiting for account selection
  // 2 = Account selected, waiting for domain claim
  // 3 = Domain claimed, waiting for mapping/finish
  // 4 = Fully configured (Show Dashboard)
  
  let currentStep = config.gmcSetupStep || 0;
  
  // Security Check: টোকেন না থাকলে জোর করে Step 0 তে পাঠিয়ে দেওয়া
  if (!config.googleRefreshToken && currentStep > 0) {
    currentStep = 0; 
  }

  // URL এ গুগল থেকে ফেরত আসার কোনো নোটিফিকেশন থাকলে (WooCommerce Notice Style)
  const showNotice = searchParams.status && searchParams.message;

  return (
    <div className="min-h-screen bg-[#f0f0f1] text-[#3c434a] font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,Oxygen-Sans,Ubuntu,Cantarell,'Helvetica_Neue',sans-serif] p-4 sm:p-6">
      
      {/* WordPress Style Page Header */}
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-[23px] font-normal text-[#1d2327]">Google for WooCommerce / Shop</h1>
        {currentStep === 4 && (
          <Link 
            href="/admin/marketing/merchant-center/sync-logs" 
            className="border border-[#2271b1] text-[#2271b1] hover:bg-[#f6f7f7] px-2 py-[3px] rounded-[3px] text-[13px] font-semibold transition-colors"
          >
            Diagnostics & Logs
          </Link>
        )}
      </div>

      {/* WordPress Style Notices */}
      {showNotice && searchParams.status === "success" && (
        <div className="bg-white border-l-4 border-[#00a32a] shadow-sm p-3 mb-5 flex items-center">
          <p className="text-[13px] m-0">
            <strong>Success:</strong> {decodeURIComponent(searchParams.message || "Action completed.")}
          </p>
        </div>
      )}

      {showNotice && searchParams.status === "error" && (
        <div className="bg-white border-l-4 border-[#d63638] shadow-sm p-3 mb-5 flex items-center">
          <p className="text-[13px] m-0">
            <strong>Error:</strong> {decodeURIComponent(searchParams.message || "An unknown error occurred.")}
          </p>
        </div>
      )}

      {/* 🚀 SMART RENDERING: 위저드(Wizard) 보일지 대시보드(Dashboard) 보일지 결정 */}
      {currentStep < 4 ? (
        // যদি সেটআপ শেষ না হয়, তবে Onboarding Wizard দেখাবে
        <OnboardingWizard currentStep={currentStep} config={config} />
      ) : (
        // সেটআপ শেষ হয়ে গেলে Main Dashboard দেখাবে
        <MainDashboard config={config} />
      )}

    </div>
  );
}