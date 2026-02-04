//app/(storefront)/affiliates/_components/affiliate-main-view.tsx

"use client";

import { useState } from "react"; 
import { 
  LayoutDashboard, Link as LinkIcon, Image as ImageIcon, 
  Users, Wallet, FileText, BarChart3, Settings, Menu, X, Ticket, 
  Trophy // ✅ Import Trophy Icon
} from "lucide-react";
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
import ContestsBonusesView from "./contests-bonuses-tier"; // ✅ Import New Component
import { NotificationCenter } from "./notification-center";

interface Props {
  initialData: {
    profile: any;
    dashboard: any;
    marketing: any;
    creatives: any[];
    network: any;
    finance: any;
    ledger: any[];
    reports: any;
    settings: any;
    config: any;
  };
}

export default function AffiliateMainView({ initialData }: Props) {
  const [currentView, setCurrentView] = useState("overview");
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const { profile, dashboard, marketing, creatives, network, finance, ledger, reports, settings } = initialData;

  const handleNav = (view: string) => {
    setCurrentView(view); 
    setSidebarOpen(false);
  };

  // ✅ Add "Contests & Bonuses" to Menu
  const navItems = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "links", label: "Marketing Links", icon: LinkIcon },
    { id: "coupons", label: "Coupons", icon: Ticket },
    { id: "contests-bonuses", label: "Contests & Bonuses", icon: Trophy }, // ✅ NEW ITEM
    { id: "creatives", label: "Creatives", icon: ImageIcon },
    { id: "network", label: "My Network", icon: Users },
    { id: "payouts", label: "Payouts", icon: Wallet },
    { id: "ledger", label: "Ledger", icon: FileText },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  // Render content based on state
  const renderContent = () => {
    switch (currentView) {
      case "overview": return <DashboardOverview data={dashboard} userName={profile.name} userStatus={profile.status} />;
      case "links": return <LinkManager initialLinks={marketing.links} campaigns={marketing.campaigns} userId={profile.userId} defaultSlug={marketing.defaultSlug} baseUrl={marketing.baseUrl} paramName={marketing.paramName} />;
      case "coupons": return <CouponManager coupons={marketing.coupons || []} />;
      
      // ✅ Handle New View
      case "contests-bonuses": return (
        <ContestsBonusesView tierData={dashboard.tierProgress} contests={dashboard.activeContests || []} bonuses={dashboard.activeRules || []} />
      );

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
      
      {/* ... Header Code (Same as before) ... */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm h-16 flex items-center justify-between px-4 lg:px-8">
          {/* Header content unchanged */}
          <div className="flex items-center gap-4">
            <span className="font-bold text-xl tracking-tight text-gray-900">GoBike. Partner</span>
            <div className="hidden lg:block h-6 w-px bg-gray-200 mx-2" />
            <span className="hidden lg:block text-sm font-medium text-gray-500 capitalize">
                {navItems.find(i => i.id === currentView)?.label || "Dashboard"}
            </span>
          </div>
          {/* ... Rest of Header ... */}
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

      <div className="flex flex-1 w-full">
        
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 flex-shrink-0 min-h-[calc(100vh-64px)]">
           <div className="p-4 space-y-1 sticky top-20"> 
              {navItems.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                      isActive 
                        ? "bg-indigo-50 text-indigo-700 shadow-sm font-bold" 
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5", isActive ? "text-indigo-600" : "text-gray-400")} />
                    {item.label}
                  </button>
                );
              })}
           </div>
        </aside>

        {/* ... Mobile Menu & Main Content Wrapper (Same as before) ... */}
        {isSidebarOpen && (
            <div className="fixed inset-0 top-16 z-30 lg:hidden">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSidebarOpen(false)} />
                <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col border-r border-gray-200">
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
                </div>
            </div>
        )}

        <main className="flex-1 p-4 lg:p-8 min-w-0 relative">
            <div className="max-w-7xl mx-auto w-full animate-in fade-in zoom-in-95 duration-300">
                {renderContent()}
            </div>
        </main>

      </div>
    </div>
  );
}