// File: app/actions/storefront/checkout/get-checkout-data.ts
"use server"

import { db } from "@/lib/prisma"
import { decrypt } from "@/app/actions/admin/settings/payments/crypto" 
import { cookies } from "next/headers"

export async function getCheckoutData() {
  try {
    const cookieStore = await cookies()
    const cartId = cookieStore.get("cartId")?.value
    const userId = cookieStore.get("userId")?.value 

    // 1. Fetch Cart
    let cart = null
    if (cartId) {
      cart = await db.cart.findUnique({
        where: { id: cartId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  price: true,
                  salePrice: true,
                  weight: true,
                  length: true,
                  width: true,
                  height: true,
                  featuredImage: true,
                  slug: true
                }
              },
              variant: {
                select: {
                  name: true,
                  price: true,
                  salePrice: true,
                  weight: true,
                  image: true,
                  attributes: true
                }
              }
            }
          }
        }
      })
    }

    // 2. Fetch Active Payment Methods
    const paymentMethods = await db.paymentMethodConfig.findMany({
      where: { isEnabled: true },
      include: {
        stripeConfig: true,
        paypalConfig: true,
        offlineConfig: true
      },
      orderBy: { displayOrder: "asc" }
    })

    // 3. Process Payment Keys (Decrypt Public Keys only)
    const processedMethods = paymentMethods.map(method => {
      const publicData: any = {
        id: method.id,
        identifier: method.identifier,
        name: method.name,
        description: method.description,
        surchargeEnabled: method.surchargeEnabled,
        surchargeType: method.surchargeType,
        surchargeAmount: method.surchargeAmount,
        minOrderAmount: method.minOrderAmount,
        maxOrderAmount: method.maxOrderAmount,
        mode: method.mode
      }

      if (method.identifier === 'stripe' && method.stripeConfig) {
        publicData.config = {
          publishableKey: method.mode === 'TEST' 
            ? method.stripeConfig.testPublishableKey 
            : method.stripeConfig.livePublishableKey,
          inlineCard: method.stripeConfig.inlineCreditCardForm,
          applePay: method.stripeConfig.applePayEnabled,
          googlePay: method.stripeConfig.googlePayEnabled,
          savedCards: method.stripeConfig.savedCards
        }
      }

      if (method.identifier === 'paypal' && method.paypalConfig) {
        publicData.config = {
          clientId: method.mode === 'TEST' 
            ? method.paypalConfig.sandboxClientId 
            : method.paypalConfig.liveClientId,
          intent: method.paypalConfig.intent,
          color: method.paypalConfig.buttonColor,
          label: method.paypalConfig.buttonLabel,
          shape: method.paypalConfig.buttonShape,
          layout: method.paypalConfig.buttonLayout,
          payLater: method.paypalConfig.payLaterEnabled
        }
      }

      if (['bank_transfer', 'cheque', 'cod'].includes(method.identifier) && method.offlineConfig) {
        publicData.config = {
          instructions: method.instructions,
          details: method.offlineConfig
        }
      }

      return publicData
    })

    // 4. Fetch User Saved Address
    let savedAddress = null
    if (userId) {
      savedAddress = await db.address.findFirst({
        where: { userId, isDefault: true }
      })
    }

    return { 
      success: true, 
      cart, 
      paymentMethods: processedMethods, 
      savedAddress 
    }

  } catch (error) {
    console.error("Get Checkout Data Error:", error)
    return { success: false, error: "Failed to load checkout data" }
  }
}