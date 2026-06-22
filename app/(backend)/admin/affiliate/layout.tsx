// File: app/(backend)/admin/affiliate/layout.tsx

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
    // -m-2 cancels the p-2 padding of the admin layout's <main> so the
    // affiliate hub header is flush with the admin header (no gray gap)
    <div className="-m-2 overflow-x-hidden">
      {children}
    </div>
  );
}