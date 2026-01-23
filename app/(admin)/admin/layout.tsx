// app/(admin)/layout.tsx

import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { Role } from "@prisma/client";
import AdminSidebar from "@/app/(admin)/Header-Sideber/sidebar";
import AdminHeader from "@/app/(admin)/Header-Sideber/header";
import { GlobalStoreProvider } from "@/app/providers/global-store-provider"; 

// --- Helper to fetch Global Data ---
async function getGlobalData() {
  const [settings, seo, marketing] = await Promise.all([
    db.storeSettings.findUnique({ where: { id: "settings" } }),
    db.seoGlobalConfig.findUnique({ where: { id: "global_seo" } }),
    db.marketingIntegration.findUnique({ where: { id: "marketing_config" } }),
  ]);

  return {
    storeName: settings?.storeName || "GoBike",
    storeEmail: settings?.storeEmail || "",
    storePhone: settings?.storePhone || "",
    logo: settings?.logo || null,
    favicon: settings?.favicon || null,
    isMaintenanceMode: settings?.maintenance || false,
    
    currency: settings?.currency || "AUD",
    symbol: settings?.currencySymbol || "$",
    weightUnit: settings?.weightUnit || "kg",
    dimensionUnit: settings?.dimensionUnit || "cm",
    
    // JSON Fields Casting
    address: (settings?.storeAddress as any) || {},
    socials: (settings?.socialLinks as any) || {},
    tax: (settings?.taxSettings as any) || {},
    general: (settings?.generalConfig as any) || {},

    // SEO
    seo: {
      siteName: seo?.siteName || "GoBike",
      titleSeparator: seo?.titleSeparator || "|",
      defaultMetaTitle: seo?.defaultMetaTitle || null,
      defaultMetaDesc: seo?.defaultMetaDesc || null,
      ogImage: seo?.ogImage || null,
      twitterCard: seo?.twitterCard || "summary_large_image",
      twitterSite: seo?.twitterSite || null,
    },

    // Marketing
    marketing: {
      gtmEnabled: marketing?.gtmEnabled || false,
      gtmContainerId: marketing?.gtmContainerId || null,
      fbEnabled: marketing?.fbEnabled || false,
      fbPixelId: marketing?.fbPixelId || null,
      klaviyoEnabled: marketing?.klaviyoEnabled || false,
      klaviyoPublicKey: marketing?.klaviyoPublicKey || null,
    },
  };
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // 1. Auth Check
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const dbUser = await db.user.findUnique({
    where: { email: clerkUser.emailAddresses[0].emailAddress }
  });

  if (!dbUser || dbUser.role === Role.CUSTOMER) redirect("/"); 

  const adminUser = {
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    image: clerkUser.imageUrl,
  };

  // 2. Fetch Global Data
  const rawGlobalData = await getGlobalData();

  // ✅ FIX: Serialize data to remove Decimal objects before passing to Client Component
  const globalData = JSON.parse(JSON.stringify(rawGlobalData));

  return (
    // 3. Wrap everything with GlobalStoreProvider
    <GlobalStoreProvider settings={globalData}>
      <div className="flex h-screen bg-slate-50/50 font-sans text-slate-800 overflow-hidden">
        <AdminSidebar user={adminUser} />
        <div className="flex-1 flex flex-col h-full min-w-0">
          <AdminHeader user={adminUser} />
          <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">    
                {children}
          </main>
        </div>
      </div>
    </GlobalStoreProvider>
  );
}