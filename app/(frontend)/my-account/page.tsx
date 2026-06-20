//// File: app/(frontend)/my-account/page.tsx

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { redirect } from "next/navigation";
import { syncUser } from "@/lib/auth-sync";
import { db } from "@/lib/prisma";
import { serializePrismaData } from "@/lib/format-data";
import { getCachedStoreSettings } from "@/lib/global-settings-cache";
import { parseTabVisibility } from "@/app/actions/backend/settings/my-account/tab-config";
import AccountMainView from "./_components/account-main-view";

// Services
import { getCustomerOrders } from "@/app/actions/frontend/my-account/order-service";

export const metadata = {
  title: "My Account | GoBike Australia",
  description: "Manage your profile, orders, subscriptions, and wallet.",
};

export default async function MyAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const user = await syncUser();
  if (!user) {
    redirect("/sign-in");
  }

  const params = await searchParams;
  const activeTab = params.tab || "dashboard";

  // Admin-controlled tab visibility (from StoreSettings.generalConfig.myAccountTabs)
  const storeSettings = await getCachedStoreSettings();
  const tabVisibility = parseTabVisibility(storeSettings?.generalConfig);

  const data: any = {};

  try {
    // 1. Fetch Core Profile
    data.user = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        notes: true,
        dateOfBirth: true,
        gender: true,
        metafields: true,
      }
    });

    // 2. Fetch Wallet Data
    data.wallet = await db.wallet.findUnique({
      where: { userId: user.id },
      include: {
        transactions: {
          take: 10,
          orderBy: { createdAt: "desc" }
        }
      }
    });

    // 3. Fetch Orders & Return Requests (Handles Auto-Guest Sync as well!)
    data.orders = await getCustomerOrders();

    // 4. Fetch Subscriptions
    data.subscriptions = await db.subscription.findMany({
      where: { userId: user.id },
      include: {
        plan: { include: { product: true } }
      }
    });

    // 5. Fetch Support Tickets
    data.tickets = await db.supportTicket.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: { orderBy: { createdAt: "asc" } }
      }
    });

    // 6. Fetch Warranty Claims
    data.warrantyClaims = await db.warrantyClaim.findMany({
      where: { email: user.email },
      orderBy: { createdAt: "desc" }
    });

    // 7. Fetch Wishlist Items
    data.wishlist = await db.wishlist.findMany({
      where: { userId: user.id },
      include: {
        product: true,
        variant: true
      }
    });

    // 8. Fetch Addresses
    data.addresses = await db.address.findMany({
      where: { userId: user.id }
    });

  } catch (error) {
    console.error("Failed to load customer dashboard:", error);
    data.error = "Failed to load account data. Please try again.";
  }

  return (
    <div className="bg-[#f0f0f1] min-h-screen w-full">
      <Suspense fallback={
        <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f0f0f1]">
            <Loader2 className="w-8 h-8 animate-spin text-[#2271b1] mb-2" />
            <p className="text-[13px] text-[#50575e]">Loading your account...</p>
        </div>
      }>
        <AccountMainView
          initialData={serializePrismaData(data)}
          activeTab={activeTab}
          tabVisibility={tabVisibility}
        />
      </Suspense>
    </div>
  );
}