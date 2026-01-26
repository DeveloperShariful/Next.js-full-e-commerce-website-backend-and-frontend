//app/(storefront)/affiliates/_components/affiliate-sidebar.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Link as LinkIcon, 
  CreditCard, 
  Settings, 
  Network, 
  PieChart, 
  ImageIcon,
  X,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@clerk/nextjs";
import { useGlobalStore } from "@/app/providers/global-store-provider";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AffiliateSidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  
  // ✅ GLOBAL STORE: সেটিংস থেকে ডাটা নেওয়া হচ্ছে
  const { affiliate } = useGlobalStore(); 

  // ডিফল্ট মেনু আইটেম
  const baseMenu = [
    { label: "Overview", href: "/affiliates", icon: LayoutDashboard, exact: true },
    { label: "Marketing Tools", href: "/affiliates/marketing/links", icon: LinkIcon },
    { label: "Creatives", href: "/affiliates/marketing/creatives", icon: ImageIcon },
    { label: "Finances & Payouts", href: "/affiliates/finance/payouts", icon: CreditCard },
    { label: "Reports", href: "/affiliates/reports", icon: PieChart },
    { label: "Settings", href: "/affiliates/settings", icon: Settings },
  ];

  // ✅ DYNAMIC LOGIC: যদি MLM চালু থাকে, তবে নেটওয়ার্ক মেনু অ্যাড করো
  // নোট: আপনার affiliate config এ 'enableMLM' বা 'tierSystem' ফ্ল্যাগ থাকতে হবে।
  // আপাতত আমরা ধরে নিচ্ছি সব সময় দেখাবে, অথবা আপনি লজিক বসাতে পারেন:
  // if (affiliate.enableMLM) { ... }
  
  // ডেমো লজিক: নেটওয়ার্ক মেনু ইনজেক্ট করা
  const MENU = [
    ...baseMenu.slice(0, 3), // Overview, Marketing, Creatives
    { label: "My Network", href: "/affiliates/network", icon: Network }, // MLM Menu
    ...baseMenu.slice(3)     // Finances, Reports, Settings
  ];

  // Common Nav Content
  const NavContent = () => (
    <>
      <div className="px-6 py-6 mb-2 flex items-center justify-between">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          {affiliate.programName || "Partner Menu"} {/* ডাইনামিক নাম */}
        </h2>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-gray-500 hover:bg-gray-100 p-1 rounded">
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 overflow-y-auto">
        {MENU.map((item) => {
          const isActive = item.exact 
            ? pathname === item.href 
            : pathname.startsWith(item.href);
            
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all",
                isActive 
                  ? "bg-black text-white shadow-md" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-black"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive ? "text-white" : "text-gray-400")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 mt-auto border-t">
        <SignOutButton redirectUrl="/">
          <button className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </SignOutButton>
      </div>
    </>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex w-64 bg-white border-r flex-col sticky top-16 h-[calc(100vh-4rem)] z-30 flex-shrink-0">
        <NavContent />
      </aside>

      {/* MOBILE SIDEBAR */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden transition-opacity duration-300",
        isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
      )}>
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <aside className={cn(
          "absolute top-0 left-0 bottom-0 w-64 bg-white shadow-2xl flex flex-col transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <NavContent />
        </aside>
      </div>
    </>
  );
}