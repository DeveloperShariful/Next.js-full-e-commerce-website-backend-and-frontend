//File 1: app/actions/frontend/checkout/get-payment-methods.ts

"use server";

import { unstable_cache } from "next/cache";
import { db } from "@/lib/prisma";
import {
  PaymentGatewayUI,
  StripeSettingsSchema,
  PaypalSettingsSchema,
  OfflineSettingsSchema
} from "@/app/(backend)/admin/settings/payments/types-and-schemas";

// Strips dangerous HTML server-side before the description reaches the client.
// Removes: <script>, <iframe>, <object>, <embed>, <form>, <input> and all event handlers.
// Keeps safe formatting: <p>, <br>, <strong>, <em>, <ul>, <li>, <a href> (non-JS only).
function sanitizeDescription(html: string | null): string | null {
  if (!html) return null;
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<(iframe|object|embed|form|input|button|link|meta|base)[^>]*\/?>/gi, '')
    .replace(/\s+on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\s+on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
}

async function _getActivePaymentMethods(): Promise<PaymentGatewayUI[]> {
  try {
    const gateways = await db.paymentGateway.findMany({
      where: { isEnabled: true },
      orderBy: { displayOrder: 'asc' }
    });

    const formattedMethods: PaymentGatewayUI[] = gateways.map((g) => {
      let parsedSettings: PaymentGatewayUI["settings"] = null;

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
        description: sanitizeDescription(g.description),
        isEnabled: g.isEnabled,
        isConnected: g.isConnected,
        mode: g.mode,
        publicKey: g.publicKey,
        webhookUrl: g.webhookUrl,
        webhookSecret: null,
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

// Cache for 5 minutes — payment methods rarely change.
// To invalidate after admin update, call revalidateTag('payment-methods').
export const getActivePaymentMethods = unstable_cache(
  _getActivePaymentMethods,
  ['payment-methods'],
  { revalidate: 300, tags: ['payment-methods'] }
);
