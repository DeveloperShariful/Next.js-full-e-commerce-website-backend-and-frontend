// File: app/(admin)/admin/settings/affiliate/_components/affiliate-main-view.tsx

"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  LayoutDashboard, Users, CreditCard, Settings, Trophy, Calculator, 
  Image as ImageIcon, Network, ShieldAlert, Code2, 
  Megaphone, Globe, ScrollText, Package, ShieldCheck, Menu, X, Loader2, BarChart2
} from "lucide-react";
import { cn } from "@/lib/utils";

import { NotificationCenter } from "./notification-center";

// Import Components
import MainOverview from "./main-overview";
import AffiliateUsersTable from "./users-table";
import PayoutsTable from "./payouts-table";
import TierList from "./tier-list";
import RuleList from "./rule-list";
import CreativeList from "./creative-list";
import ContestList from "./contest-list";
import CampaignList from "./campaign-list";
import AnnouncementManager from "./announcement-manager";
import NetworkTree from "./network-tree";
import FraudRuleManager from "./fraud-rule-manager"; 
import DomainList from "./domain-list";
import PixelList from "./pixel-list";
import ProductRateManager from "./product-rate-manager";
import KycManager from "./kyc-manager";
import LedgerTable from "./ledger-table";
import GroupManager from "./group-manager";
import AffiliateGeneralConfigForm from "./general-config-form";
import ReportsDashboard from "./reports-dashboard";

interface Props {
  initialData: any;
  currentView: string;
}

