// app/actions/storefront/header-footer/header.tsx

import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import HeaderClient from "./header-client";

/**
 * SERVER COMPONENT
 * Responsibility: Fetch Server-Side Data (Cookies, DB) only.
 * Passes data to the Client Component for UI rendering.
 */
async function getCartCount() {
  try {
    const cookieStore = await cookies();
    const cartId = cookieStore.get("cartId")?.value;
    
    if (!cartId) return 0;

    const count = await db.cartItem.count({
      where: { cartId }
    });
    
    return count;
  } catch (error) {
    console.error("[HEADER] Cart Count Error:", error);
    return 0;
  }
}

const Header = async () => {
  // Fetch data on the server
  const cartCount = await getCartCount();

  // Pass to Client Component
  return <HeaderClient cartCount={cartCount} />;
};

export default Header;