//app/actions/storefront/checkout/stripe-payment.ts
"use server"

import { db } from "@/lib/prisma"
import Stripe from "stripe"
import { decrypt } from "@/app/actions/admin/settings/payments/crypto"

async function getStripeInstance() {
  const config = await db.stripeConfig.findFirst({
    include: { paymentMethod: true }
  })
  
  if (!config) return null
  
  const secretKey = config.testMode ? config.testSecretKey : config.liveSecretKey
  const decryptedKey = decrypt(secretKey ?? "")
  
  if (!decryptedKey) return null

  return new Stripe(decryptedKey, {
    apiVersion: "2025-01-27.acacia" as any,
    typescript: true,
  })
}

export async function createPaymentIntent(amount: number, metadata: any = {}) {
  try {
    const stripe = await getStripeInstance()
    if (!stripe) throw new Error("Stripe not configured")

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "aud",
      automatic_payment_methods: { enabled: true },
      metadata: metadata
    })

    return { clientSecret: paymentIntent.client_secret, id: paymentIntent.id }
  } catch (error: any) {
    console.error("Create Intent Error:", error)
    return { error: error.message }
  }
}

export async function updatePaymentIntent(paymentIntentId: string, amount: number, orderId?: string) {
  try {
    const stripe = await getStripeInstance()
    if (!stripe) throw new Error("Stripe not configured")

    const updateData: Stripe.PaymentIntentUpdateParams = {
        amount: Math.round(amount * 100)
    }

    if (orderId) {
        updateData.description = `Order #${orderId}`
        updateData.metadata = { order_id: orderId }
    }

    await stripe.paymentIntents.update(paymentIntentId, updateData)
    return { success: true }
  } catch (error: any) {
    console.error("Update Intent Error:", error)
    return { error: error.message }
  }
}