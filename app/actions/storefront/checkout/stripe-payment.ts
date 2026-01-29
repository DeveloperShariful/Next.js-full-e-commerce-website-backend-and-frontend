//app/actions/storefront/checkout/stripe-payment.ts

"use server"

import { db } from "@/lib/prisma"
import Stripe from "stripe"
import { decrypt } from "@/app/actions/admin/settings/payments/crypto"
import { calculateShippingServerSide } from "./get-shipping-rates"

async function getStripeInstance() {
  const config = await db.stripeConfig.findFirst({
    include: { paymentMethod: true }
  })
  
  if (!config) return null
  
  // 🔐 Security: Decrypt key
  const rawTestKey = config.testSecretKey ? decrypt(config.testSecretKey) : "";
  const rawLiveKey = config.liveSecretKey ? decrypt(config.liveSecretKey) : "";
  const secretKey = config.testMode ? rawTestKey : rawLiveKey;

  if (!secretKey) return null

  return new Stripe(secretKey, {
    apiVersion: "2025-01-27.acacia" as any, // আপনার ভার্সন অনুযায়ী
    typescript: true,
  })
}

// 🛡️ Secure: Calculate Total Server Side
async function calculateSecureTotal(cartId: string, shippingMethodId?: string, shippingAddress?: any) {
    const cart = await db.cart.findUnique({
        where: { id: cartId },
        include: { items: { include: { product: true, variant: true } } }
    });
    
    if (!cart) return 0;

    let subtotal = 0;
    cart.items.forEach(item => {
        const price = Number(item.variant ? (item.variant.salePrice || item.variant.price) : (item.product.salePrice || item.product.price));
        subtotal += price * item.quantity;
    });

    let shippingCost = 0;
    if (shippingMethodId && shippingAddress) {
        const cost = await calculateShippingServerSide(cartId, shippingAddress, shippingMethodId);
        shippingCost = cost || 0;
    }

    return subtotal + shippingCost;
}

export async function createPaymentIntent(cartId: string, shippingMethodId?: string, shippingAddress?: any, metadata: any = {}) {
  try {
    const stripe = await getStripeInstance()
    if (!stripe) throw new Error("Stripe not configured")

    // 🛡️ Calculate secure amount
    const amount = await calculateSecureTotal(cartId, shippingMethodId, shippingAddress);
    
    if (amount <= 0) throw new Error("Invalid amount");

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Cents
      currency: "aud",
      automatic_payment_methods: { enabled: true },
      metadata: {
          cartId: cartId,
          ...metadata
      }
    })

    return { clientSecret: paymentIntent.client_secret, id: paymentIntent.id }
  } catch (error: any) {
    console.error("Create Intent Error:", error)
    return { error: error.message }
  }
}

export async function updatePaymentIntent(paymentIntentId: string, cartId: string, shippingMethodId?: string, shippingAddress?: any, orderId?: string) {
  try {
    const stripe = await getStripeInstance()
    if (!stripe) throw new Error("Stripe not configured")

    // 🛡️ Re-Calculate secure amount
    const amount = await calculateSecureTotal(cartId, shippingMethodId, shippingAddress);

    const updateData: Stripe.PaymentIntentUpdateParams = {
        amount: Math.round(amount * 100)
    }

    if (orderId) {
        updateData.description = `Order #${orderId}`
        updateData.metadata = { order_id: orderId, cartId: cartId }
    }

    await stripe.paymentIntents.update(paymentIntentId, updateData)
    return { success: true }
  } catch (error: any) {
    console.error("Update Intent Error:", error)
    return { error: error.message }
  }
}