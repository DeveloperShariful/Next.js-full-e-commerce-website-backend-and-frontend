//app/actions/storefront/checkout/get-available-payments.ts

"use server"

import { db } from "@/lib/prisma"
import { decrypt } from "@/app/actions/admin/settings/payments/crypto"

export type PaymentOption = {
  id: string
  provider: string
  method_type: string
  name: string
  description: string | null
  icon?: string
  is_express: boolean
  mode: "TEST" | "LIVE"
  public_key?: string 
}

export async function getAvailablePaymentMethods(): Promise<PaymentOption[]> {
  try {
    const methods = await db.paymentMethodConfig.findMany({
      where: { isEnabled: true },
      include: {
        stripeConfig: true,
        paypalConfig: true,
        offlineConfig: true
      },
      orderBy: { displayOrder: "asc" }
    })

    const options: PaymentOption[] = []

    for (const method of methods) {
      
      // === STRIPE ===
      if (method.identifier === "stripe" && method.stripeConfig) {
        const config = method.stripeConfig
        const mode = config.testMode ? "TEST" : "LIVE"
        
        // 🔐 Security Fix: Decrypt keys properly
        const rawTestKey = config.testPublishableKey ? decrypt(config.testPublishableKey) : "";
        const rawLiveKey = config.livePublishableKey ? decrypt(config.livePublishableKey) : "";
        const stripePubKey = config.testMode ? rawTestKey : rawLiveKey;

        // 1. Credit/Debit Card
        options.push({
          id: "stripe_card",
          provider: "stripe",
          method_type: "card",
          name: config.title || "Credit / Debit Card",
          description: config.description,
          is_express: false,
          mode: mode,
          public_key: stripePubKey || undefined
        })

        // 2. Klarna (BNPL)
        if (config.klarnaEnabled) {
             options.push({
                id: "stripe_klarna",
                provider: "stripe",
                method_type: "bnpl",
                name: "Klarna",
                description: "Pay in 3 interest-free installments.",
                is_express: false,
                mode: mode,
                public_key: stripePubKey || undefined
            })
        }

        // 3. Afterpay (BNPL) - ✅ Added Back
        if (config.afterpayEnabled) {
            options.push({
               id: "stripe_afterpay_clearpay",
               provider: "stripe",
               method_type: "bnpl",
               name: "Afterpay",
               description: "Buy now, pay later.",
               is_express: false,
               mode: mode,
               public_key: stripePubKey || undefined
            })
       }

       // 4. Zip (BNPL) - ✅ Added Back
       if (config.zipEnabled) {
            options.push({
               id: "stripe_zip",
               provider: "stripe",
               method_type: "bnpl",
               name: "Zip",
               description: "Own it now, pay later.",
               is_express: false,
               mode: mode,
               public_key: stripePubKey || undefined
            })
       }
      } 
      
      // === PAYPAL ===
      else if (method.identifier === "paypal" && method.paypalConfig) {
        const config = method.paypalConfig
        
        // 🔐 Security Fix: Ensure correct Client ID
        const rawSandboxId = config.sandboxClientId ? config.sandboxClientId : ""; 
        const rawLiveId = config.liveClientId ? config.liveClientId : "";
        const paypalClientId = config.sandbox ? rawSandboxId : rawLiveId;

        options.push({
          id: "paypal",
          provider: "paypal",
          method_type: "wallet",
          name: config.title || "PayPal",
          description: config.description,
          is_express: false,
          mode: config.sandbox ? "TEST" : "LIVE",
          public_key: paypalClientId || undefined
        })
      }

      // === OFFLINE ===
      else {
        options.push({
          id: method.identifier,
          provider: "offline",
          method_type: "manual",
          name: method.name,
          description: method.description,
          is_express: false,
          mode: method.mode
        })
      }
    }

    return options

  } catch (error) {
    console.error("Fetch Payment Options Error:", error)
    return []
  }
}