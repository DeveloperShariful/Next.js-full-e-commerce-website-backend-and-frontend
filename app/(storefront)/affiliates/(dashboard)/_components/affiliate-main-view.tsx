//app/(storefront)/affiliates/_components/affiliate-main-view.tsx

"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  LayoutDashboard, Link as LinkIcon, ImageIcon, Network, 
  CreditCard, ScrollText, PieChart, Settings, Menu, X, Loader2, LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@clerk/nextjs";
import { NotificationCenter } from "./notification-center"; 

// Import Tab Components
import DashboardOverview from "./dashboard-overview";
import LinkManager from "./link-manager";
import CreativeGallery from "./creative-gallery";
import NetworkBrowser from "./network-browser";
import PayoutManager from "./payout-manager";
import TransactionLedger from "./transaction-ledger";
import ConversionReport from "./conversion-report";
import SettingsForm from "./settings-form";

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
      router.push(`/affiliates?${params.toString()}`);
    });
  };

  const enableMLM = (initialData?.config as any)?.enableMLM ?? false;

  const MENU_ITEMS = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "links", label: "Marketing Links", icon: LinkIcon },
    { id: "creatives", label: "Creatives", icon: ImageIcon },
    ...(enableMLM ? [{ id: "network", label: "My Network", icon: Network }] : []),
    { id: "payouts", label: "Finances", icon: CreditCard },
    { id: "ledger", label: "Ledger", icon: ScrollText },
    { id: "reports", label: "Reports", icon: PieChart },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const ActiveComponent = () => {
    if (!initialData) return null;
    const { currency, profile } = initialData;

    switch (activeTab) {
      case "overview": return initialData.dashboard ? <DashboardOverview data={initialData.dashboard} currency={currency} userName={profile.name} /> : null;
      case "links": return initialData.marketing ? <LinkManager initialLinks={initialData.marketing.links} campaigns={initialData.marketing.campaigns} userId={profile.userId} defaultSlug={profile.slug} /> : null;
      case "creatives": return initialData.creatives ? <CreativeGallery creatives={initialData.creatives} /> : null;
      case "network": return initialData.network ? <NetworkBrowser data={initialData.network} /> : null;
      case "payouts": return initialData.finance ? <PayoutManager data={initialData.finance} userId={profile.userId} currency={currency} /> : null;
      case "ledger": return initialData.ledger ? <TransactionLedger transactions={initialData.ledger} currency={currency} /> : null;
      case "reports": return initialData.reports ? <ConversionReport conversions={initialData.reports.conversions} currency={currency} /> : null;
      case "settings": return initialData.settings ? <SettingsForm userId={profile.userId} initialData={initialData.settings} /> : null;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen">
      
      {/* MOBILE HEADER (Fixed Top) */}
      <div className="lg:hidden w-full bg-white border-b border-gray-200 h-16 px-4 flex justify-between items-center sticky top-0 z-1 shadow-sm">
        <span className="font-bold text-gray-900 flex items-center gap-2">
          GoBike<span className="text-indigo-600">.</span> Partner
        </span>
        <div className="flex items-center gap-3">
            <NotificationCenter />
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
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
        "fixed top-16 left-0 bottom-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-auto lg:top-0 lg:z-0 overflow-y-auto custom-scrollbar shadow-xl lg:shadow-none flex flex-col",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 hidden lg:flex items-center px-6 border-b border-gray-100 bg-gray-50/50">
           <span className="font-bold text-xl text-gray-900">GoBike<span className="text-indigo-600">.</span> Partner</span>
        </div>

        <div className="flex-1 p-3 space-y-1">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-indigo-600" : "text-gray-400")} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-100">
            <SignOutButton redirectUrl="/">
                <button className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all">
                    <LogOut className="w-5 h-5" /> Sign Out
                </button>
            </SignOutButton>
        </div>
      </aside>

      {/* CONTENT AREA */}
      <main className="flex-1 w-full min-w-0 bg-gray-50/30 relative min-h-screen">
        
        {/* Desktop Header */}
        <div className="hidden lg:flex h-16 bg-white border-b border-gray-200 items-center justify-between px-8 sticky top-0 z-30">
           <h2 className="text-lg font-bold text-gray-800 capitalize">
              {MENU_ITEMS.find(m => m.id === activeTab)?.label}
           </h2>
           <div className="flex items-center gap-4">
              <NotificationCenter />
              {/* User Avatar Placeholder */}
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                {initialData?.profile?.name?.charAt(0)}
              </div>
           </div>
        </div>

        {/* Loading Overlay */}
        {isPending && (
            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-[1px]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        )}

        <div className={cn("p-4 md:p-8 transition-opacity duration-200 max-w-[1600px] w-full mx-auto", isPending ? "opacity-50" : "opacity-100")}>
            <ActiveComponent />
        </div>
      </main>
    </div>
  );
}