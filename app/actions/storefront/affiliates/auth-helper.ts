////app/actions/storefront/affiliates/auth-helper.ts

"use server";

import { db } from "@/lib/prisma";
import { syncUser } from "@/lib/auth-sync"; 
import { redirect } from "next/navigation";

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
      tier: true,
      group: true
    }
  });

  if (!affiliate) {
    redirect("/affiliates/register"); 
  }

  if (affiliate.status === "REJECTED" || affiliate.status === "SUSPENDED") {
    throw new Error("Your affiliate account is suspended or rejected.");
  }

  return affiliate;
}