//app/actions/storefront/checkout/get-available-payments.ts
"use server"

import { db } from "@/lib/prisma"

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
        const stripePubKey = config.testMode ? config.testPublishableKey : config.livePublishableKey

        options.push({
          id: "stripe_card",
          provider: "stripe",
          method_type: "card",
          name: config.title || "Credit / Debit Card",
          description: config.description,
          is_express: false,
          mode: mode,
          public_key: stripePubKey ?? undefined
        })

        if (config.klarnaEnabled) {
            options.push({
                id: "stripe_klarna",
                provider: "stripe",
                method_type: "bnpl",
                name: "Klarna",
                description: "Pay in 3 interest-free installments.",
                is_express: false,
                mode: mode,
                public_key: stripePubKey ?? undefined
            })
        }
        if (config.afterpayEnabled) {
             options.push({
                id: "stripe_afterpay_clearpay",
                provider: "stripe",
                method_type: "bnpl",
                name: "Afterpay",
                description: "Buy now, pay later.",
                is_express: false,
                mode: mode,
                public_key: stripePubKey ?? undefined
             })
        }
        if (config.zipEnabled) {
             options.push({
                id: "stripe_zip",
                provider: "stripe",
                method_type: "bnpl",
                name: "Zip",
                description: "Own it now, pay later.",
                is_express: false,
                mode: mode,
                public_key: stripePubKey ?? undefined
             })
        }
      } 
      
      // === PAYPAL (Project B Style: No Decryption, Raw Value) ===
      else if (method.identifier === "paypal" && method.paypalConfig) {
        const config = method.paypalConfig
        
        // সোজাসুজি ডাটাবেস ভ্যালু
        const paypalClientId = config.sandbox 
            ? config.sandboxClientId 
            : config.liveClientId

        options.push({
          id: "paypal",
          provider: "paypal",
          method_type: "wallet",
          name: config.title,
          description: config.description,
          is_express: false,
          mode: config.sandbox ? "TEST" : "LIVE",
          public_key: paypalClientId ?? undefined
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