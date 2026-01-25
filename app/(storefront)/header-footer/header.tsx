// app/actions/storefront/header-footer/header.tsx

import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import HeaderClient from "./header-client";
import { syncUser } from "@/lib/auth-sync";

async function getCartCount() {
  try {
    const cookieStore = await cookies();
    const cartId = cookieStore.get("cartId")?.value;
    if (!cartId) return 0;
    return await db.cartItem.count({ where: { cartId } });
  } catch (error) {
    return 0;
  }
}

async function getAffiliateStatus() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return false;

    const dbUser = await db.user.findUnique({
      where: { clerkId: clerkId },
      select: { id: true }
    });

    if (!dbUser) return false;

    const account = await db.affiliateAccount.findUnique({
      where: { userId: dbUser.id },
      select: { status: true }
    });

    return account?.status === "ACTIVE";
  } catch (error) {
    return false;
  }
}

const Header = async () => {
  await syncUser();

  const [cartCount, isAffiliate] = await Promise.all([
    getCartCount(),
    getAffiliateStatus()
  ]);

  return <HeaderClient cartCount={cartCount} isAffiliate={isAffiliate} />;
};

export default Header;