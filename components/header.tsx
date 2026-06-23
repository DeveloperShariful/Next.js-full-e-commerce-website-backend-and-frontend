// @/components/header.tsx

import { auth } from "@/auth";
import { getAffiliateStatusSafe } from "@/lib/global-settings-cache";
import HeaderClient from "@/components/header-client";

export default async function Header() {
  const session = await auth();
  // role is already in the JWT token — no extra DB call needed
  const userRole = session?.user?.role || null;
  const isAffiliate = await getAffiliateStatusSafe(session?.user?.id);

  const initialUser = session?.user ? {
    id: session.user.id || '',
    name: session.user.name || null,
    email: session.user.email || '',
    image: session.user.image || null,
  } : null;

  return <HeaderClient isAffiliate={isAffiliate} userRole={userRole} initialUser={initialUser} />;
}