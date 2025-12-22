//app/actions/settings/payments/stripe/test_connection.ts

"use server"

import { db } from "@/lib/db"
import Stripe from "stripe"

export async function testStripeConnection(paymentMethodId: string) {
  try {
    const config = await db.stripeConfig.findUnique({
      where: { paymentMethodId }
    })

    if (!config) {
      return { success: false, error: "Configuration not found." }
    }

    const secretKey = config.testMode ? config.testSecretKey : config.liveSecretKey

    if (!secretKey) {
      return { success: false, error: "No API Key found." }
    }

    const stripe = new Stripe(secretKey, {
      apiVersion: "2025-01-27.acacia" as any, // বা তোমার ভার্সন
      typescript: true,
    })

    // ১. একই সাথে ব্যালেন্স এবং অ্যাকাউন্টের তথ্য আনা
    const [balance, account] = await Promise.all([
      stripe.balance.retrieve(),
      stripe.accounts.retrieve()
    ]);

    // ২. সফল হলে সব তথ্য রিটার্ন করা
    return { 
      success: true, 
      message: "Verified",
      data: {
        mode: balance.livemode ? 'Live' : 'Test',
        currency: balance.available[0]?.currency.toUpperCase(),
        account_email: account.email || "N/A", // স্ট্রাইপ অ্যাকাউন্টের ইমেইল
        account_id: account.id, // যেমন: acct_1Hq...
        payouts_enabled: account.payouts_enabled, // টাকা তোলা যাবে কি না
        charges_enabled: account.charges_enabled, // পেমেন্ট নেওয়া যাবে কি না
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