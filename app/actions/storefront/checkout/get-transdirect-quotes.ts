// File: app/actions/storefront/checkout/get-transdirect-quotes.ts
"use server"

import { db } from "@/lib/prisma"
import { decrypt } from "@/app/actions/admin/settings/payments/crypto"

interface ShippingItem {
  weight: number
  length: number
  width: number
  height: number
  quantity: number
}

interface ReceiverDetails {
  postcode: string
  suburb: string
  state: string
  country: string
  type: string // "residential" | "business"
}

export async function getTransdirectQuotes(items: ShippingItem[], receiver: ReceiverDetails) {
  try {
    // 1. Get Config
    const config = await db.transdirectConfig.findUnique({
      where: { id: "transdirect_config" }
    })

    if (!config || !config.isEnabled) {
      return { success: false, error: "Shipping calculation disabled" }
    }

    const apiKey = decrypt(config.apiKey || "")
    if (!apiKey) return { success: false, error: "Shipping configuration error" }

    // 2. Prepare Payload
    const payload = {
      declared_value: config.defaultDeclaredValue ? "100.00" : "0.00", 
      sender: {
        postcode: config.senderPostcode,
        suburb: config.senderSuburb,
        state: config.senderState,
        country: "AU",
        type: config.senderType
      },
      receiver: {
        postcode: receiver.postcode,
        suburb: receiver.suburb,
        state: receiver.state,
        country: "AU",
        type: receiver.type || "residential"
      },
      items: items.map(item => ({
        weight: item.weight,
        length: item.length,
        width: item.width,
        height: item.height,
        quantity: item.quantity,
        description: "Bicycle Parts/Accessories" 
      }))
    }

    // 3. Call API
    const response = await fetch("https://www.transdirect.com.au/api/bookings/v4/quotes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": apiKey
      },
      body: JSON.stringify(payload),
      next: { revalidate: 0 }
    })

    if (!response.ok) {
      const err = await response.json()
      console.error("Transdirect API Error:", err)
      return { success: false, error: "Unable to fetch shipping rates" }
    }

    const data = await response.json()

    // 4. Map Response
    const quotes = data.quotes.map((q: any) => ({
      id: q.id, // Store this to book later
      courier: q.service_name,
      service: q.service_type,
      cost: parseFloat(q.total),
      transit_time: q.transit_time,
      price_insurance_ex: q.price_insurance_ex
    })).sort((a: any, b: any) => a.cost - b.cost)

    return { success: true, quotes }

  } catch (error) {
    console.error("Transdirect Error:", error)
    return { success: false, error: "System error calculating shipping" }
  }
}