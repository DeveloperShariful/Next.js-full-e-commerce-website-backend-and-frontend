// app/(frontend)/layout.tsx

import { Suspense } from "react";
import TopBar from "@/components/TopBar";
import Header from "@/components/header";
import ConditionalHeader from "@/components/ConditionalHeader";
import Footer from "@/components/Footer";
import ConditionalFooter from "@/components/ConditionalFooter";
import FloatingCompareBar from "@/components/FloatingCompareBar";
import { CartProvider } from '@/context/CartContext';
import { CompareProvider } from '@/context/CompareContext';

import AffiliateTracker from "./_components/affiliate-tracker";
import SourceTracker from "@/components/SourceTracker";
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

          {/* সাধারণ ট্রাফিক সোর্স (UTM/referrer) ক্যাপচার — Order.utmSource ইত্যাদির
              জন্য দরকার, আগে এটা কোথাও mount-ই করা ছিল না */}
          <Suspense fallback={null}>
            <SourceTracker />
          </Suspense>

          {/* ⚠️ FIX: <AffiliateTrackerProvider /> (useAffiliateTracker হুক, hardcoded
              "ref" param) এখানে সরিয়ে দেওয়া হলো — এটা AffiliateTracker (উপরে,
              admin-configurable param + cookie-attribution সহ)-এর সাথে একই
              ?ref= click-এ একসাথে fire হতো, প্রতি real click-এ ২টা করে
              AffiliateClick row তৈরি করে click-count/conversion-rate ডাবল-কাউন্ট
              করে ফেলত। AffiliateTracker এককভাবেই এখন (dedup যোগ করার পর)
              পুরো কাজটা সঠিকভাবে করে — এই duplicate tracker আর দরকার নেই।
              hooks/use-affiliate-tracker.ts, app/providers/affiliate-tracker-provider.tsx,
              app/api/tracking/click/route.ts — এই ৩টা ফাইল এখন আর কোথাও
              ব্যবহৃত হয় না (গ্রেপ করে যাচাই করা), কিন্তু ফাইল ডিলিট না করে
              রেখে দেওয়া হলো। */}

          <TopBar />
          <ConditionalHeader>
            <Header />
          </ConditionalHeader>

          <main className="flex-grow">
            {children}
          </main>

          <ConditionalFooter>
            <Footer />
          </ConditionalFooter>
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