export default function AffiliateMainView({ initialData, currentView }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState(currentView);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        router.push(`/admin/settings/affiliate?${params.toString()}`);
    });
  };

  // ✅ MLM Config মেনু ডিলিট করা হয়েছে
  const MENU_ITEMS = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "reports", label: "Adv. Reports", icon: BarChart2 },
    { id: "users", label: "Affiliates", icon: Users },
    { id: "groups", label: "Groups", icon: Users },
    { id: "payouts", label: "Payouts", icon: CreditCard },
    { id: "ledger", label: "Ledger", icon: ScrollText },
    { id: "network", label: "Network (MLM)", icon: Network },
    { id: "campaigns", label: "Campaigns", icon: Megaphone },
    { id: "creatives", label: "Creatives", icon: ImageIcon },
    { id: "tiers", label: "Tiers", icon: Trophy },
    { id: "rules", label: "Rules", icon: Calculator },
    { id: "product-rates", label: "Product Rates", icon: Package },
    { id: "contests", label: "Contests", icon: Trophy },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "fraud", label: "Fraud Shield", icon: ShieldAlert },
    { id: "kyc", label: "KYC Verify", icon: ShieldCheck },
    { id: "domains", label: "Domains", icon: Globe },
    { id: "pixels", label: "Pixels", icon: Code2 },
    // { id: "mlm-configuration", label: "MLM Config", icon: Network }, // ❌ DELETED
    { id: "general", label: "Settings", icon: Settings },
  ];

  const ActiveComponent = () => {
    if (!initialData) return null;

    switch (activeTab) {
      case "overview": return initialData.dashboard ? <MainOverview kpi={initialData.dashboard.kpi} charts={initialData.dashboard.charts} /> : null;
      case "reports": return initialData.reports ? <ReportsDashboard topProducts={initialData.reports.topProducts} trafficSources={initialData.reports.trafficSources} topAffiliates={initialData.reports.topAffiliates} monthlyStats={initialData.reports.monthlyStats} /> : null;
      case "users": return initialData.users ? <AffiliateUsersTable data={initialData.users.affiliates} totalEntries={initialData.users.total} totalPages={initialData.users.totalPages} currentPage={Number(searchParams.get("page")) || 1} groups={initialData.groups} tags={initialData.tags} /> : null;
      case "payouts": return initialData.payouts ? <PayoutsTable data={initialData.payouts.items} totalEntries={initialData.payouts.total} totalPages={initialData.payouts.totalPages} currentPage={Number(searchParams.get("page")) || 1} /> : null;
      case "tiers": return initialData.tiers ? <TierList initialTiers={initialData.tiers} /> : null;
      case "rules": return initialData.rules ? <RuleList initialRules={initialData.rules} /> : null;
      case "creatives": return initialData.creatives ? <CreativeList initialCreatives={initialData.creatives} /> : null;
      case "contests": return initialData.contests ? <ContestList initialContests={initialData.contests} /> : null;
      case "campaigns": return initialData.campaigns ? <CampaignList data={initialData.campaigns.campaigns.map((c: any) => ({...c, revenue: c.revenue.toNumber()}))} totalEntries={initialData.campaigns.total} /> : null;
      case "announcements": return initialData.announcements ? <AnnouncementManager initialData={initialData.announcements.announcements} /> : null;
      case "network": return initialData.network ? <div className="overflow-x-auto"><NetworkTree nodes={initialData.network} /></div> : null;
      case "fraud": return initialData.fraud ? <div className="space-y-6"><div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-orange-800 text-sm"><strong>Live Monitor:</strong> {initialData.fraud.highRisk.length} High Risk Users Detected.</div><FraudRuleManager initialRules={initialData.fraud.rules} /></div> : null;
      case "domains": return initialData.domains ? <DomainList initialDomains={initialData.domains} /> : null;
      case "pixels": return initialData.pixels ? <PixelList pixels={initialData.pixels} /> : null;
      case "product-rates": return initialData.rates ? <ProductRateManager initialRates={initialData.rates.rates.map((r:any) => ({...r, product: {...r.product, price: r.product.price.toNumber()}, rate: r.rate}))} /> : null;
      case "kyc": return initialData.kyc ? <KycManager initialDocuments={initialData.kyc.documents} /> : null;
      case "ledger": return initialData.ledger ? <LedgerTable data={initialData.ledger.transactions} totalEntries={initialData.ledger.total} totalPages={initialData.ledger.totalPages} currentPage={Number(searchParams.get("page")) || 1} /> : null;
      case "groups": return initialData.groupsList ? <GroupManager initialGroups={initialData.groupsList} /> : null;
      
      // ✅ Settings এ MLM Config ডাটাও পাস করা হচ্ছে
      case "general": return initialData.config ? (
        <AffiliateGeneralConfigForm 
            initialData={initialData.config} 
            mlmInitialData={initialData.mlmConfig || { isEnabled: false, maxLevels: 3, levelRates: {"1": 10}, commissionBasis: "SALES_AMOUNT" }}
        /> 
      ) : null;
      
      default: return null;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen">
      
      {/* MOBILE HEADER */}
      <div className="lg:hidden w-full bg-white border-b border-gray-200 h-16 px-4 flex justify-between items-center sticky top-0 z-1 shadow-sm">
        <span className="font-bold text-gray-800 flex items-center gap-2">
          {MENU_ITEMS.find(m => m.id === activeTab)?.icon && <span className="text-black"><Settings className="w-5 h-5"/></span>}
          {MENU_ITEMS.find(m => m.id === activeTab)?.label || "Menu"}
        </span>
        
        <div className="flex items-center gap-3">
            <NotificationCenter />
            <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
            {isMobileMenuOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
            </button>
        </div>
      </div>

      {/* MOBILE OVERLAY */}
      <div 
        className={cn(
            "fixed inset-0 top-16 z-1 bg-black/50 lg:hidden transition-opacity", 
            isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        )} 
        onClick={() => setIsMobileMenuOpen(false)} 
      />

      {/* SIDEBAR */}
      <aside className={cn(
        "fixed top-16 left-0 bottom-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-auto lg:top-0 lg:z-0 overflow-y-auto custom-scrollbar shadow-xl lg:shadow-none",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-5 border-b border-gray-100 hidden lg:flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="font-bold text-lg text-gray-900">Affiliate Menu</h2>
            <p className="text-xs text-gray-500">Program Management</p>
          </div>
          <div className="hidden lg:block">
             <NotificationCenter /> 
          </div>
        </div>
        
        <div className="p-2 space-y-0.5 pb-20 lg:pb-2">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200",
                  isActive 
                    ? "bg-gray-100 text-gray-900 border-l-4 border-black pl-2"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-black" : "text-gray-400")} />
                {item.label}
              </button>
            );
          })}
        </div>
      </aside>

      {/* CONTENT AREA */}
      <main className="flex-1 w-full min-w-0 bg-gray-50/30 relative min-h-screen">
        {isPending && (
            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-[1px]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-800" />
            </div>
        )}

        <div className={cn("p-4 md:p-8 transition-opacity duration-200", isPending ? "opacity-50" : "opacity-100")}>
            <div className="max-w-full mx-auto">
                <div className="mb-6 hidden lg:block">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        {MENU_ITEMS.find(m => m.id === activeTab)?.label}
                    </h1>
                </div>
                <ActiveComponent />
            </div>
        </div>
      </main>
    </div>
  );
}