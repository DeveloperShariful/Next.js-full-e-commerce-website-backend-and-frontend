//app/(storefront)/affiliates/_components/affiliate-main-view.tsx

"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { 
  LayoutDashboard, Link as LinkIcon, Image as ImageIcon, 
  Users, Wallet, FileText, BarChart3, Settings, Menu, X, Ticket, Loader2 
} from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

// Components Imports
import DashboardOverview from "./dashboard-overview";
import LinkManager from "./link-manager";
import CouponManager from "./coupon-manager"; 
import PayoutManager from "./payout-manager";
import TransactionLedger from "./transaction-ledger";
import NetworkBrowser from "./network-browser";
import SettingsForm from "./settings-form";
import CreativeGallery from "./creative-gallery"; 
import ConversionReport from "./conversion-report"; 
import { NotificationCenter } from "./notification-center";

interface Props {
  initialData: {
    profile: any;
    dashboard?: any;
    marketing?: any;
    creatives?: any[];
    network?: any;
    finance?: any;
    ledger?: any[];
    reports?: any;
    settings?: any;
    config: any;
  };
  currentView: string;
}

export default function AffiliateMainView({ initialData, currentView }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { profile, dashboard, marketing, creatives, network, finance, ledger, reports, settings } = initialData;

  const handleNav = (view: string) => {
    if (view === currentView) {
        setSidebarOpen(false);
        return;
    }

    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      params.set("view", view);
      router.push(`${pathname}?${params.toString()}`);
      setSidebarOpen(false); 
    });
  };

  const navItems = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "links", label: "Marketing Links", icon: LinkIcon },
    { id: "coupons", label: "Coupons", icon: Ticket },
    { id: "creatives", label: "Creatives", icon: ImageIcon },
    { id: "network", label: "My Network", icon: Users },
    { id: "payouts", label: "Payouts", icon: Wallet },
    { id: "ledger", label: "Ledger", icon: FileText },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const renderContent = () => {
    switch (currentView) {
      case "overview": return <DashboardOverview data={dashboard} userName={profile.name} />;
      case "links": return <LinkManager initialLinks={marketing.links} campaigns={marketing.campaigns} userId={profile.userId} defaultSlug={marketing.defaultSlug} baseUrl={marketing.baseUrl} paramName={marketing.paramName} />;
      case "coupons": return <CouponManager coupons={marketing.coupons || []} />;
      case "creatives": return <CreativeGallery creatives={creatives || []} />;
      case "network": return <NetworkBrowser data={network} />;
      case "payouts": return <PayoutManager data={finance} userId={profile.userId} />;
      case "ledger": return <TransactionLedger transactions={ledger || []} />;
      case "reports": return <ConversionReport conversions={reports?.conversions || []} currency={initialData.config.currency} />;
      case "settings": return <SettingsForm userId={profile.userId} initialData={settings} />;
      default: return <div className="flex items-center justify-center h-64 text-gray-400"><p>Page not found</p></div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col relative">
      
      {/* ❌ Global Loader Removed from here */}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm h-16 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <span className="font-bold text-xl tracking-tight text-gray-900">GoBike. Partner</span>
            <div className="hidden lg:block h-6 w-px bg-gray-200 mx-2" />
            <span className="hidden lg:block text-sm font-medium text-gray-500 capitalize">
                {currentView}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <NotificationCenter />
            
            <div className="hidden sm:flex items-center gap-2">
                <div className="text-right hidden md:block">
                    <p className="text-sm font-bold text-gray-900 leading-none">{profile.name}</p>
                    <p className="text-[10px] text-gray-500">{profile.email}</p>
                </div>
                {profile.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatar} alt="Profile" className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 text-sm">
                        {profile.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                )}
            </div>

            <button 
                onClick={() => setSidebarOpen(!isSidebarOpen)} 
                className="lg:hidden p-2 -mr-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 w-full">
        
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 flex-shrink-0 min-h-[calc(100vh-64px)]">
           <div className="p-4 space-y-1 sticky top-20"> 
              {navItems.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    disabled={isPending} // Disable clicks while loading
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                      isActive 
                        ? "bg-indigo-50 text-indigo-700 shadow-sm font-bold" 
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                      isPending && "opacity-50 cursor-wait" // Visual feedback on buttons
                    )}
                  >
                    <item.icon className={cn("w-5 h-5", isActive ? "text-indigo-600" : "text-gray-400")} />
                    {item.label}
                  </button>
                );
              })}
           </div>
        </aside>

        {/* Mobile Drawer */}
        {isSidebarOpen && (
            <div className="fixed inset-0 top-16 z-30 lg:hidden">
                <div 
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" 
                    onClick={() => setSidebarOpen(false)} 
                />
                <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col border-r border-gray-200">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
                                {profile.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">{profile.name}</p>
                                <p className="text-xs text-gray-500 truncate">{profile.email}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 overflow-y-auto flex-1 space-y-1">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleNav(item.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium rounded-xl transition-all", 
                                    currentView === item.id 
                                        ? "bg-indigo-600 text-white shadow-md" 
                                        : "text-gray-600 hover:bg-gray-100"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5", currentView === item.id ? "text-white" : "text-gray-500")} /> 
                                {item.label}
                            </button>
                        ))}
                    </div>
                    <div className="p-4 text-center text-[10px] text-gray-400 border-t border-gray-100">
                        GoBike Partner Program v1.0
                    </div>
                </div>
            </div>
        )}

        {/* ✅ Main Content with Scoped Loader */}
        <main className="flex-1 p-4 lg:p-8 min-w-0 relative"> {/* Added 'relative' */}
            
            {/* 👇 LOCAL LOADING OVERLAY (Only covers this main section) */}
            {isPending && (
                <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] flex items-center justify-center transition-all duration-300 rounded-xl">
                    <div className="bg-white p-3 rounded-full shadow-xl border border-gray-100">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto w-full">
                {renderContent()}
            </div>
        </main>

      </div>
    </div>
  );
}