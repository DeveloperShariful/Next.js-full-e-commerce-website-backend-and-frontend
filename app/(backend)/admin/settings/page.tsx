// File: app/(backend)/admin/settings/page.tsx

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

// ট্যাব কম্পোনেন্ট ইমপোর্ট
import GeneralTab from "./_components/GeneralTab";
import ShippingTab from "./_components/ShippingTab";
import PaymentsTab from "./_components/PaymentsTab";
import EmailTab from "./_components/EmailTab";

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "general";

  const tabs = [
    { id: "general", label: "General" },
    { id: "shipping", label: "Shipping" },
    { id: "payments", label: "Payments" },
    { id: "email", label: "Emails" },
  ];

  const handleTabChange = (tabId: string) => {
    router.push(`/admin/settings?tab=${tabId}`);
  };

  return (
    <div 
      className="w-full bg-[#f0f0f1] min-h-screen text-[#3c434a] antialiased pb-20"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif'
      }}
    >
      {/* WordPress Admin Settings Header */}
      <div className=" w-full">
        <h1 className="text-[23px] font-normal text-[#1d2327] m-0  leading-tight">
          Settings
        </h1>
        
        {/* WooCommerce Navigation Tabs */}
        <nav className="flex flex-wrap gap-[4px] -mb-[1px]">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`text-[14px] px-[15px] pb-[12px] pt-[6px] font-semibold transition-all duration-150 border-b-2 outline-none ${
                  isActive
                    ? "border-[#2271b1] text-[#000] font-bold"
                    : "border-transparent text-[#2271b1] hover:text-[#135e96]"
                }`}
                style={{
                  lineHeight: '1.71428571'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Render Area (কোনো max-w বা mx-auto নেই, এটি স্ক্রিনের শেষ মাথা পর্যন্ত ১০০% ছড়াবে) */}
      <div className="w-full ">
        <div className="animate-in fade-in duration-150 w-full">
          {activeTab === "general" && <GeneralTab />}
          {activeTab === "shipping" && <ShippingTab />}
          {activeTab === "payments" && <PaymentsTab />}
          {activeTab === "email" && <EmailTab />}
        </div>
      </div>
    </div>
  );
}

export default function SettingsDashboard() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full flex items-center justify-center bg-[#f0f0f1]">
          <Loader2 className="animate-spin text-[#2271b1]" size={36} />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}