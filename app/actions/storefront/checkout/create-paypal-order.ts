// app/actions/storefront/checkout/create-paypal-order.ts
"use server"

import { db } from "@/lib/prisma"
import { decrypt } from "@/app/actions/admin/settings/payments/crypto"
import { getCartCalculation } from "./get-cart-calculation"

export async function createPaypalOrder(cartId: string) {
  try {
    const methodConfig = await db.paymentMethodConfig.findUnique({
      where: { identifier: "paypal" },
      include: { paypalConfig: true }
    })

    if (!methodConfig?.isEnabled || !methodConfig.paypalConfig) {
      return { success: false, error: "PayPal is disabled." }
    }

    const config = methodConfig.paypalConfig
    
    // Decrypt Keys
    const isSandbox = config.sandbox
    const clientId = isSandbox ? config.sandboxClientId : config.liveClientId
    const encryptedSecret = isSandbox ? config.sandboxClientSecret : config.liveClientSecret
    const clientSecret = decrypt(encryptedSecret ?? "")

    if (!clientId || !clientSecret) {
      return { success: false, error: "PayPal credentials missing." }
    }

    // Auth Token
    const baseUrl = isSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com"
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

    const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" }
    })
    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      return { success: false, error: "Could not authenticate with PayPal." }
    }

    // Cart Data
    const cartData = await getCartCalculation(cartId)
    if (!cartData.success || !cartData.total) {
      return { success: false, error: "Invalid cart amount." }
    }

    // Create Order
    const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        intent: config.intent || "CAPTURE",
        purchase_units: [{
          reference_id: cartId,
          amount: {
            currency_code: cartData.currency || "AUD", // Dynamic Currency
            value: cartData.total.toFixed(2) 
          }
        }],
        application_context: {
            brand_name: config.brandName || "GoBike Store",
            landing_page: config.landingPage || "LOGIN",
            user_action: "PAY_NOW"
        }
      })
    })

    const orderData = await orderRes.json()

    if (orderData.id) {
      return { success: true, orderId: orderData.id }
    } else {
      console.error("PayPal Order Error:", orderData)
      return { success: false, error: "Failed to create PayPal order." }
    }

  } catch (error: any) {
    console.error("PayPal Create Action Error:", error)
    return { success: false, error: "System error during PayPal checkout." }
  }
}