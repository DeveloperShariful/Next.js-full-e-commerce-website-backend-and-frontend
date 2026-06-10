//File Path: app/(backend)/admin/marketing/merchant-center/_components/MainDashboard.tsx

"use client";

import { useState, useTransition } from "react";
import { disconnectGoogleAccount } from "@/app/actions/backend/marketing/gmc-auth.actions";
import OnboardingWizard from "./OnboardingWizard";
import TabDashboard from "./TabDashboard";
import TabProductFeed from "./TabProductFeed";
import TabAttributes from "./TabAttributes";
import TabSettings from "./TabSettings";
import TabReports from "./TabReports"; // 🚀 নতুন Reports ট্যাব ইম্পোর্ট করা হয়েছে

interface Props {
  config: any;
  currentStep: number;
  searchParams: { status?: string; message?: string };
  dbStats: {
    totalStoreViews: number;
    syncedCount: number;
    failedCount: number;
    totalProductsCount: number;
    syncLogs: any[];
  };
}

export default function MainDashboard({ config, currentStep, searchParams, dbStats }: Props) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  const showNotice = searchParams.status && searchParams.message;

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "reports", label: "Reports" },
    { id: "product-feed", label: "Product Feed" },
    { id: "attributes", label: "Attributes" },
    { id: "settings", label: "Settings" },
  ];

  const handleDisconnect = () => {
    if (!confirm("Are you sure? This will disconnect your account.")) return;
    startTransition(async () => {
      const res = await disconnectGoogleAccount();
      if (!res.success) alert(res.error);
    });
  };

  return (
    // 🚀 RESPONSIVE WRAPPER
    <div className="w-full min-h-screen bg-[#f0f0f1] text-[#3c434a] font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,Oxygen-Sans,Ubuntu,Cantarell,'Helvetica_Neue',sans-serif] p-0 m-0 pb-10">
      
      {/* WordPress Style Top Header */}
      <div className="bg-white border-b border-[#ccd0d4] pt-4 px-4 sm:px-6 m-0 mb-6 w-full">
        <h1 className="text-[23px] font-bold text-[#1d2327] m-0 mb-5">Google Merchant Center</h1>
        
        {currentStep === 4 && (
          <div className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none whitespace-nowrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)} 
                className={`pb-3 text-[14px] font-semibold border-b-4 bg-transparent outline-none cursor-pointer transition-colors ${
                  activeTab === tab.id 
                    ? "border-[#2271b1] text-[#1d2327]" 
                    : "border-transparent text-[#50575e] hover:text-[#2271b1]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 🚀 DYNAMIC CONTENT CONTAINER */}
      <div className="w-full ">
        
        {/* Notices */}
        {showNotice && searchParams.status === "success" && (
          <div className="bg-white border-l-4 border-[#00a32a] shadow-sm p-3 mb-5 mx-0">
            <p className="text-[13px] m-0"><strong>Success:</strong> {decodeURIComponent(searchParams.message || "")}</p>
          </div>
        )}

        {/* Content rendering */}
        {currentStep < 4 ? (
          <OnboardingWizard currentStep={currentStep} config={config} />
        ) : (
          <div className="mt-2 w-full p-0 m-0">
            {activeTab === "dashboard" && (
              <TabDashboard 
                config={config} 
                totalStoreViews={dbStats.totalStoreViews}
                syncedCount={dbStats.syncedCount}
                failedCount={dbStats.failedCount}
              />
            )}
            
            {/* 🚀 NEW: Reports Tab */}
            {activeTab === "reports" && <TabReports />}
            
            {activeTab === "product-feed" && (
              <TabProductFeed 
                syncLogs={dbStats.syncLogs} 
                totalProducts={dbStats.totalProductsCount} 
              />
            )}
            
            {activeTab === "attributes" && <TabAttributes />}
            
            {activeTab === "settings" && (
              <TabSettings config={config} onDisconnect={handleDisconnect} isPending={isPending} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}