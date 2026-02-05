//app/actions/storefront/checkout/stripe-payment.ts

"use server"

import { db } from "@/lib/prisma"
import Stripe from "stripe"
import { decrypt } from "@/app/actions/admin/settings/payments/crypto"
import { calculateShippingServerSide } from "./get-shipping-rates"
import { validateCoupon } from "./validate-coupon"

async function getStripeInstance() {
  const config = await db.stripeConfig.findFirst({
    include: { paymentMethod: true }
  })
  
  if (!config || !config.paymentMethod.isEnabled) return null
  
  const rawTestKey = config.testSecretKey ? decrypt(config.testSecretKey) : "";
  const rawLiveKey = config.liveSecretKey ? decrypt(config.liveSecretKey) : "";
  const secretKey = config.testMode ? rawTestKey : rawLiveKey;

  if (!secretKey) return null

  return new Stripe(secretKey, {
    apiVersion: "2025-01-27.acacia" as any,
    typescript: true,
  })
}

// 🛡️ Secure Total Calculation with Coupon & Surcharge
async function calculateSecureTotal(
    cartId: string, 
    shippingMethodId?: string, 
    shippingAddress?: any,
    couponCode?: string
) {
    const config = await db.stripeConfig.findFirst({ include: { paymentMethod: true } });
    
    const cart = await db.cart.findUnique({
        where: { id: cartId },
        include: { items: { include: { product: true, variant: true } } }
    });
    
    if (!cart) return 0;

    let subtotal = 0;
    cart.items.forEach(item => {
        const price = Number(item.variant ? (item.variant.salePrice || item.variant.price) : (item.product.salePrice || item.product.price));
        subtotal += price * item.quantity;
    });

    let shippingCost = 0;
    if (shippingMethodId && shippingAddress) {
        const cost = await calculateShippingServerSide(cartId, shippingAddress, shippingMethodId);
        shippingCost = cost || 0;
    }

    let discount = 0;
    if (couponCode) {
        const res = await validateCoupon(couponCode, cartId);
        if (res.success && res.discountAmount) {
            discount = res.discountAmount;
        }
    }

    let surcharge = 0;
    if (config?.paymentMethod.surchargeEnabled) {
         if (config.paymentMethod.surchargeType === 'percentage') {
             surcharge = ((subtotal + shippingCost - discount) * Number(config.paymentMethod.surchargeAmount)) / 100;
         } else {
             surcharge = Number(config.paymentMethod.surchargeAmount);
         }
    }

    const total = subtotal + shippingCost + surcharge - discount;
    return Math.max(0, total);
}

export async function createPaymentIntent(
    cartId: string, 
    shippingMethodId?: string, 
    shippingAddress?: any, 
    couponCode?: string,
    metadata: any = {}
) {
  try {
    const stripe = await getStripeInstance()
    if (!stripe) throw new Error("Stripe Unavailable")

    const amount = await calculateSecureTotal(cartId, shippingMethodId, shippingAddress, couponCode);
    
    if (amount <= 0.50) throw new Error("Order total must be at least $0.50");

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), 
      currency: "aud",
      automatic_payment_methods: { enabled: true },
      metadata: {
          cartId: cartId,
          couponCode: couponCode || "",
          shippingMethod: shippingMethodId || "",
          ...metadata
      }
    })

    return { clientSecret: paymentIntent.client_secret, id: paymentIntent.id }
  } catch (error: any) {
    console.error("Create Intent Error:", error.message)
    return { error: error.message || "Payment init failed" }
  }
}

export async function updatePaymentIntent(
    paymentIntentId: string, 
    cartId: string, 
    shippingMethodId?: string, 
    shippingAddress?: any,
    couponCode?: string
) {
  try {
    const stripe = await getStripeInstance()
    if (!stripe) throw new Error("Stripe Unavailable")

    const amount = await calculateSecureTotal(cartId, shippingMethodId, shippingAddress, couponCode);

    await stripe.paymentIntents.update(paymentIntentId, {
        amount: Math.round(amount * 100),
        metadata: {
            cartId,
            shippingMethod: shippingMethodId || "",
            couponCode: couponCode || ""
        }
    })
    return { success: true }
  } catch (error: any) {
    console.error("Update Intent Error:", error)
    return { error: error.message }
  }
}