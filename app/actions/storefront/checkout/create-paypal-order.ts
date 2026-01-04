// File: app/actions/storefront/checkout/create-paypal-order.ts
"use server"

import { db } from "@/lib/prisma"
import { decrypt } from "@/app/actions/admin/settings/payments/crypto"
import { getCheckoutSummary } from "./get-checkout-summary" 

interface PayPalOrderParams {
  cartId: string;
  shippingMethodId?: string;
  couponCode?: string;
  address: {
    country: string;
    state: string;
    postcode: string;
    suburb: string;
    address1: string; // ✅ Added address lines
    city: string;
  };
}

export async function createPaypalOrder({ cartId, shippingMethodId, couponCode, address }: PayPalOrderParams) {
  try {
    // 1. Config Check
    const [methodConfig, storeSettings] = await Promise.all([
        db.paymentMethodConfig.findUnique({
            where: { identifier: "paypal" },
            include: { paypalConfig: true }
        }),
        db.storeSettings.findUnique({
            where: { id: "settings" },
            select: { currency: true }
        })
    ]);

    if (!methodConfig?.isEnabled || !methodConfig.paypalConfig) {
      return { success: false, error: "PayPal is disabled." }
    }

    const config = methodConfig.paypalConfig
    
    // 2. Calculate Total
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
    // ✅ FIX: Use Store Currency
    const currencyCode = (storeSettings?.currency || "AUD").toUpperCase();

    // 3. Decrypt Credentials
    const isSandbox = config.sandbox
    const clientId = isSandbox ? config.sandboxClientId : config.liveClientId
    const encryptedSecret = isSandbox ? config.sandboxClientSecret : config.liveClientSecret
    const clientSecret = decrypt(encryptedSecret ?? "")

    if (!clientId || !clientSecret) {
      return { success: false, error: "PayPal credentials missing." }
    }

    // 4. Get Auth Token
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

    // 5. Create Order
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
            currency_code: currencyCode,
            value: finalAmount
          },
          description: `Order from Store`,
          // ✅ FIX: Pass Shipping Address to PayPal
          shipping: {
            address: {
                address_line_1: address.address1,
                admin_area_2: address.suburb, // City/Suburb
                admin_area_1: address.state,  // State
                postal_code: address.postcode,
                country_code: address.country
            }
          }
        }],
        application_context: {
            brand_name: config.brandName || "Store",
            landing_page: config.landingPage || "LOGIN",
            user_action: "PAY_NOW",
            shipping_preference: "SET_PROVIDED_ADDRESS" 
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