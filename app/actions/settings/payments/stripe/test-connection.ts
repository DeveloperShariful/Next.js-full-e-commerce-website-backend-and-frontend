"use server"

import { db } from "@/lib/db"
import Stripe from "stripe"

export async function testStripeConnection(paymentMethodId: string) {
  try {
    // ১. ডাটাবেস থেকে কনফিগারেশন আনছি
    const config = await db.stripeConfig.findUnique({
      where: { paymentMethodId }
    })

    if (!config) {
      return { success: false, error: "Configuration not found in database." }
    }

    // ২. টেস্ট বা লাইভ মোড অনুযায়ী সঠিক সিক্রেট কি নিচ্ছি
    const secretKey = config.testMode ? config.testSecretKey : config.liveSecretKey

    if (!secretKey) {
      return { success: false, error: "No API Key found. Please save keys first." }
    }

    // ৩. Stripe এর সাথে কানেক্ট করার চেষ্টা
    const stripe = new Stripe(secretKey, {
      apiVersion: "2025-12-15.clover" as any, // অথবা লেটেস্ট ভার্সন
      typescript: true,
    })

    // ৪. ব্যালেন্স চেক (এটা জাস্ট কানেকশন টেস্ট, টাকা কাটবে না)
    const balance = await stripe.balance.retrieve()

    // ৫. সফল হলে মেসেজ রিটার্ন
    return { 
      success: true, 
      message: `Connection Successful! Mode: ${balance.livemode ? 'Live' : 'Test'}. Currency: ${balance.available[0]?.currency.toUpperCase()}` 
    }

  } catch (error: any) {
    console.error("Stripe Connection Test Failed:", error)
    return { 
      success: false, 
      error: error.message || "Failed to connect to Stripe. Check your keys." 
    }
  }
}