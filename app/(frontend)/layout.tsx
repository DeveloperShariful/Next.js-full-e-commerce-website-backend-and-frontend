// app/(frontend)/layout.tsx

import { Suspense } from "react";
import TopBar from "@/components/TopBar";
import Header from "@/components/header";
import Footer from "@/components/Footer";
import FloatingCompareBar from "@/components/FloatingCompareBar";
import { CartProvider } from '@/context/CartContext';
import { CompareProvider } from '@/context/CompareContext';
import { Toaster } from 'sonner';
import AffiliateTracker from "./_components/affiliate-tracker";
import { getCachedStoreSettings } from "@/lib/global-settings-cache";

export default async function FrontLayout({ children }: { children: React.ReactNode }) {
  const storeSettings = await getCachedStoreSettings();
  const affiliateParam = (storeSettings?.affiliateConfig as any)?.referralParam || "ref";

  return (
    <CompareProvider>
      <CartProvider>
        <div className="flex flex-col min-h-screen relative">
          {/* Tracks ?<affiliateParam>=slug on every page visit, records click to AffiliateClick table */}
          <Suspense fallback={null}>
            <AffiliateTracker affiliateParam={affiliateParam} />
          </Suspense>
          <TopBar />
          <Header />
          
          <main className="flex-grow">
            {children}
          </main>
          
          <Footer /> 
          <FloatingCompareBar />
          <Toaster position="top-center" richColors />
        </div>
      </CartProvider>
    </CompareProvider>
  );
}