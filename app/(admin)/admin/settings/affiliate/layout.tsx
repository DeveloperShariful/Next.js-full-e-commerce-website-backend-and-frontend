// File: app/(admin)/admin/settings/affiliate/layout.tsx

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Affiliate System | Admin Panel",
  description: "Manage affiliate program, commissions, tiers, and creatives.",
};

interface AffiliateLayoutProps {
  children: React.ReactNode;
}

export default function AffiliateSettingsLayout({ children }: AffiliateLayoutProps) {
  return (
    <div className="w-full min-h-screen bg-gray-50/30 font-sans antialiased">
      {children}
    </div>
  );
}