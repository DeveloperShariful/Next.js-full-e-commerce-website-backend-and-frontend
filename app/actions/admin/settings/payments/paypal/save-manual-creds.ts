// app/actions/settings/payments/paypal/save-manual-creds.ts
"use server"

import { db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { encrypt } from "../crypto" // 👈 Encryption Import

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
    const verification = await verifyPaypalCredentials(
      data.sandbox, 
      data.clientId, 
      data.clientSecret
    )

    if (!verification.success) {
      return { 
        success: false, 
        error: verification.message || "Invalid Client ID or Secret." 
      }
    }
    const encryptedSecret = encrypt(data.clientSecret)
    const updateData = data.sandbox
      ? {
          sandbox: true,
          sandboxClientId: data.clientId, 
          sandboxClientSecret: encryptedSecret, 
          sandboxEmail: data.email,
          merchantId: data.merchantId,
        }
      : {
          sandbox: false,
          liveClientId: data.clientId,
          liveClientSecret: encryptedSecret, 
          liveEmail: data.email,
          merchantId: data.merchantId,
        }
    await db.paypalConfig.upsert({
      where: { paymentMethodId },
      create: { paymentMethodId, ...updateData, isOnboarded: false, title: "PayPal",
      },
      update: { ...updateData, isOnboarded: false,
      }
    })
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


async function verifyPaypalCredentials(isSandbox: boolean, clientId: string, clientSecret: string) {
  const baseUrl = isSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com"

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
      const errorMessage = data.error_description || data.error || "Authentication failed with PayPal."
      return { success: false, message: errorMessage }
    }
  } catch (error) {
    console.error("PayPal verification network error:", error)
    return { success: false, message: "Network Error: Could not connect to PayPal." }
  }
}