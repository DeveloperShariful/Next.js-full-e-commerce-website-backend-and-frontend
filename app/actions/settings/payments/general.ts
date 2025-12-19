// File: app/actions/settings/payments/general.ts

"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// 1. GET ALL METHODS
export async function getPaymentMethods() {
  try {
    const methods = await db.paymentMethodConfig.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        stripeConfig: true, // Include Stripe Data if exists
        paypalConfig: true, // Include PayPal Data if exists
      }
    });
    return { success: true, data: methods };
  } catch (error) {
    console.error("GET_PAYMENTS_ERROR", error);
    return { success: false, error: "Failed to fetch payment methods" };
  }
}

// 2. TOGGLE ENABLE/DISABLE STATUS
export async function togglePaymentMethod(id: string, isEnabled: boolean) {
  try {
    await db.paymentMethodConfig.update({
      where: { id },
      data: { isEnabled }
    });
    revalidatePath("/admin/settings/payments");
    return { success: true, message: "Status updated" };
  } catch (error) {
    return { success: false, error: "Failed to update status" };
  }
}

// 3. SEED DEFAULT METHODS (Run once if list is empty)
export async function seedPaymentMethods() {
    const defaults = [
        { identifier: 'bacs', name: 'Direct Bank Transfer', description: 'Make your payment directly into our bank account. Please use your Order ID as the payment reference. Your order will not be shipped until the funds have cleared in our account.' },
        { identifier: 'cheque', name: 'Check payments', description: 'Please send a check to Store Name, Store Street, Store Town, Store State / County, Store Postcode.' },
        { identifier: 'cod', name: 'Cash on delivery', description: 'Pay with cash upon delivery.' },
        { identifier: 'stripe', name: 'Credit Card (Stripe)', description: 'Pay with your credit card via Stripe.' },
        { identifier: 'paypal', name: 'PayPal', description: 'Pay via PayPal; you can pay with your credit card if you don’t have a PayPal account.' },
    ];

    try {
        for (const d of defaults) {
            const exists = await db.paymentMethodConfig.findUnique({ where: { identifier: d.identifier } });
            if (!exists) {
                await db.paymentMethodConfig.create({
                    data: {
                        identifier: d.identifier,
                        name: d.name,
                        description: d.description,
                        settings: {}, // Default empty JSON for generic settings
                        isEnabled: false
                    }
                });
            }
        }
        revalidatePath("/admin/settings/payments");
        return { success: true, message: "Default methods seeded successfully" };
    } catch (error) {
        console.error("SEED_ERROR", error);
        return { success: false, error: "Failed to seed defaults" };
    }
}