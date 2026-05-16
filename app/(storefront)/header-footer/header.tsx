// app/(storefront)/header-footer/header.tsx

import { db } from "@/lib/prisma";
import { auth } from "@/auth"; 
import HeaderClient from "./header-client";
async function getAffiliateStatus(userId?: string) {
  try {
    if (!userId) return false;
    
    const account = await db.affiliateAccount.findUnique({
      where: { userId: userId },
      select: { status: true }
    });

    const status = account?.status;
    return status === "ACTIVE" || status === "PENDING" || status === "SUSPENDED" ? true : false;
  } catch (error) {
    console.error("Error fetching affiliate status:", error);
    return false;
  }
}

export default async function Header() {
  const session = await auth(); 
  const isAffiliate = await getAffiliateStatus(session?.user?.id);

  return <HeaderClient isAffiliate={isAffiliate} />;
}