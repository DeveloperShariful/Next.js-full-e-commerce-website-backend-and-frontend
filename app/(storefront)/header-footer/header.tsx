// app/actions/storefront/header-footer/header.tsx

import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import { auth } from "@/auth"; 
import HeaderClient from "./header-client";

async function getCartCount() {
  try {
    const cookieStore = await cookies();
    const cartId = cookieStore.get("cartId")?.value;
    if (!cartId) return 0;
    return await db.cartItem.count({ where: { cartId } });
  } catch (error) {
    console.error("Error fetching cart count:", error);
    return 0;
  }
}

async function getAffiliateStatus() {
  try {
    const session = await auth(); 
    const userId = session?.user?.id;

    if (!userId) return false;
    const account = await db.affiliateAccount.findUnique({
      where: { userId: userId },
      select: { status: true }
    });

    return account?.status === "ACTIVE";
  } catch (error) {
    console.error("Error fetching affiliate status:", error);
    return false;
  }
}

const Header = async () => {
  
  const [cartCount, isAffiliate] = await Promise.all([
    getCartCount(),
    getAffiliateStatus()
  ]);

  return <HeaderClient cartCount={cartCount} isAffiliate={isAffiliate} />;
};

export default Header;