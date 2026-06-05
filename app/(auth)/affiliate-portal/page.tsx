// File: app/(auth)/affiliate-portal/page.tsx

import type { Metadata } from 'next';
import PortalForm from './PortalForm';

export const metadata: Metadata = {
  title: 'Affiliate Portal | WP Admin Style',
  description: 'Login or register for the GoBike Affiliate Portal.',
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: '/affiliate-portal',
  }
};

export default function AffiliatePortalPage() {
  return (
    // Background styled in classic WordPress grey
    <main className="bg-[#f0f0f1] min-h-screen">
      <PortalForm />
    </main>
  );
}