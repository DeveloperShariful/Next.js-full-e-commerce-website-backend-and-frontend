// File: app/actions/storefront/checkout/create-paypal-order.ts
"use server"

import { db } from "@/lib/prisma"
import { decrypt } from "@/app/actions/admin/settings/payments/crypto"
import { getCheckoutSummary } from "./get-checkout-summary" // 🔥 Secure Calculation

interface PayPalOrderParams {
  cartId: string;
  shippingMethodId?: string;
  couponCode?: string;
  address: {
    country: string;
    state: string;
    postcode: string;
    suburb: string;
  };
}

export async function createPaypalOrder({ cartId, shippingMethodId, couponCode, address }: PayPalOrderParams) {
  try {
    // ১. পেমেন্ট মেথড কনফিগ চেক
    const methodConfig = await db.paymentMethodConfig.findUnique({
      where: { identifier: "paypal" },
      include: { paypalConfig: true }
    })

    if (!methodConfig?.isEnabled || !methodConfig.paypalConfig) {
      return { success: false, error: "PayPal is disabled." }
    }

    const config = methodConfig.paypalConfig
    
    // ২. সার্ভার সাইড ক্যালকুলেশন (Security 🔒)
    // ফ্রন্টএন্ডের টোটাল না নিয়ে আমরা নিজেরা হিসাব করছি
    const summary = await getCheckoutSummary({ 
        cartId, 
        shippingAddress: address, 
        shippingMethodId, 
        couponCode 
    });

    if (!summary.success || !summary.breakdown) {
      return { success: false, error: "Failed to calculate order total." };
    }

    const finalAmount = summary.breakdown.total.toFixed(2);
    const currencyCode = (summary.currency || "AUD").toUpperCase();

    // ৩. ক্রেডেনশিয়াল ডিক্রিপ্ট
    const isSandbox = config.sandbox
    const clientId = isSandbox ? config.sandboxClientId : config.liveClientId
    const encryptedSecret = isSandbox ? config.sandboxClientSecret : config.liveClientSecret
    const clientSecret = decrypt(encryptedSecret ?? "")

    if (!clientId || !clientSecret) {
      return { success: false, error: "PayPal credentials missing." }
    }

    // ৪. Auth Token জেনারেট
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

    // ৫. পেপ্যাল অর্ডার তৈরি
    const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        intent: config.intent || "CAPTURE",
        purchase_units: [{
          reference_id: cartId, // কার্ট আইডি রেফারেন্স হিসেবে রাখলাম
          amount: {
            currency_code: currencyCode,
            value: finalAmount
          },
          description: `Order from GoBike Store`
        }],
        application_context: {
            brand_name: config.brandName || "GoBike Store",
            landing_page: config.landingPage || "LOGIN",
            user_action: "PAY_NOW",
            shipping_preference: "SET_PROVIDED_ADDRESS" // আমরা শিপিং এড্রেস হ্যান্ডেল করছি
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