//app/actions/admin/order/get-tax-rate.ts

"use server";

import { db } from "@/lib/prisma";

export async function getTaxRate(country: string, state?: string) {
  try {
    const taxRates = await db.taxRate.findMany({
      where: {
        isActive: true,
        OR: [
          { country: country, state: state },
          { country: country, state: null },
          { country: null, state: null }
        ]
      },
      orderBy: { priority: 'asc' }
    });

    const matchedRate = taxRates.find(r => r.country === country && r.state === state) 
                     || taxRates.find(r => r.country === country && !r.state)
                     || taxRates.find(r => !r.country);

    return { 
      rate: matchedRate ? Number(matchedRate.rate) : 0,
      taxName: matchedRate ? matchedRate.name : "Tax"
    };

  } catch (error) {
    return { rate: 0, taxName: "Tax" };
  }
}