// app/(frontend)/layout.tsx

import { Suspense } from "react";
import TopBar from "@/components/TopBar";
import Header from "@/components/header";
import Footer from "@/components/Footer";
import FloatingCompareBar from "@/components/FloatingCompareBar";
import { CartProvider } from '@/context/CartContext';
import { CompareProvider } from '@/context/CompareContext';

import AffiliateTracker from "./_components/affiliate-tracker";
import { AffiliateTrackerProvider } from "@/app/providers/affiliate-tracker-provider";
import DelayedScripts from "@/components/DelayedScripts";
import KlaviyoIdentifier from "@/components/KlaviyoIdentifier";
import { getCachedStoreSettings, getCachedMarketingConfig } from "@/lib/global-settings-cache";

export default async function FrontLayout({ children }: { children: React.ReactNode }) {
  const [storeSettings, marketingConfig] = await Promise.all([
    getCachedStoreSettings(),
    getCachedMarketingConfig(),
  ]);

  const affiliateParam =
    (storeSettings?.affiliateConfig as unknown as { referralParam?: string } | null)
      ?.referralParam || "ref";

  // gtmEnabled এবং klaviyoEnabled false হলে null দেব — DelayedScripts তখন কিছুই করবে না
  const gtmId = marketingConfig?.gtmEnabled ? marketingConfig.gtmContainerId : null;
  const klaviyoKey = marketingConfig?.klaviyoEnabled ? marketingConfig.klaviyoPublicKey : null;

  return (
    <CompareProvider>
      <CartProvider>
        <div className="flex flex-col min-h-screen relative">

          {/* Affiliate click tracking — URL এ ?ref=xxx থাকলে track করে */}
          <Suspense fallback={null}>
            <AffiliateTracker affiliateParam={affiliateParam} />
          </Suspense>

          {/* Affiliate session tracking — root layout থেকে এখানে move করা হয়েছে */}
          <AffiliateTrackerProvider />

          <TopBar />
          <Header />

          <main className="flex-grow">
            {children}
          </main>

          <Footer />
          <FloatingCompareBar />
          {/* GTM + Klaviyo — user interaction এর পরে load হয়, page speed এ impact নেই */}
          <DelayedScripts gtmId={gtmId} klaviyoKey={klaviyoKey} />
          {/* Logged-in user কে Klaviyo তে identify করে abandoned cart email কাজ করে */}
          {klaviyoKey && <KlaviyoIdentifier />}

        </div>
      </CartProvider>
    </CompareProvider>
  );
}
