//app/actions/storefront/checkout/stripe-payment.ts

"use server"

import { db } from "@/lib/prisma"
import Stripe from "stripe"
import { decrypt } from "@/app/actions/admin/settings/payments/crypto"
import { secureAction } from "@/lib/server-action-wrapper"
import { calculateCartTotals } from "./checkout-utils"
import { z } from "zod"

async function getStripeInstance() {
  const config = await db.stripeConfig.findFirst({ include: { paymentMethod: true } });
  if (!config || !config.paymentMethod.isEnabled) return null;
  
  const rawKey = config.testMode ? config.testSecretKey : config.liveSecretKey;
  const secretKey = rawKey ? decrypt(rawKey) : "";
  if (!secretKey) return null;

  return { 
      stripe: new Stripe(secretKey, { apiVersion: "2025-01-27.acacia" as any }),
      config 
  };
}

const CreateIntentSchema = z.object({
    cartId: z.string().min(1, "Cart ID is required"),
    shippingMethodId: z.string().optional(),
    shippingAddress: z.any().optional(),
    couponCode: z.string().optional(),
    metadata: z.any().optional()
});

export async function createPaymentIntent(params: z.infer<typeof CreateIntentSchema>) {
  return secureAction(
    params,
    { actionName: "CREATE_STRIPE_INTENT", schema: CreateIntentSchema, role: "PUBLIC" },
    async (input) => {
        const instance = await getStripeInstance();
        if (!instance) throw new Error("Stripe Unavailable");
        const { stripe } = instance;
        const { totalsInCents } = await calculateCartTotals(
            input.cartId, 
            input.shippingMethodId, 
            input.shippingAddress, 
            input.couponCode,
            "stripe" 
        );
        
        const finalAmountCents = totalsInCents.total;

        if (finalAmountCents < 50) {
            throw new Error("Total amount must be at least $0.50");
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: finalAmountCents, 
            currency: "aud",
            automatic_payment_methods: { enabled: true },
            metadata: {
                cartId: input.cartId,
                shippingMethodId: input.shippingMethodId || "",
                couponCode: input.couponCode || "",
                ...input.metadata
            }
        });

        return { 
            success: true, 
            data: {
                clientSecret: paymentIntent.client_secret, 
                id: paymentIntent.id 
            }
        };
    }
  );
}

const UpdateIntentSchema = z.object({
    paymentIntentId: z.string().min(1),
    cartId: z.string().min(1),
    shippingMethodId: z.string().optional(),
    shippingAddress: z.any().optional(),
    couponCode: z.string().optional()
});

export async function updatePaymentIntent(params: z.infer<typeof UpdateIntentSchema>) {
  return secureAction(
    params,
    { actionName: "UPDATE_STRIPE_INTENT", schema: UpdateIntentSchema, role: "PUBLIC" },
    async (input) => {
        const instance = await getStripeInstance();
        if (!instance) throw new Error("Stripe Unavailable");
        const { stripe } = instance;

        const { totalsInCents } = await calculateCartTotals(
            input.cartId, 
            input.shippingMethodId, 
            input.shippingAddress, 
            input.couponCode,
            "stripe"
        );

        if (totalsInCents.total < 50) {
            throw new Error("Total amount must be at least $0.50");
        }

        await stripe.paymentIntents.update(input.paymentIntentId, {
            amount: totalsInCents.total,
            metadata: {
                cartId: input.cartId,
                shippingMethodId: input.shippingMethodId || "",
                couponCode: input.couponCode || ""
            }
        });

        return { success: true, data: { updated: true } };
    }
  );
}

const LinkOrderSchema = z.object({
    paymentIntentId: z.string(),
    orderId: z.string()
});

export async function linkOrderToPaymentIntent(params: z.infer<typeof LinkOrderSchema>) {
    return secureAction(params, { actionName: "LINK_STRIPE_ORDER", schema: LinkOrderSchema, role: "PUBLIC" }, async (input) => {
        const instance = await getStripeInstance();
        if (!instance) return { success: false, error: "Stripe missing" };
        
        await instance.stripe.paymentIntents.update(input.paymentIntentId, {
            metadata: { orderId: input.orderId }
        });
        return { success: true, data: { linked: true } };
    });
}