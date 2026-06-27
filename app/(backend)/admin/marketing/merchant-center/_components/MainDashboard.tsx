//File Path: app/(backend)/admin/marketing/merchant-center/_components/MainDashboard.tsx

"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { disconnectGoogleAccount } from "@/app/actions/backend/marketing/gmc-auth.actions";
import OnboardingWizard from "./OnboardingWizard";
import TabDashboard from "./TabDashboard";
import TabProductFeed from "./TabProductFeed";
import TabAttributes from "./TabAttributes";
import TabSettings from "./TabSettings";
import TabReports from "./TabReports";

interface GmcConfig {
  googleRefreshToken?: string | null;
  gmcSetupStep?: number | null;
  gmcMerchantId?: string | null;
  gmcMerchantName?: string | null;
  gmcDomainClaimed?: boolean | null;
  gmcContentApiEnabled?: boolean | null;
  [key: string]: unknown;
}

interface SyncLogEntry {
  id: string;
  status: "SYNCED" | "FAILED" | "PENDING" | "EXCLUDED";
  errorMessage: string | null;
  googleIssues: unknown;
  lastSyncedAt: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
    featuredImage: string | null;
    sku: string | null;
  };
}

const VALID_TABS = ["dashboard", "reports", "product-feed", "attributes", "settings"] as const;
type TabId = (typeof VALID_TABS)[number];

function resolveTab(tab: string | null | undefined): TabId {
  if (tab && (VALID_TABS as readonly string[]).includes(tab)) return tab as TabId;
  return "dashboard";
}

interface Props {
  config: GmcConfig;
  currentStep: number;
  searchParams: { status?: string; message?: string; tab?: string };
  dbStats: {
    totalStoreViews: number;
    syncedCount: number;
    failedCount: number;
    pendingCount: number;
    totalProductsCount: number;
    syncLogs: SyncLogEntry[];
  };
}

export default function MainDashboard({ config, currentStep, searchParams: serverParams, dbStats }: Props) {
  const router = useRouter();
  // useSearchParams() is reactive — updates immediately when URL changes (client-side navigation)
  const urlSearchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const activeTab = resolveTab(urlSearchParams.get("tab"));

  const showNotice = serverParams.status && serverParams.message;

  const tabs: { id: TabId; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "reports", label: "Reports" },
    { id: "product-feed", label: "Product Feed" },
    { id: "attributes", label: "Attributes" },
    { id: "settings", label: "Settings" },
  ];

  const handleTabChange = (tabId: TabId) => {
    router.push(`/admin/marketing/merchant-center?tab=${tabId}`);
  };

  const handleDisconnect = () => {
    if (!confirm("Are you sure? This will disconnect your account.")) return;
    startTransition(async () => {
      const res = await disconnectGoogleAccount();
      if (!res.success) alert(res.error);
    });
  };

  return (
    <div className="w-full min-h-screen bg-[#f0f0f1] text-[#3c434a] p-0 m-0 pb-10">

      {/* Top Header with Tab Nav */}
      <div className="bg-white border-b border-[#ccd0d4] pt-4 px-4 sm:px-6 m-0 mb-6 w-full">
        <h1 className="text-[23px] font-bold text-[#1d2327] m-0 mb-5">Google Merchant Center</h1>

        {currentStep === 4 && (
          <div className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none whitespace-nowrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
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

      {/* Content */}
      <div className="w-full">
        {showNotice && serverParams.status === "success" && (
          <div className="bg-white border-l-4 border-[#00a32a] shadow-sm p-3 mb-5 mx-0">
            <p className="text-[13px] m-0">
              <strong>Success:</strong> {decodeURIComponent(serverParams.message || "")}
            </p>
          </div>
        )}

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

            {activeTab === "reports" && <TabReports />}

            {activeTab === "product-feed" && (
              <TabProductFeed
                syncLogs={dbStats.syncLogs}
                totalProducts={dbStats.totalProductsCount}
              />
            )}

            {/* Always mounted — CSS hidden prevents unmount/remount on tab switch, so data loads only once */}
            <div className={activeTab === "attributes" ? "" : "hidden"}>
              <TabAttributes />
            </div>

            {activeTab === "settings" && (
              <TabSettings config={config} onDisconnect={handleDisconnect} isPending={isPending} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
