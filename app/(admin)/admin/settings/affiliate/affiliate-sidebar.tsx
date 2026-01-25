//app/(admin)/admin/settings/affiliate/affiliate-sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Settings, 
  Trophy, 
  Calculator, 
  Image as ImageIcon, 
  Menu, 
  X,
  ChevronLeft,
  ChevronDown,
  Dot,
  Network,     
  ShieldAlert, 
  BarChart2,   
  Code2,
  Megaphone,   // New for Campaigns
  Globe,       // New for Domains
  ScrollText   // New for Ledger
} from "lucide-react";
import { cn } from "@/lib/utils";

// Updated Menu Structure with All Ultra Features
const MENU_ITEMS = [
  {
    label: "Overview",
    href: "/admin/settings/affiliate",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Affiliates",
    href: "/admin/settings/affiliate/users",
    icon: Users,
  },
  {
    label: "Network (MLM)",
    href: "/admin/settings/affiliate/network",
    icon: Network,
  },
  {
    label: "Campaigns", // New
    href: "/admin/settings/affiliate/campaigns",
    icon: Megaphone,
  },
  {
    label: "Payouts",
    href: "/admin/settings/affiliate/payouts",
    icon: CreditCard,
  },
  {
    label: "Financial Ledger", // New
    href: "/admin/settings/affiliate/ledger",
    icon: ScrollText,
  },
  {
    label: "Fraud Shield",
    href: "/admin/settings/affiliate/fraud",
    icon: ShieldAlert,
  },
  {
    label: "Tiers & Rewards",
    href: "/admin/settings/affiliate/tiers",
    icon: Trophy,
  },
  {
    label: "Commission Rules",
    href: "/admin/settings/affiliate/rules",
    icon: Calculator,
  },
  {
    label: "Creatives",
    href: "/admin/settings/affiliate/creatives",
    icon: ImageIcon,
  },
  {
    label: "Custom Domains", // New
    href: "/admin/settings/affiliate/domains",
    icon: Globe,
  },
  {
    label: "Tracking Pixels",
    href: "/admin/settings/affiliate/pixels",
    icon: Code2,
  },
  {
    label: "Adv. Reports",
    href: "/admin/settings/affiliate/reports",
    icon: BarChart2,
  },
  {
    label: "Settings",
    href: "/admin/settings/affiliate/general",
    icon: Settings,
    children: [
      { label: "General", param: "general" },
      { label: "Commissions", param: "commissions" },
      { label: "Affiliate Links", param: "links" },
      { label: "Configuration", param: "fraud" },
      { label: "Payout Config", param: "payouts" },
    ]
  },
];

export default function AffiliateSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "general";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden mb-6 flex items-center justify-between bg-white border p-4 rounded-lg shadow-sm">
        <span className="font-semibold text-gray-900">Affiliate Menu</span>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className={cn(
        "flex flex-col w-64 shrink-0 space-y-2 max-h-screen sticky top-4 overflow-y-auto pb-10", // Added overflow handling
        isMobileMenuOpen ? "flex absolute top-20 left-0 right-0 z-50 bg-white p-4 shadow-xl border rounded-xl md:static md:bg-transparent md:border-none md:shadow-none" : "hidden md:flex"
      )}>
        {/* Back Link */}
        <Link 
            href="/admin/dashboard" 
            className="flex items-center gap-2 text-xs text-gray-500 mb-4 px-2 hover:text-black transition-colors"
        >
            <ChevronLeft className="w-3 h-3" />
            Back to Main Admin
        </Link>
        
        <div className="flex flex-col gap-1">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            
            // Check if Main Parent is Active
            const isParentActive = item.exact 
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <div key={item.href} className="flex flex-col gap-1">
                {/* Parent Item */}
                <Link
                  href={item.children ? `${item.href}?tab=${item.children[0].param}` : item.href}
                  onClick={() => !item.children && setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                    isParentActive 
                      ? "bg-black text-white shadow-md" 
                      : "text-gray-500 bg-white border border-transparent hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("w-4 h-4", isParentActive ? "text-white" : "text-gray-400")} />
                    {item.label}
                  </div>
                  {item.children && (
                    <ChevronDown className={cn("w-3 h-3 transition-transform", isParentActive ? "text-white rotate-180" : "text-gray-400")} />
                  )}
                </Link>

                {/* Sub-menu Items (Only show if parent is active) */}
                {item.children && isParentActive && (
                  <div className="ml-4 pl-4 border-l border-gray-200 space-y-1 my-1 animate-in slide-in-from-left-2 duration-300">
                    {item.children.map((sub) => {
                      const isSubActive = currentTab === sub.param;
                      return (
                        <Link
                          key={sub.param}
                          href={`${item.href}?tab=${sub.param}`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-colors",
                            isSubActive
                              ? "bg-gray-100 text-black font-semibold"
                              : "text-gray-500 hover:text-black hover:bg-gray-50"
                          )}
                        >
                          {isSubActive && <Dot className="w-4 h-4 -ml-1.5 text-blue-600" />}
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}