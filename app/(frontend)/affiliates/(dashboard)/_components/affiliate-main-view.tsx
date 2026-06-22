//app/(frontend)/affiliates/_components/affiliate-main-view.tsx

"use client";

import { useState } from "react";
import {
  LayoutDashboard, Link as LinkIcon, Image as ImageIcon,
  Wallet, FileText, BarChart3, Settings, Menu, X, Ticket,
  Trophy, Network, LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

import DashboardOverview from "./dashboard-overview";
import LinkManager from "./link-manager";
import CouponManager from "./coupon-manager";
import PayoutManager from "./payout-manager";
import TransactionLedger from "./transaction-ledger";
import SettingsForm from "./settings-form";
import CreativeGallery from "./creative-gallery";
import ConversionReport from "./conversion-report";
import ContestsBonusesView from "./contests-bonuses-tier";
import { NotificationCenter } from "./notification-center";

interface Props {
  initialData: {
    profile: any;
    dashboard: any;
    marketing: any;
    creatives: any[];
    finance: any;
    ledger: any[];
    reports: any;
    settings: any;
    config: any;
  };
}

const NAV_ITEMS = [
  { id: "overview",         label: "Dashboard",       icon: LayoutDashboard },
  { id: "links",            label: "Marketing Links", icon: LinkIcon },
  { id: "coupons",          label: "Coupons",         icon: Ticket },
  { id: "contests-bonuses", label: "Contests",        icon: Trophy },
  { id: "creatives",        label: "Creatives",       icon: ImageIcon },
  { id: "payouts",          label: "Payouts",         icon: Wallet },
  { id: "ledger",           label: "Ledger",          icon: FileText },
  { id: "reports",          label: "Reports",         icon: BarChart3 },
  { id: "settings",         label: "Settings",        icon: Settings },
];

export default function AffiliateMainView({ initialData }: Props) {
  const [currentView, setCurrentView] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { profile, dashboard, marketing, creatives, finance, ledger, reports, settings } = initialData;

  const handleNav = (view: string) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  const currentLabel = NAV_ITEMS.find((i) => i.id === currentView)?.label || "Dashboard";

  const renderContent = () => {
    switch (currentView) {
      case "overview":
        return <DashboardOverview data={dashboard} userName={profile.name} userStatus={profile.status} />;
      case "links":
        return <LinkManager initialLinks={marketing.links} campaigns={marketing.campaigns} userId={profile.userId} defaultSlug={marketing.defaultSlug} baseUrl={marketing.baseUrl} paramName={marketing.paramName} />;
      case "coupons":
        return <CouponManager coupons={marketing.coupons || []} />;
      case "contests-bonuses":
        return <ContestsBonusesView tierData={dashboard.tierProgress} contests={dashboard.activeContests || []} bonuses={dashboard.activeRules || []} />;
      case "creatives":
        return <CreativeGallery creatives={creatives || []} />;
      case "payouts":
        return <PayoutManager data={finance} userId={profile.userId} />;
      case "ledger":
        return <TransactionLedger transactions={ledger || []} />;
      case "reports":
        return <ConversionReport conversions={reports?.conversions || []} currency={initialData.config.currency} />;
      case "settings":
        return <SettingsForm userId={profile.userId} initialData={settings} config={initialData.config} tierProgress={dashboard.tierProgress} activeRules={dashboard.activeRules} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#f0f0f1] text-[#1d2327] font-sans">

      {/* Sticky header — exact same dark style as my-account */}
      <div className="w-full bg-[#1d2327] border-b border-[#2c3338] h-12 px-4 flex justify-between items-center sticky top-0 z-20">
        <span className="font-semibold text-white flex items-center gap-2 text-[14px]">
          <Network className="w-4 h-4 text-[#72aee6]" />
          Partner Hub
          <span className="hidden lg:inline text-[#a7aaad] font-normal text-[13px]">
            / {currentLabel}
          </span>
        </span>
        <div className="flex items-center gap-3">
          <NotificationCenter />
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 text-[#c3c4c7] hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="hidden lg:block text-[13px] text-[#a7aaad]">
            {profile.name || "Partner"}
          </span>
        </div>
      </div>

      {/* Content area — relative so absolute sidebar works exactly like my-account */}
      <div className="relative flex-1 lg:flex lg:flex-row">

        {/* Backdrop — absolute within content area (below Partner Hub header), same as my-account */}
        {isMobileMenuOpen && (
          <div
            className="lg:hidden absolute inset-0 z-30 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar — absolute on mobile, sticky on desktop — exact my-account pattern */}
        <aside className={cn(
          "absolute top-0 left-0 z-40 w-[200px] bg-[#f6f7f7] border-r border-[#dcdcde] custom-scrollbar shadow-xl transform transition-transform duration-200",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          "lg:static lg:sticky lg:top-12 lg:h-[calc(100vh-3rem)] lg:overflow-y-auto lg:w-[180px] lg:shrink-0 lg:shadow-none lg:translate-x-0 lg:z-0"
        )}>

          {/* Mobile sidebar header — brand + close */}
          <div className="lg:hidden flex items-center justify-between px-4 h-12 border-b border-[#dcdcde]">
            <span className="text-[#1d2327] font-semibold text-[13px] flex items-center gap-2">
              <Network className="w-4 h-4 text-[#2271b1]" /> Partner Hub
            </span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 text-[#50575e] hover:text-[#1d2327] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav items */}
          <div className="space-y-0.5 py-2 pb-4">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={cn(
                    "flex items-center gap-3 w-full px-4 py-2 text-[13px] transition-colors group text-left",
                    isActive
                      ? "bg-[#2271b1] text-white font-semibold"
                      : "text-[#50575e] hover:text-[#1d2327] hover:bg-[#ebebeb]"
                  )}
                >
                  <Icon className={cn(
                    "w-4 h-4 shrink-0",
                    isActive ? "text-white" : "text-[#646970] group-hover:text-[#1d2327]"
                  )} />
                  {item.label}
                </button>
              );
            })}

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-3 w-full px-4 py-2 text-[13px] text-red-600 hover:text-red-700 hover:bg-[#ebebeb] transition-colors text-left"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Log Out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 bg-[#f0f0f1]">
          {currentView === "settings" ? (
            renderContent()
          ) : (
            <div className="p-4 md:p-6">
              <div className="max-w-[1000px] mx-auto">
                {renderContent()}
              </div>
            </div>
          )}
        </main>

      </div>
    </div>
  );
}
