// File: app/(admin)/admin/settings/affiliate/_components/affiliate-main-view.tsx

"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  LayoutDashboard, CreditCard, Settings, Trophy, Calculator, 
  Image as ImageIcon, Network, ShieldAlert, Code2, 
  Megaphone, Globe, ScrollText, Package, ShieldCheck, Menu, X, Loader2, BarChart2,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

import { NotificationCenter } from "./notification-center";

// Import All Sub-Components
import MainOverview from "./Analytics/main-overview";
import PartnersManager from "./Management/partners-manager"; 
import PayoutsTable from "./Management/payouts-table";
import TierList from "./Configuration/tier-list";
import RuleList from "./Configuration/rule-list";
import CreativeList from "./Marketing/creative-list";
import ContestList from "./Marketing/contest-list";
import CampaignList from "./Marketing/campaign-list";
import AnnouncementManager from "./Marketing/announcement-manager";
import NetworkTree from "./Configuration/network-tree";
import FraudRuleManager from "./Configuration/fraud-rule-manager"; 
import DomainList from "./Configuration/domain-list";
import PixelList from "./Configuration/pixel-list";
import ProductRateManager from "./Configuration/product-rate-manager";
import KycManager from "./Management/kyc-manager";
import LedgerTable from "./Management/ledger-table";
import AffiliateGeneralConfigForm from "./Configuration/general-config-manager";
import ReportsDashboard from "./Analytics/reports-dashboard";

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
        // Reset pagination and filters when switching main modules
        params.delete("page");
        params.delete("search");
        params.delete("status");
        router.push(`/admin/settings/affiliate?${params.toString()}`);
    });
  };

  // Enterprise Menu Structure
  const MENU_ITEMS = [
    { section: "Analytics", items: [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "reports", label: "Adv. Reports", icon: BarChart2 },
    ]},
    { section: "Management", items: [
        { id: "partners", label: "Partner Management", icon: Users },
        { id: "payouts", label: "Payouts", icon: CreditCard },
        { id: "ledger", label: "Financial Ledger", icon: ScrollText },
        { id: "kyc", label: "KYC Verification", icon: ShieldCheck },
    ]},
    { section: "Marketing", items: [
        { id: "campaigns", label: "Campaigns", icon: Megaphone },
        { id: "creatives", label: "Creatives & Assets", icon: ImageIcon },
        { id: "contests", label: "Sales Contests", icon: Trophy },
        { id: "announcements", label: "Announcements", icon: Megaphone },
    ]},
    { section: "Configuration", items: [
        { id: "tiers", label: "Tiers & Ranks", icon: Trophy },
        { id: "rules", label: "Commission Rules", icon: Calculator },
        { id: "product-rates", label: "Item Overrides", icon: Package },
        { id: "network", label: "MLM Network", icon: Network },
        { id: "fraud", label: "Fraud Shield", icon: ShieldAlert },
        { id: "domains", label: "Custom Domains", icon: Globe },
        { id: "pixels", label: "Tracking Pixels", icon: Code2 },
        { id: "general", label: "System Settings", icon: Settings },
    ]}
  ];

  const ActiveComponent = () => {
    if (!initialData) return null;

    switch (activeTab) {
      // 1. Analytics & Reports
      case "overview": return initialData.dashboard ? <MainOverview kpi={initialData.dashboard.kpi} charts={initialData.dashboard.charts} /> : null;
      case "reports": return initialData.reports ? <ReportsDashboard topProducts={initialData.reports.topProducts} trafficSources={initialData.reports.trafficSources} topAffiliates={initialData.reports.topAffiliates} monthlyStats={initialData.reports.monthlyStats} /> : null;
      
      // 2. Management Modules
      case "partners": return initialData.partners ? (
        <PartnersManager 
            usersData={initialData.partners.users.affiliates}
            totalEntries={initialData.partners.users.total}
            totalPages={initialData.partners.users.totalPages}
            currentPage={Number(searchParams.get("page")) || 1}
            groupsData={initialData.partners.groups}
            tags={initialData.partners.tags}
        />
      ) : null;
      
      case "payouts": return initialData.payouts ? <PayoutsTable data={initialData.payouts.items} totalEntries={initialData.payouts.total} totalPages={initialData.payouts.totalPages} currentPage={Number(searchParams.get("page")) || 1} /> : null;
      case "ledger": return initialData.ledger ? <LedgerTable data={initialData.ledger.transactions} totalEntries={initialData.ledger.total} totalPages={initialData.ledger.totalPages} currentPage={Number(searchParams.get("page")) || 1} /> : null;
      case "kyc": return initialData.kyc ? <KycManager initialDocuments={initialData.kyc.documents} /> : null;

      // 3. Marketing Tools
      case "campaigns": return initialData.campaigns ? <CampaignList data={initialData.campaigns.campaigns} totalEntries={initialData.campaigns.total} /> : null;
      case "creatives": return initialData.creatives ? <CreativeList initialCreatives={initialData.creatives} /> : null;
      case "contests": return initialData.contests ? <ContestList initialContests={initialData.contests} /> : null;
      case "announcements": return initialData.announcements ? <AnnouncementManager initialData={initialData.announcements.announcements} /> : null;

      // 4. System Configuration
      case "tiers": return initialData.tiers ? <TierList initialTiers={initialData.tiers} /> : null;
      case "rules": return initialData.rules ? <RuleList initialRules={initialData.rules} /> : null;
      case "product-rates": return initialData.rates ? <ProductRateManager initialRates={initialData.rates.rates} /> : null;
      case "network": return initialData.network ? <div className="overflow-x-auto"><NetworkTree nodes={initialData.network} /></div> : null;
      case "fraud": return initialData.fraud ? <div className="space-y-6"><div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-orange-800 text-sm flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> <strong>Live Monitor:</strong> {initialData.fraud.highRisk.length} High Risk Users Detected.</div><FraudRuleManager initialRules={initialData.fraud.rules} /></div> : null;
      case "domains": return initialData.domains ? <DomainList initialDomains={initialData.domains} /> : null;
      case "pixels": return initialData.pixels ? <PixelList pixels={initialData.pixels} /> : null;
      
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
    <div className="flex flex-col lg:flex-row w-full min-h-screen bg-gray-50/30">
      
      {/* MOBILE HEADER */}
      <div className="lg:hidden w-full bg-white border-b border-gray-200 h-16 px-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <span className="font-bold text-gray-800 flex items-center gap-2">
           <Settings className="w-5 h-5 text-indigo-600"/>
           Affiliate Admin
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

      {/* SIDEBAR NAVIGATION */}
      <aside className={cn(
        "fixed top-16 left-0 bottom-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-auto lg:top-0 lg:z-0 overflow-y-auto custom-scrollbar shadow-xl lg:shadow-none pb-20",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-gray-100 hidden lg:flex justify-between items-center bg-gray-50/50 sticky top-0 z-10 backdrop-blur-md">
          <div>
            <h2 className="font-extrabold text-lg text-gray-900 tracking-tight">Affiliate Hub</h2>
            <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mt-0.5">Enterprise Control</p>
          </div>
        </div>
        
        <div className="p-4 space-y-6">
          {MENU_ITEMS.map((section, idx) => (
            <div key={idx}>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-2">{section.section}</h4>
                <div className="space-y-0.5">
                    {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                        <button
                            key={item.id}
                            onClick={() => handleTabChange(item.id)}
                            className={cn(
                            "flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group relative",
                            isActive 
                                ? "bg-gray-900 text-white shadow-md" 
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            )}
                        >
                            <Icon className={cn("w-4 h-4", isActive ? "text-indigo-400" : "text-gray-400 group-hover:text-gray-600")} />
                            {item.label}
                            {isActive && <span className="absolute right-2 w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>}
                        </button>
                        );
                    })}
                </div>
            </div>
          ))}
        </div>
      </aside>

      {/* CONTENT AREA */}
      <main className="flex-1 w-full min-w-0 relative min-h-screen pb-10">
        
        {/* Desktop Top Bar */}
        <header className="hidden lg:flex h-16 bg-white border-b border-gray-200 px-8 justify-between items-center sticky top-0 z-10">
            <h1 className="text-xl font-bold text-gray-800">
                {MENU_ITEMS.flatMap(s => s.items).find(m => m.id === activeTab)?.label}
            </h1>
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className="text-xs font-bold text-gray-900">System Admin</p>
                    <p className="text-[10px] text-gray-500">Full Access</p>
                </div>
                <NotificationCenter />
            </div>
        </header>

        {isPending && (
            <div className="absolute inset-0 bg-white/60 z-20 flex items-center justify-center backdrop-blur-[1px]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    <p className="text-xs font-medium text-gray-500 animate-pulse">Loading Module...</p>
                </div>
            </div>
        )}

        <div className={cn("p-4 md:p-8 transition-opacity duration-300 ease-in-out", isPending ? "opacity-50" : "opacity-100")}>
            <div className="max-w-7xl mx-auto">
                <ActiveComponent />
            </div>
        </div>
      </main>
    </div>
  );
}