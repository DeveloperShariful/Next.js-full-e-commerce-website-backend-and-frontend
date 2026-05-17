// File Location: app/actions/order/create-order/get-payment-methods.ts

"use server";

import { db } from "@/lib/prisma";

export async function getActivePaymentMethods() {
  try {
    // শুধুমাত্র চালু থাকা (Enabled) পেমেন্ট মেথডগুলো আনা হচ্ছে
    const methods = await db.paymentMethodConfig.findMany({
      where: { isEnabled: true }, 
      orderBy: { displayOrder: 'asc' }, // অ্যাডমিনের সাজানো অর্ডারে
      include: {
        stripeConfig: true, 
        paypalConfig: true  
      }
    });

    return methods;
  } catch (error) {
    console.error("GET_PAYMENT_METHODS_ERROR", error);
    return [];
  }
}