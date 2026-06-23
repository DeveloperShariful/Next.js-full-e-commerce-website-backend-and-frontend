// app/(frontend)/my-account/layout.tsx

import React from "react";
import { GlobalStoreProvider } from "@/app/providers/global-store-provider";
import { serializePrismaData } from "@/lib/format-data";
import { buildGlobalStoreData } from "@/lib/build-global-data";

export default async function MyAccountLayout({ children }: { children: React.ReactNode }) {
  const rawData = await buildGlobalStoreData();
  const cleanData = serializePrismaData(rawData);

  return (
    <GlobalStoreProvider
      settings={cleanData.settings}
      paymentMethods={cleanData.paymentMethods}
      pickupLocations={cleanData.pickupLocations}
    >
      <div className="w-full min-h-screen bg-[#f0f0f1] antialiased">
        {children}
      </div>
    </GlobalStoreProvider>
  );
}
