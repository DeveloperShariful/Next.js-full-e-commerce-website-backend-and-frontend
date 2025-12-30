// app/actions/settings/payments/paypal/save-manual-creds.ts
"use server"

import { db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function savePaypalManualCreds(
  paymentMethodId: string,
  data: {
    sandbox: boolean
    clientId: string
    clientSecret: string
    email?: string
    merchantId?: string
  }
) {
  try {
    // ১. PayPal ক্রেডেনশিয়াল ভেরিফাই করা (সাথে এরর মেসেজ ধরা)
    const verification = await verifyPaypalCredentials(
      data.sandbox, 
      data.clientId, 
      data.clientSecret
    )

    // যদি ভেরিফিকেশন ফেইল করে, তাহলে নির্দিষ্ট কারণসহ এরর রিটার্ন করব
    if (!verification.success) {
      return { 
        success: false, 
        error: verification.message || "Invalid Client ID or Secret." 
      }
    }

    // ২. ডাটা প্রস্তুত করা (Prepare Data)
    const updateData = data.sandbox
      ? {
          sandbox: true,
          sandboxClientId: data.clientId,
          sandboxClientSecret: data.clientSecret,
          sandboxEmail: data.email,
          merchantId: data.merchantId,
        }
      : {
          sandbox: false,
          liveClientId: data.clientId,
          liveClientSecret: data.clientSecret,
          liveEmail: data.email,
          merchantId: data.merchantId,
        }

    // ৩. ডাটাবেসে সেভ করা
    await db.paypalConfig.upsert({
      where: { paymentMethodId },
      create: {
        paymentMethodId,
        ...updateData,
        isOnboarded: false,
        title: "PayPal",
      },
      update: {
        ...updateData,
        isOnboarded: false,
      }
    })

    // ৪. মেথড এনাবল করা
    await db.paymentMethodConfig.update({
      where: { id: paymentMethodId },
      data: {
        mode: data.sandbox ? "TEST" : "LIVE",
        isEnabled: true 
      }
    })

    revalidatePath("/admin/settings/payments")
    return { success: true }
  } catch (error) {
    console.error("PayPal manual creds error:", error)
    return { success: false, error: "System Error: Failed to save credentials." }
  }
}

// 👇 আপডেটেড হেল্পার ফাংশন: এখন কারণসহ রেজাল্ট রিটার্ন করবে
async function verifyPaypalCredentials(isSandbox: boolean, clientId: string, clientSecret: string) {
  const baseUrl = isSandbox 
    ? "https://api-m.sandbox.paypal.com" 
    : "https://api-m.paypal.com"

  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
    
    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      cache: "no-store"
    })

    const data = await response.json()
    
    if (response.ok && data.access_token) {
      return { success: true }
    } else {
      // PayPal এরর ডেসক্রিপশন ধরছি
      const errorMessage = data.error_description || data.error || "Authentication failed with PayPal."
      return { success: false, message: errorMessage }
    }
  } catch (error) {
    console.error("PayPal verification network error:", error)
    return { success: false, message: "Network Error: Could not connect to PayPal." }
  }
}