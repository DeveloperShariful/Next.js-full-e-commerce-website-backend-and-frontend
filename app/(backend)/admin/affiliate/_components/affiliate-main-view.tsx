// File: app/(backend)/admin/affiliate/_components/affiliate-main-view.tsx

"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard, CreditCard, Settings, Trophy, Calculator,
  Image as ImageIcon, Network, ShieldAlert,
  Megaphone, Package, ShieldCheck, Menu, X, Loader2, Ticket,
  Users, Terminal, ChevronDown, ChevronLeft, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationCenter } from "./notification-center";
import AnalyticsDashboard from "./analytics-dashboard";
import PartnersManager from "./Management/partners-manager";
import FinanceManager from "./Management/finance-manager";
import KycManager from "./Management/kyc-manager";
import CreativeList from "./Marketing/creative-manager";
import CampaignsContestsManager from "./Marketing/campaigns-contests-manager";
import CouponTagManager from "./Marketing/coupon-tag-manager";
import AnnouncementManager from "./Marketing/announcement-manager";
import FraudRuleManager from "./Configuration/fraud-rule-manager";
import TierList from "./Configuration/tier-manager";
import RuleList from "./Configuration/commission-rule-management";
import ProductRateManager from "./Configuration/product-rate-manager";
import AffiliateGeneralConfigForm from "./Configuration/general-config-manager";
import LogViewer from "./log-viewer";

interface SidebarCounts {
  payouts?: number;
  kyc?: number;
  fraud?: number;
}

interface Props {
  initialData: any;
  currentView: string;
  counts?: SidebarCounts;
}

