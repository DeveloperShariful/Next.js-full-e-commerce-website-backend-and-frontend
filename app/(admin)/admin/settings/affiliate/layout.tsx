// File: app/(admin)/admin/settings/affiliate/layout.tsx

import { Metadata } from "next";
import AffiliateSidebar from "./affiliate-sidebar";

export const metadata: Metadata = {
  title: "Affiliate System | Admin",
  description: "Manage affiliate program, commissions, tiers, and creatives.",
};

interface AffiliateLayoutProps {
  children: React.ReactNode;
}

export default function AffiliateSettingsLayout({ children }: AffiliateLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
        
        {/* Header Section */}
        <div className="mb-6 md:mb-8 pl-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
            Affiliate Program
          </h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">
            Enterprise management for partners, payouts, and marketing assets.
          </p>
        </div>

        {/* 
            🔥 FIX: Responsive Flex Layout 
            - Mobile: Column (Sidebar top, Content bottom)
            - Desktop: Row (Sidebar left, Content right)
        */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start relative">
          
          {/* Sidebar */}
          <AffiliateSidebar />

          {/* Page Content */}
          <div className="flex-1 w-full min-w-0">
            {/* Added extra padding bottom for mobile ease */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 min-h-[600px] animate-in fade-in pb-20 md:pb-6">
              {children}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}