//app/(storefront)/affiliates/_components/affiliate-main-view.tsx

"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, Link as LinkIcon, Image as ImageIcon, Users, Wallet, FileText, BarChart3, Settings, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Components
import DashboardOverview from "./dashboard-overview";
import LinkManager from "./link-manager";
import PayoutManager from "./payout-manager";
import TransactionLedger from "./transaction-ledger";
import NetworkBrowser from "./network-browser";
import SettingsForm from "./settings-form";

// Interfaces
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

  const { profile, dashboard, marketing, creatives, network, finance, ledger, reports, settings } = initialData;

  const handleNav = (view: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("view", view);
    router.push(`${pathname}?${params.toString()}`);
    setSidebarOpen(false); 
  };

  const navItems = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "links", label: "Marketing Links", icon: LinkIcon },
    { id: "creatives", label: "Creatives", icon: ImageIcon },
    { id: "network", label: "My Network", icon: Users },
    { id: "payouts", label: "Payouts", icon: Wallet },
    { id: "ledger", label: "Ledger", icon: FileText },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  // Render Active Component
  const renderContent = () => {
    switch (currentView) {
      case "overview":
        return <DashboardOverview data={dashboard} userName={profile.name} />;
      
      case "links":
        return <LinkManager 
          initialLinks={marketing.links} 
          campaigns={marketing.campaigns} 
          userId={profile.userId}
          defaultSlug={marketing.defaultSlug}
          // baseUrl এবং paramName এখন LinkManager নিজেই হ্যান্ডেল করবে বা প্রপস থেকে নেবে
          baseUrl={marketing.baseUrl}
          paramName={marketing.paramName}
        />;

      case "creatives":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2">
             {creatives?.map((c: any) => (
                <div key={c.id} className="bg-white p-4 rounded-xl border shadow-sm group hover:shadow-md transition-all">
                   <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.url} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                   </div>
                   <h3 className="font-bold text-sm text-gray-900">{c.title}</h3>
                   <a href={c.url} download target="_blank" rel="noreferrer" className="block w-full mt-3 bg-black text-white py-2 rounded-lg text-xs font-bold text-center hover:bg-gray-800 transition-colors">
                     Download Asset
                   </a>
                </div>
             ))}
          </div>
        );

      case "network":
        return <NetworkBrowser data={network} />;

      case "payouts":
        return <PayoutManager data={finance} userId={profile.userId} />;

      case "ledger":
        // ✅ FIX: ledger undefined হলে empty array পাস হবে
        return <TransactionLedger transactions={ledger || []} />;

      case "settings":
        return <SettingsForm userId={profile.userId} initialData={settings} />;

      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
            <span className="font-bold text-xl tracking-tight">GoBike. Partner</span>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                    isActive 
                      ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-indigo-600" : "text-gray-400")} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User Profile Footer */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                {profile.name?.charAt(0) || "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{profile.name}</p>
                <p className="text-xs text-gray-500 truncate">{profile.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 lg:hidden flex items-center justify-between px-4 bg-white border-b border-gray-200">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-gray-600">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-lg">Partner Dashboard</span>
          <div className="w-8" />
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}