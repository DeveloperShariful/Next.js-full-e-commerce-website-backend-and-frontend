// File: app/(admin)/admin/settings/affiliate/_components/affiliate-nav-tabs.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils"; // Assuming you have a class merger utility
import { Settings, GitMerge, Calculator, Image, BarChart3 } from "lucide-react";

/**
 * CLIENT COMPONENT
 * Handles active state for the tab navigation.
 */
export default function AffiliateNavTabs() {
  const pathname = usePathname();

  const tabs = [
    {
      label: "General Settings",
      href: "/admin/settings/affiliate/general",
      icon: Settings,
      description: "Global switch, payouts & cookies",
    },
    {
      label: "Tiers & MLM",
      href: "/admin/settings/affiliate/tiers",
      icon: GitMerge,
      description: "Manage levels and parent-child logic",
    },
    {
      label: "Commission Rules",
      href: "/admin/settings/affiliate/rules",
      icon: Calculator,
      description: "Dynamic logic engine & priorities",
    },
    {
      label: "Creatives",
      href: "/admin/settings/affiliate/creatives",
      icon: Image,
      description: "Banners & marketing assets",
    },
    // Future Expansion:
    // { label: "Analytics", href: "/admin/settings/affiliate/analytics", icon: BarChart3 },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200",
                isActive
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <Icon
                className={cn(
                  "mr-2 h-4 w-4",
                  isActive ? "text-black" : "text-gray-400 group-hover:text-gray-500"
                )}
              />
              <div className="flex flex-col text-left">
                <span>{tab.label}</span>
                {/* Optional: Show description only on large screens if needed */}
                {/* <span className="text-[10px] font-normal text-gray-400 hidden lg:block">
                  {tab.description}
                </span> */}
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}