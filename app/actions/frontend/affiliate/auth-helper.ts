// app/actions/storefront/affiliates/auth-helper.ts

"use server";

import { db } from "@/lib/prisma";
import { syncUser } from "@/lib/auth-sync"; 
import { redirect } from "next/navigation";
import { serializePrismaData } from "@/lib/format-data"; 

export async function requireUser() {
  const user = await syncUser();
  if (!user) {
    return redirect("/sign-in");
  }
  return user.id;
}

export async function getAuthAffiliate() {
  const user = await syncUser();

  if (!user) {
    redirect("/sign-in");
  }

  const affiliate = await db.affiliateAccount.findUnique({
    where: { userId: user.id },
    include: {
      user: true,
      tier: true
      // ✅ FIXED: Removed 'group' because AffiliateGroup table is deleted. 
      // Tags are natively available in the affiliateAccount model if needed.
    }
  });

  if (!affiliate) {
    redirect("/affiliates/register"); 
  }

  if (affiliate.status === "REJECTED" || affiliate.status === "SUSPENDED") {
    throw new Error("Your affiliate account is suspended or rejected.");
  }

  // ✅ Serialize before returning to prevent Decimal errors anywhere
  return serializePrismaData(affiliate);
}