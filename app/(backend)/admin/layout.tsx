// app/(backend)/admin/layout.tsx

import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";
import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { Role } from "@prisma/client";
import AdminSidebar from "@/app/(backend)/Header-Sideber/sidebar";
import AdminHeader from "@/app/(backend)/Header-Sideber/header";
import { GlobalStoreProvider } from "@/app/providers/global-store-provider";
import { serializePrismaData } from "@/lib/format-data";
import { buildGlobalStoreData } from "@/lib/build-global-data";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user?.email) redirect("/sign-in");

  const dbUser = await db.user.findUnique({
    where: { email: session.user.email },
  });

  if (!dbUser || dbUser.role === Role.CUSTOMER) redirect("/");

  const adminUser = {
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    image: session.user.image,
  };

  const rawData = await buildGlobalStoreData();
  const cleanData = serializePrismaData(rawData);

  return (
    <GlobalStoreProvider
      settings={cleanData.settings}
      paymentMethods={cleanData.paymentMethods}
      pickupLocations={cleanData.pickupLocations}
    >
      <Toaster position="top-center" />
      <div className="flex flex-col h-screen bg-[#f0f0f1] font-sans text-[#3c434a] overflow-hidden">
        <AdminHeader
          user={adminUser}
          storeName={cleanData.settings.storeSettings?.storeName ?? "My Store"}
        />
        <div className="flex flex-1 overflow-hidden">
          <AdminSidebar user={adminUser} />
          <main className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-[#c3c4c7] scrollbar-track-transparent">
            {children}
          </main>
        </div>
      </div>
    </GlobalStoreProvider>
  );
}
