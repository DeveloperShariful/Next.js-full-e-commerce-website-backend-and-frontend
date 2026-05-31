//File 1: app/actions/frontend/checkout/get-payment-methods.ts

"use server";

import { db } from "@/lib/prisma";
import { 
  PaymentGatewayUI, 
  StripeSettingsSchema, 
  PaypalSettingsSchema, 
  OfflineSettingsSchema 
} from "@/app/(backend)/admin/settings/payments/types-and-schemas";

/**
 * এই অ্যাকশনটি চেকআউট পেজে পেমেন্ট অপশন রেন্ডার করার জন্য সমস্ত এক্টিভ মেথড নিয়ে আসে।
 * সিকিউরিটির জন্য এটি কোনো Secret Key বা এনক্রিপ্টেড ডাটা ফ্রন্টএন্ডে পাঠাবে না।
 */
export async function getActivePaymentMethods(): Promise<PaymentGatewayUI[]> {
  try {
    const gateways = await db.paymentGateway.findMany({
      where: { isEnabled: true },
      orderBy: { displayOrder: 'asc' }
    });

    const formattedMethods: PaymentGatewayUI[] = gateways.map((g) => {
      let parsedSettings: PaymentGatewayUI["settings"] = null;

      // টাইপ-সেফভাবে JSON সেটিংস বের করা হচ্ছে
      if (g.settings) {
        try {
          if (g.provider === "STRIPE") {
            parsedSettings = StripeSettingsSchema.parse(g.settings);
          } else if (g.provider === "PAYPAL") {
            parsedSettings = PaypalSettingsSchema.parse(g.settings);
          } else if (g.provider === "OFFLINE") {
            parsedSettings = OfflineSettingsSchema.parse(g.settings);
          }
        } catch (e) {
          console.error(`Invalid JSON Settings for ${g.identifier}`);
          parsedSettings = null; 
        }
      }

      return {
        id: g.id,
        identifier: g.identifier,
        provider: g.provider,
        name: g.name,
        title: g.title,
        description: g.description,
        isEnabled: g.isEnabled,
        isConnected: g.isConnected,
        mode: g.mode,
        publicKey: g.publicKey, // যেমন: Stripe-এর Publishable Key
        webhookUrl: g.webhookUrl,
        webhookSecret: null,    // নিরাপত্তার জন্য এটি গোপন রাখা হয়েছে
        minOrderAmount: g.minOrderAmount ? Number(g.minOrderAmount) : null,
        maxOrderAmount: g.maxOrderAmount ? Number(g.maxOrderAmount) : null,
        surchargeEnabled: g.surchargeEnabled,
        surchargeAmount: Number(g.surchargeAmount),
        settings: parsedSettings 
      };
    });

    return formattedMethods;
  } catch (error) {
    console.error("GET_PAYMENT_METHODS_ERROR:", error);
    return [];
  }
}