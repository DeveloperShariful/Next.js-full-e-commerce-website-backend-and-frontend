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
  Megaphone,
  Globe,
  ScrollText,
  
 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobalStore } from "@/app/providers/global-store-provider";

export default function AffiliateSidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { affiliate } = useGlobalStore();

  const MENU_ITEMS = [
    { label: "Overview", href: "/admin/settings/affiliate", icon: LayoutDashboard, exact: true },
    { label: "Affiliates", href: "/admin/settings/affiliate/users", icon: Users },
    { label: "Groups", href: "/admin/settings/affiliate/groups", icon: Globe },
    { label: "Network (MLM)", href: "/admin/settings/affiliate/network", icon: Network },
    { label: "Campaigns", href: "/admin/settings/affiliate/campaigns", icon: Megaphone },
    { label: "Payouts", href: "/admin/settings/affiliate/payouts", icon: CreditCard },
    { label: "Financial Ledger", href: "/admin/settings/affiliate/ledger", icon: ScrollText },
    { label: "Fraud Shield", href: "/admin/settings/affiliate/fraud", icon: ShieldAlert },
    { label: "Tiers & Rewards", href: "/admin/settings/affiliate/tiers", icon: Trophy },
    { label: "Commission Rules", href: "/admin/settings/affiliate/rules", icon: Calculator },
    { label: "Creatives", href: "/admin/settings/affiliate/creatives", icon: ImageIcon },
    { label: "Custom Domains", href: "/admin/settings/affiliate/domains", icon: Globe },
    { label: "Tracking Pixels", href: "/admin/settings/affiliate/pixels", icon: Code2 },
    { label: "Adv. Reports", href: "/admin/settings/affiliate/reports", icon: BarChart2 },
    { label: "Product-Rates", href: "/admin/settings/affiliate/product-rates", icon: Settings },
    { label: "Announcements", href: "/admin/settings/affiliate/announcements", icon: ImageIcon },
    { label: "MLM-Configuration", href: "/admin/settings/affiliate/mlm-configuration", icon: Code2 },
    { label: "KYC Veryfication", href: "/admin/settings/affiliate/kyc", icon: BarChart2 },
    { label: "Settings", href: "/admin/settings/affiliate/general", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden mb-6 flex items-center justify-between bg-white border p-4 rounded-lg shadow-sm">
        <span className="font-semibold text-gray-900">{affiliate.programName || "Affiliate Admin"}</span>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Container */}
      <div className={cn(
        "flex flex-col w-64 shrink-0 space-y-2 max-h-screen sticky top-4 overflow-y-auto pb-10 custom-scrollbar",
        isMobileMenuOpen ? "absolute top-20 left-0 right-0 z-50 bg-white p-4 shadow-xl border rounded-xl md:static md:bg-transparent md:border-none md:shadow-none" : "hidden md:flex"
      )}>
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
            const isParentActive = item.exact 
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                  isParentActive 
                    ? "bg-black text-white shadow-md" 
                    : "text-gray-500 bg-white border border-transparent hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className={cn("w-4 h-4", isParentActive ? "text-white" : "text-gray-400")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}