//app/(storefront)/affiliates/layout.tsx

import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import { requireUser } from "@/app/actions/storefront/affiliates/auth-helper";
import DashboardShell from "./_components/dashboard-shell"; // ✅ Import new client shell

export default async function AffiliateDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await requireUser();

  const affiliateAccount = await db.affiliateAccount.findUnique({
    where: { userId },
    select: { id: true, status: true }
  });

  if (!affiliateAccount) {
    redirect("/affiliates/register");
  }

  if (affiliateAccount.status === "SUSPENDED" || affiliateAccount.status === "REJECTED") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
        <div className="max-w-md p-8 bg-white shadow rounded-xl text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Account Suspended</h2>
          <p className="text-gray-600">
            Your partner account has been suspended. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  // ✅ Pass children to the Client Shell
  return <DashboardShell>{children}</DashboardShell>;
}