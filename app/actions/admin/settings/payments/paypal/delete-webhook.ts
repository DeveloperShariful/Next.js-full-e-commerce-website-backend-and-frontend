// app/actions/settings/payments/paypal/delete-webhook.ts
"use server"

import { db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { decrypt } from "../crypto" // 👈 Decryption Import

export async function deletePaypalWebhook(paymentMethodId: string) {
  try {
    const config = await db.paypalConfig.findUnique({ where: { paymentMethodId } })
    
    // যদি কনফিগারেশন না থাকে বা ওয়েবুক আইডি না থাকে, তবে এরর দেওয়ার দরকার নেই, সাকসেস রিটার্ন করি যাতে UI ক্লিন হয়
    if (!config || !config.webhookId) return { success: true }

    const isSandbox = config.sandbox
    const clientId = isSandbox ? config.sandboxClientId : config.liveClientId
    
    // ১. এনক্রিপ্টেড সিক্রেট ডিক্রিপ্ট করা
    const encryptedSecret = isSandbox ? config.sandboxClientSecret : config.liveClientSecret
    const clientSecret = decrypt(encryptedSecret ?? "")

    if (!clientId || !clientSecret) {
        return { success: false, error: "Credentials missing, cannot delete from PayPal." }
    }

    const baseUrl = isSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com"

    // ২. টোকেন নেওয়া
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
    const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: "POST",
        body: "grant_type=client_credentials",
        headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" }
    })
    const tokenData = await tokenRes.json()

    // ৩. PayPal থেকে ডিলিট করা
    if (tokenData.access_token) {
        // ওয়েবুক ডিলিট রিকোয়েস্ট
        await fetch(`${baseUrl}/v1/notifications/webhooks/${config.webhookId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${tokenData.access_token}` }
        })
    }

    // ৪. ডাটাবেস থেকে রিমুভ করা
    await db.paypalConfig.update({
      where: { paymentMethodId },
      data: { webhookId: null, webhookUrl: null }
    })

    revalidatePath("/admin/settings/payments")
    return { success: true }

  } catch (error) {
    console.error("PayPal Webhook Delete Error:", error)
    return { success: false, error: "Failed to delete webhook" }
  }
}