// File: app/(admin)/admin/settings/affiliate/layout.tsx

import { Metadata } from "next";
import AffiliateNavTabs from "./_components/affiliate-nav-tabs";

export const metadata: Metadata = {
  title: "Affiliate System | Admin",
  description: "Manage affiliate program, commissions, tiers, and creatives.",
};

interface AffiliateLayoutProps {
  children: React.ReactNode;
}

/**
 * SHARED LAYOUT
 * Keeps the Header and Tabs persistent while switching sub-pages.
 */
export default function AffiliateSettingsLayout({ children }: AffiliateLayoutProps) {
  return (
    <div className="flex flex-col h-full space-y-6 p-8 max-w-7xl mx-auto">
      {/* 1. Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Affiliate Program
        </h1>
        <p className="text-gray-500">
          Advanced marketing controls, MLM tiers, and dynamic commission rules.
        </p>
      </div>

      {/* 2. Navigation Tabs (Client Component) */}
      <AffiliateNavTabs />

      {/* 3. Page Content (Sub-pages render here) */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[500px]">
        {children}
      </div>
    </div>
  );
}