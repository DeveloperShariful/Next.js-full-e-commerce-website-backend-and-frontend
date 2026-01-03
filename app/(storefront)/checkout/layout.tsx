// File: app/(storefront)/checkout/layout.tsx

import { GlobalStoreProvider } from "@/app/providers/global-store-provider";
import { db } from "@/lib/prisma";
import Link from "next/link";
import { Lock } from "lucide-react";

export default async function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ১. ডাটাবেস থেকে গ্লোবাল সেটিংস আনা
  const settings = await db.storeSettings.findUnique({
    where: { id: "settings" }
  });

  return (
    <GlobalStoreProvider settings={settings}>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
        
        {/* Simple Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight">
                GoBike<span className="text-blue-600">.</span>
              </span>
            </Link>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
              <Lock className="h-3.5 w-3.5" />
              <span className="font-medium">100% Secure Checkout</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Minimal Footer */}
        <footer className="py-8 text-center border-t border-gray-200 bg-white mt-auto">
          <div className="container mx-auto px-4">
              <p className="text-xs text-gray-400 mb-2">
                  &copy; {new Date().getFullYear()} GoBike Store. All rights reserved.
              </p>
          </div>
        </footer>

      </div>
    </GlobalStoreProvider>
  );
}