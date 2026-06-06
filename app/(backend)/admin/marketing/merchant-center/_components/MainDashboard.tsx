//File Path: app/(backend)/admin/marketing/merchant-center/_components/MainDashboard.tsx

"use client";

import { useTransition, useState } from "react";
import { disconnectGoogleAccount } from "@/app/actions/backend/merchant-center/gmc-auth.actions";
import GmcSettingsForm from "./GmcSettingsForm";
// 🔥 উইজার্ডের Step 3 টাই আমরা ড্যাশবোর্ডে রিইউজ করবো (এডিট করার জন্য)
import Step3AttributeMapping from "./Step3AttributeMapping"; 
import Link from "next/link";

interface Props {
  config: any;
}

export default function MainDashboard({ config }: Props) {
  const [isPending, startTransition] = useTransition();
  // 🔥 নতুন স্টেট: ড্যাশবোর্ডে কোন ট্যাব ওপেন থাকবে
  const [activeTab, setActiveTab] = useState<"settings" | "mapping">("settings");

  const handleDisconnect = () => {
    if (!confirm("Are you sure? This will stop all automatic product syncing to Google.")) return;
    
    startTransition(async () => {
      const result = await disconnectGoogleAccount();
      if (!result.success) {
        alert(result.error);
      }
    });
  };

  return (
    <div>
      {/* WordPress Style Tabs (Main Navigation) */}
      <div className="flex border-b border-[#ccd0d4] mb-5">
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 text-[14px] font-semibold border border-b-0 rounded-t-[3px] mr-2 transition-colors ${
            activeTab === "settings" 
              ? "bg-white border-[#ccd0d4] text-[#1d2327] relative top-[1px]" 
              : "bg-transparent border-transparent text-[#2271b1] hover:text-[#135e96]"
          }`}
        >
          General Settings
        </button>
        <button
          onClick={() => setActiveTab("mapping")}
          className={`px-4 py-2 text-[14px] font-semibold border border-b-0 rounded-t-[3px] transition-colors ${
            activeTab === "mapping" 
              ? "bg-white border-[#ccd0d4] text-[#1d2327] relative top-[1px]" 
              : "bg-transparent border-transparent text-[#2271b1] hover:text-[#135e96]"
          }`}
        >
          Attribute Mapping
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Dynamic Content based on Tab */}
        <div className="lg:col-span-8">
          
          {/* TAB 1: General Settings */}
          {activeTab === "settings" && (
            <div className="bg-white border border-[#ccd0d4] rounded-none shadow-none mb-5">
              <h2 className="text-[14px] font-semibold text-[#1d2327] border-b border-[#ccd0d4] px-4 py-3 m-0">
                Sync Settings
              </h2>
              <div className="p-4">
                <GmcSettingsForm initialData={config} disabled={false} />
              </div>
            </div>
          )}

          {/* TAB 2: Editable Mapping Component */}
          {activeTab === "mapping" && (
            <div className="bg-white border border-[#ccd0d4] rounded-none shadow-none mb-5">
              <h2 className="text-[14px] font-semibold text-[#1d2327] border-b border-[#ccd0d4] px-4 py-3 m-0">
                Edit Attribute Mapping
              </h2>
              <div className="p-0">
                {/* 
                  🔥 Magic: উইজার্ডের Step 3 কম্পোনেন্টটি আমরা এখানে সরাসরি কল করে দিয়েছি।
                  যেহেতু এটি ডাটাবেস থেকে ফেচ করে ডাটা দেখায়, তাই আপনার আগের সেভ করা সব ডাটা এখানে চলে আসবে।
                  এবং এখান থেকে সেভ করলে ডাটাবেস আপডেট হয়ে যাবে!
                */}
                <Step3AttributeMapping />
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Connection Overview & Actions (Always Visible) */}
        <div className="lg:col-span-4">
          
          {/* Connection Status Card */}
          <div className="bg-white border border-[#ccd0d4] mb-5">
            <h2 className="text-[14px] font-semibold text-[#1d2327] border-b border-[#ccd0d4] px-4 py-3 m-0">
              Google Connection
            </h2>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 bg-[#00a32a] rounded-full inline-block"></span>
                <p className="text-[13px] m-0 text-[#3c434a]">
                  Connected as <strong>{config.googleAccountId}</strong>
                </p>
              </div>
              
              <div className="bg-[#f0f0f1] border border-[#ccd0d4] p-3 rounded-[3px] mb-4">
                <p className="text-[12px] text-[#646970] m-0 mb-1">Merchant Center ID:</p>
                <p className="text-[14px] font-semibold text-[#1d2327] m-0">{config.gmcMerchantId}</p>
                
                {config.gmcDomainClaimed && (
                  <p className="text-[12px] text-[#00a32a] m-0 mt-2 font-semibold">✓ Domain Verified & Claimed</p>
                )}
              </div>

              <button
                onClick={handleDisconnect}
                disabled={isPending}
                className="text-[#d63638] hover:text-[#b32d2e] text-[13px] underline bg-transparent border-none p-0 cursor-pointer disabled:opacity-50"
              >
                {isPending ? "Disconnecting..." : "Disconnect Google Account"}
              </button>
            </div>
          </div>

          {/* Quick Links Card */}
          <div className="bg-white border border-[#ccd0d4]">
            <h2 className="text-[14px] font-semibold text-[#1d2327] border-b border-[#ccd0d4] px-4 py-3 m-0">
              Quick Actions
            </h2>
            <div className="p-4 flex flex-col gap-3 text-[13px]">
              <Link href="/admin/marketing/merchant-center/sync-logs" className="text-[#2271b1] hover:underline">
                View Product Sync Logs &rarr;
              </Link>
              <a href="https://merchants.google.com/" target="_blank" className="text-[#2271b1] hover:underline">
                Open Google Merchant Center &rarr;
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}