// File: app/actions/storefront/checkout/create-paypal-order.ts
"use server"

import { db } from "@/lib/prisma"
import { decrypt } from "@/app/actions/admin/settings/payments/crypto"
import { getCheckoutSummary } from "./get-checkout-summary" 

interface PayPalOrderParams {
  cartId: string;
  shippingMethodId?: string;
  shippingCost?: number; // ✅ NEW
  couponCode?: string;
  address: {
    country: string;
    state: string;
    postcode: string;
    suburb: string;
    address1: string;
    city: string;
  };
}

export async function createPaypalOrder({ cartId, shippingMethodId, shippingCost, couponCode, address }: PayPalOrderParams) {
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
        shippingCost, // 🔥 Passing existing cost
        couponCode 
    });

    if (!summary.success || !summary.breakdown) {
      return { success: false, error: "Failed to calculate order total." };
    }

    let finalAmount = summary.breakdown.total;
    const breakdown = summary.breakdown;

    // 🔥 3. Calculate Surcharge
    let surcharge = 0;
    if (methodConfig.surchargeEnabled) {
        if (methodConfig.surchargeType === "percentage") {
            surcharge = (breakdown.subtotal * (methodConfig.surchargeAmount || 0)) / 100;
        } else {
            surcharge = methodConfig.surchargeAmount || 0;
        }
        finalAmount += surcharge;
    }

    const currencyCode = (storeSettings?.currency || "AUD").toUpperCase();

    // 4. Decrypt Credentials
    const isSandbox = config.sandbox
    const clientId = isSandbox ? config.sandboxClientId : config.liveClientId
    const encryptedSecret = isSandbox ? config.sandboxClientSecret : config.liveClientSecret
    const clientSecret = decrypt(encryptedSecret ?? "")

    if (!clientId || !clientSecret) {
      return { success: false, error: "PayPal credentials missing." }
    }

    // 5. Get Auth Token
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

    // 6. Create Order with Detailed Breakdown
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
            value: finalAmount.toFixed(2),
            breakdown: {
                item_total: {
                    currency_code: currencyCode,
                    value: breakdown.subtotal.toFixed(2)
                },
                shipping: {
                    currency_code: currencyCode,
                    value: breakdown.shipping.toFixed(2)
                },
                tax_total: {
                    currency_code: currencyCode,
                    value: breakdown.tax.toFixed(2)
                },
                discount: {
                    currency_code: currencyCode,
                    value: breakdown.discount.toFixed(2)
                },
                // 🔥 Add Surcharge as Handling Fee
                handling: {
                    currency_code: currencyCode,
                    value: surcharge.toFixed(2)
                }
            }
          },
          description: `Order from Store`,
          shipping: {
            address: {
                address_line_1: address.address1,
                admin_area_2: address.suburb, 
                admin_area_1: address.state,
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