// app/(frontend)/header-footer/header.tsx

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

// 🛡️ Securely fetch the user role directly from Prisma DB
async function getUserRole(userId?: string) {
  try {
    if (!userId) return null;
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true } // Assuming 'role' is your database Enum column
    });
    return user?.role || null;
  } catch (error) {
    console.error("Error fetching user role:", error);
    return null;
  }
}

export default async function Header() {
  const session = await auth(); 
  const isAffiliate = await getAffiliateStatus(session?.user?.id);
  const userRole = await getUserRole(session?.user?.id); // 👈 Fetches role safely

  return <HeaderClient isAffiliate={isAffiliate} userRole={userRole} />;
}