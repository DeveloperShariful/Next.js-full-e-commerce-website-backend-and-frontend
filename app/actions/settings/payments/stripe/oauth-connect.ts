// app/actions/settings/payments/stripe/oauth-connect.ts
"use server"

import { db } from "@/lib/db"
import Stripe from "stripe"
import { revalidatePath } from "next/cache"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-12-15.clover", 
  typescript: true,
})

export async function stripeOAuthExchange(paymentMethodId: string, code: string) {
  try {
    // Exchange the authorization code for an access token
    const response = await stripe.oauth.token({
      grant_type: "authorization_code",
      code,
    })

    if (!response.stripe_user_id) {
      throw new Error("No account ID returned from Stripe")
    }

    // Save connection details
    await db.stripeConfig.update({
      where: { paymentMethodId },
      data: {
        isConnected: true,
        accountId: response.stripe_user_id,
        oauthAccessToken: response.access_token,
        oauthRefreshToken: response.refresh_token,
        oauthTokenType: response.token_type,
        // Typically in Connect, we might use the platform's keys or the connected account's keys depending on the flow.
        // For Standard Connect, the access_token acts as the secret key for that user.
        liveSecretKey: response.access_token, 
      }
    })

    revalidatePath("/admin/settings/payments")
    return { success: true }
  } catch (error: any) {
    console.error("Stripe OAuth Error:", error)
    return { success: false, error: error.message || "Failed to connect Stripe" }
  }
}