// File: app/actions/admin/settings/affiliates/_services/invoice-service.ts

"use server";

import { db } from "@/lib/prisma";

// Note: We removed jsPDF imports from here. 
// This file only fetches data. PDF generation happens on the Client Side.

export async function getInvoiceData(payoutId: string) {
  const payout = await db.affiliatePayout.findUnique({
    where: { id: payoutId },
    include: {
      affiliate: {
        include: {
          user: { select: { name: true, email: true, addresses: true } }
        }
      }
    }
  });

  if (!payout) throw new Error("Payout not found");

  const settings = await db.storeSettings.findUnique({ where: { id: "settings" } });

  // Return clean JSON for Client Component to render PDF
  return {
    invoiceNo: `INV-${payout.id.substring(0, 8).toUpperCase()}`,
    date: payout.createdAt.toISOString().split("T")[0],
    storeName: settings?.storeName || "GoBike Store",
    // storeAddress: settings?.storeAddress || "Dhaka, Bangladesh", // Uncomment if address exists in schema
    affiliateName: payout.affiliate.user.name,
    affiliateEmail: payout.affiliate.user.email,
    amount: payout.amount.toNumber(),
    method: payout.method,
    status: payout.status,
    items: [
        { description: "Affiliate Commission Payout", amount: payout.amount.toNumber() }
    ]
  };
}