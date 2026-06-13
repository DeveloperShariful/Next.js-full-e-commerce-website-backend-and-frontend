//File: app/(backend)/admin/analytics/layout.tsx

import React from "react";
import AnalyticsTabs from "./_components/analytics-tabs";

export const metadata = {
  title: "Analytics | WooCommerce Clone",
};

// Layout component strict props type
interface AnalyticsLayoutProps {
  children: React.ReactNode;
}

export default function AnalyticsLayout({ children }: AnalyticsLayoutProps) {
  return (
    // WordPress Admin Panel Default Background Color: #f0f0f1
    <div className="min-h-screen bg-[#f0f0f1] font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,Oxygen-Sans,Ubuntu,Cantarell,'Helvetica_Neue',sans-serif]">
      {/* Top Tabs */}
      <AnalyticsTabs />

      {/* Main Content Area */}
      <main className="pt-6">
        {children}
      </main>
    </div>
  );
}