export default function AffiliateMainView({ initialData, currentView, counts }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState(currentView);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  function toggleSection(section: string) {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      next.has(section) ? next.delete(section) : next.add(section);
      return next;
    });
  }

  useEffect(() => {
    setActiveTab(currentView);
  }, [currentView]);

  const handleTabChange = (view: string) => {
    setActiveTab(view);
    setIsMobileMenuOpen(false);
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", view);
      params.delete("page");
      params.delete("search");
      params.delete("status");
      router.push(`/admin/affiliate?${params.toString()}`);
    });
  };

  const MENU_ITEMS = [
    {
      section: "Analytics",
      items: [
        { id: "overview", label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      section: "Management",
      items: [
        { id: "partners", label: "Partners", icon: Users },
        { id: "payouts", label: "Payouts & Ledger", icon: CreditCard, badgeKey: "payouts" as keyof SidebarCounts },
        { id: "kyc", label: "KYC Verification", icon: ShieldCheck, badgeKey: "kyc" as keyof SidebarCounts },
      ],
    },
    {
      section: "Marketing",
      items: [
        { id: "campaigns", label: "Programs", icon: Megaphone },
        { id: "creatives", label: "Creatives & Assets", icon: ImageIcon },
        { id: "announcements", label: "Announcements", icon: Megaphone },
        { id: "coupons", label: "Coupons", icon: Ticket },
      ],
    },
    {
      section: "Configuration",
      items: [
        { id: "tiers", label: "Tiers & Ranks", icon: Trophy },
        { id: "rules", label: "Commission Rules", icon: Calculator },
        { id: "product-rates", label: "Item Overrides", icon: Package },
        { id: "fraud", label: "Fraud Shield", icon: ShieldAlert, badgeKey: "fraud" as keyof SidebarCounts },
        { id: "general", label: "System Settings", icon: Settings },
      ],
    },
    {
      section: "System",
      items: [
        { id: "logs", label: "Activity Logs", icon: Terminal },
      ],
    },
  ];

  const isProgramActive = !!(initialData?.config?.isActive);
  const currentLabel = MENU_ITEMS.flatMap((s) => s.items).find((m) => m.id === activeTab)?.label || "Dashboard";

  const ActiveComponent = () => {
    if (!initialData) return null;

    switch (activeTab) {
      case "overview":
        return initialData.dashboard ? (
          <AnalyticsDashboard
            kpi={initialData.dashboard.kpi}
            charts={initialData.dashboard.charts}
            topProducts={initialData.dashboard.topProducts}
            trafficSources={initialData.dashboard.trafficSources}
            topAffiliates={initialData.dashboard.topAffiliates}
            monthlyStats={initialData.dashboard.monthlyStats}
          />
        ) : null;

      case "partners":
        return initialData.partners ? (
          <PartnersManager
            usersData={initialData.partners.users.affiliates}
            totalEntries={initialData.partners.users.total}
            totalPages={initialData.partners.users.totalPages}
            currentPage={Number(searchParams.get("page")) || 1}
            tags={initialData.partners.tags}
            defaultRate={initialData.partners.defaultRate}
            defaultType={initialData.partners.defaultType}
          />
        ) : null;

      case "payouts":
        return initialData.payouts ? (
          <FinanceManager
            payoutsData={initialData.payouts.payouts}
            ledgerData={initialData.payouts.ledger}
            currentPage={Number(searchParams.get("page")) || 1}
          />
        ) : null;

      case "kyc":
        return initialData.kyc ? <KycManager initialDocuments={initialData.kyc.documents} /> : null;

      case "campaigns":
        return initialData.campaigns ? (
          <CampaignsContestsManager
            campaignsData={initialData.campaigns.campaigns}
            contestsData={initialData.campaigns.contests}
          />
        ) : null;

      case "creatives":
        return initialData.creatives ? <CreativeList initialCreatives={initialData.creatives} /> : null;

      case "announcements":
        return initialData.announcements ? (
          <AnnouncementManager initialData={initialData.announcements.announcements} />
        ) : null;

      case "tiers":
        return initialData.tiers ? <TierList initialTiers={initialData.tiers} /> : null;

      case "rules":
        return initialData.rules ? <RuleList initialRules={initialData.rules} categories={initialData.categories || []} /> : null;

      case "product-rates":
        return initialData.rates ? <ProductRateManager initialRates={initialData.rates.rates} /> : null;

      case "fraud":
        return initialData.fraud ? (
          <FraudRuleManager
            initialRules={initialData.fraud.rules}
            highRisk={initialData.fraud.highRisk}
            flagged={initialData.fraud.flagged}
            stats={initialData.fraud.stats}
            alerts={initialData.fraud.alerts}
          />
        ) : null;

      case "coupons":
        return initialData.coupons ? (
          <CouponTagManager
            couponsData={initialData.coupons.coupons}
            tagsData={initialData.coupons.tags}
            affiliates={initialData.coupons.affiliates || []}
          />
        ) : null;

      case "logs":
        return initialData.logs ? (
          <LogViewer
            stats={initialData.logs.stats}
            auditData={initialData.logs.audit}
            systemData={initialData.logs.system}
            auditFilterOpts={initialData.logs.auditFilterOpts}
            systemSources={initialData.logs.systemSources}
            currentPage={Number(searchParams.get("page")) || 1}
            currentTab={initialData.logs.tab}
          />
        ) : null;

      case "general":
        return initialData.config ? (
          <AffiliateGeneralConfigForm initialData={initialData.config} />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div
      className="relative flex flex-col w-full min-h-screen bg-[#f0f0f1] text-[#1d2327]"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif' }}
    >

      {/* Sticky header */}
      <div className="w-full bg-[#f6f7f7] border-b border-[#dcdcde] h-12 px-4 flex justify-between items-center sticky top-0 z-20">
        <span className="font-semibold text-[#1d2327] flex items-center gap-2 text-[14px]">
          <Network className="w-4 h-4 text-[#2271b1]" />
          Affiliate Hub
          <span className="hidden lg:inline text-[#646970] font-normal text-[13px]">
            / {currentLabel}
          </span>
        </span>
        <div className="flex items-center gap-3">
          <span className={cn(
            "text-[11px] font-bold px-2 py-0.5 rounded-full border hidden sm:inline-flex items-center gap-1.5",
            isProgramActive
              ? "bg-[#00a32a]/15 text-[#00a32a] border-[#00a32a]/30"
              : "bg-[#d63638]/15 text-[#d63638] border-[#d63638]/30"
          )}>
            <span className={cn(
              "w-1.5 h-1.5 rounded-full",
              isProgramActive ? "bg-[#00a32a] animate-pulse" : "bg-[#d63638]"
            )} />
            {isProgramActive ? "Program Active" : "Program Inactive"}
          </span>
          <div className="hidden lg:block">
            <NotificationCenter />
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 text-[#646970] hover:text-[#1d2327] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile backdrop — absolute so it sits within the affiliate view (below admin header) */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden absolute inset-0 z-[90] bg-black/50"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Content row — no `relative` so sidebar's `absolute` goes to outer div */}
      <div className="flex-1 lg:flex lg:flex-row">

        {/* Sidebar:
            mobile  → absolute top-0 left-0 bottom-0 (relative to outer div, covers header)
            desktop → sticky in flex flow, collapsible */}
        <aside className={cn(
          "absolute top-0 left-0 bottom-0 z-[100] w-[240px] bg-[#f6f7f7] overflow-y-auto custom-scrollbar shadow-xl transform transition-transform duration-200",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          "lg:static lg:sticky lg:top-12 lg:h-[calc(100vh-3rem)] lg:shrink-0 lg:shadow-none lg:translate-x-0 lg:z-0 lg:border-r lg:border-[#dcdcde] lg:overflow-hidden lg:transition-[width] lg:duration-200",
          isSidebarCollapsed ? "lg:w-0 lg:border-r-0" : "lg:w-[200px] lg:overflow-y-auto"
        )}>

          {/* Mobile sidebar header */}
          <div className="lg:hidden flex items-center justify-between px-4 h-12 border-b border-[#dcdcde]">
            <span className="text-[#1d2327] font-semibold text-[13px] flex items-center gap-2">
              <Network className="w-4 h-4 text-[#2271b1]" /> Affiliate Hub
            </span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 text-[#646970] hover:text-[#1d2327] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop collapse button — top of sidebar */}
          <div className="hidden lg:flex items-center justify-between px-3 pt-2 pb-1">
            <span className="text-[10px] font-bold text-[#8c8f94] uppercase tracking-widest truncate">Menu</span>
            <button
              onClick={() => setIsSidebarCollapsed(true)}
              title="Collapse sidebar"
              className="p-1 text-[#8c8f94] hover:text-[#2271b1] hover:bg-[#e8e8e8] rounded transition-colors shrink-0"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Menu sections */}
          <nav className="pb-4 pt-1">
            {MENU_ITEMS.map((section, idx) => {
              const isCollapsed = collapsedSections.has(section.section);
              return (
              <div key={idx} className="mb-1">
                <button
                  onClick={() => toggleSection(section.section)}
                  className="w-full flex items-center justify-between px-4 pt-4 pb-1.5 group"
                >
                  <span className="text-[10px] font-bold text-[#646970] uppercase tracking-widest">
                    {section.section}
                  </span>
                  <ChevronDown className={cn(
                    "w-3 h-3 text-[#646970] transition-transform duration-200",
                    isCollapsed && "-rotate-90"
                  )} />
                </button>
                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      const badgeCount = item.badgeKey ? (counts?.[item.badgeKey] ?? 0) : 0;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleTabChange(item.id)}
                          className={cn(
                            "flex items-center gap-3 w-full px-4 py-[7px] text-[13px] transition-colors group text-left",
                            isActive
                              ? "bg-[#2271b1] text-white font-semibold"
                              : "text-[#3c434a] hover:bg-[#e8e8e8] hover:text-[#1d2327]"
                          )}
                        >
                          <Icon className={cn(
                            "w-4 h-4 shrink-0",
                            isActive ? "text-white" : "text-[#646970] group-hover:text-[#2271b1]"
                          )} />
                          <span className="flex-1 truncate">{item.label}</span>
                          {badgeCount > 0 && (
                            <span className={cn(
                              "text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shrink-0",
                              isActive ? "bg-white/25 text-white" : "bg-[#d63638] text-white"
                            )}>
                              {badgeCount > 99 ? "99+" : badgeCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              );
            })}
          </nav>
        </aside>

        {/* Desktop expand button — shown only when sidebar is collapsed */}
        {isSidebarCollapsed && (
          <div className="hidden lg:flex flex-col items-center sticky top-12 h-[calc(100vh-3rem)] shrink-0 bg-[#f6f7f7] border-r border-[#dcdcde] w-6 z-10">
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              title="Expand sidebar"
              className="mt-3 p-1 text-[#8c8f94] hover:text-[#2271b1] hover:bg-[#e8e8e8] rounded transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 relative bg-[#f0f0f1]">
          {isPending && (
            <div className="absolute inset-0 bg-[#f0f0f1]/60 z-20 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-[#2271b1]" />
                <p className="text-[12px] text-[#50575e]">Loading module...</p>
              </div>
            </div>
          )}
          <div className={cn(
            "py-3 px-1 sm:px-4 md:px-1 md:py-3 transition-opacity duration-200",
            isPending ? "opacity-50" : "opacity-100"
          )}>
            <ActiveComponent />
          </div>
        </main>
      </div>
    </div>
  );
}
