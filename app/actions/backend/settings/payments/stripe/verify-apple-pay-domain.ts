// app/actions/settings/payments/stripe/verify-apple-pay-domain.ts

"use server"

import { db } from "@/lib/prisma"
import Stripe from "stripe"
import { decrypt } from "../crypto"

export async function verifyApplePayDomain(paymentMethodId: string) {
  try {
    const config = await db.stripeConfig.findUnique({
      where: { paymentMethodId }
    })

    if (!config) throw new Error("Stripe configuration not found")

    const encryptedKey = config.testMode ? config.testSecretKey : config.liveSecretKey
    const secretKey = decrypt(encryptedKey ?? "")

    if (!secretKey) throw new Error("Stripe API Key is missing")

    const stripe = new Stripe(secretKey, {
      apiVersion: "2025-01-27.acacia" as any,
      typescript: true,
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) throw new Error("NEXT_PUBLIC_APP_URL is not defined")

    const domain = new URL(appUrl).hostname

    await stripe.applePayDomains.create({
      domain_name: domain
    })

    return { success: true, message: `Domain ${domain} verified successfully` }

  } catch (error: any) {
    console.error("Apple Pay Verification Error:", error)
    return { success: false, error: error.message || "Failed to verify domain" }
  }
}