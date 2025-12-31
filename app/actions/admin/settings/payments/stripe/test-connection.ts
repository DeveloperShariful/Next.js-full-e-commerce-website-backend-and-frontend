// app/actions/settings/payments/stripe/test-connection.ts
"use server"

import { db } from "@/lib/prisma"
import Stripe from "stripe"
import { decrypt } from "../crypto" 

export async function testStripeConnection(paymentMethodId: string) {
  try {
    const config = await db.stripeConfig.findUnique({
      where: { paymentMethodId }
    })

    if (!config) {
      return { success: false, error: "Configuration not found." }
    }

    // 1. Get the correct encrypted key based on mode
    const encryptedKey = config.testMode ? config.testSecretKey : config.liveSecretKey

    if (!encryptedKey) {
      return { success: false, error: "No API Key found." }
    }

    // 2. Decrypt the key before using it
    const secretKey = decrypt(encryptedKey)

    if (!secretKey) {
        return { success: false, error: "Invalid API Key format." }
    }

    // 3. Initialize Stripe
    const stripe = new Stripe(secretKey, {
      apiVersion: "2025-01-27.acacia" as any, 
      typescript: true,
    })

    // 4. Test API Call
    const [balance, account] = await Promise.all([
      stripe.balance.retrieve(),
      stripe.accounts.retrieve()
    ]);

    return { 
      success: true, 
      message: "Verified",
      data: {
        mode: balance.livemode ? 'Live' : 'Test',
        currency: balance.available[0]?.currency.toUpperCase(),
        account_email: account.email || "N/A",
        account_id: account.id,
        payouts_enabled: account.payouts_enabled,
        charges_enabled: account.charges_enabled,
        country: account.country
      }
    }

  } catch (error: any) {
    console.error("Stripe Connection Test Failed:", error)
    return { 
      success: false, 
      error: error.message || "Failed to connect to Stripe." 
    }
  }
}