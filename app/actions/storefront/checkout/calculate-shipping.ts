// app/actions/storefront/checkout/calculate-shipping.ts
"use server";

import { db } from "@/lib/prisma";
import { getTransdirectQuotes } from "./get-transdirect-quotes"; // Reusing your existing utility

interface ShippingParams {
  cartId: string;
  address: {
    postcode: string;
    suburb: string;
    state: string;
    country: string;
  };
}

export async function calculateShippingRates({ cartId, address }: ShippingParams) {
  try {
    // ১. কার্ট আইটেম ও ওজন বের করা
    const cart = await db.cart.findUnique({
      where: { id: cartId },
      include: { items: { include: { product: true, variant: true } } }
    });

    if (!cart) return { success: false, rates: [] };

    // ২. লোকাল রেট চেক করা (ShippingZone)
    // লজিক: প্রথমে দেখব ডাটাবেসে এই জোন (Zone) এর জন্য কোনো রেট সেট করা আছে কি না
    const zones = await db.shippingZone.findMany({
      where: { countries: { has: address.country } },
      include: { rates: true }
    });

    let localRates: any[] = [];
    
    // কার্ট টোটাল এবং ওজন হিসাব
    let totalWeight = 0;
    let totalPrice = 0;
    const transdirectItems = [];

    for (const item of cart.items) {
        const w = item.variant?.weight || item.product.weight || 0.5;
        const q = item.quantity;
        const p = item.variant?.price || item.product.price || 0;
        
        totalWeight += (w * q);
        totalPrice += (p * q);

        // Transdirect এর জন্য আইটেম ফরম্যাট
        transdirectItems.push({
            weight: w,
            length: item.variant?.length || item.product.length || 10,
            width: item.variant?.width || item.product.width || 10,
            height: item.variant?.height || item.product.height || 10,
            quantity: q,
            description: "carton"
        });
    }

    // লোকাল রেট ফিল্টার করা (Weight/Price Condition)
    zones.forEach(zone => {
        zone.rates.forEach(rate => {
            // Check Conditions
            const weightMatch = (!rate.minWeight || totalWeight >= rate.minWeight) && (!rate.maxWeight || totalWeight <= rate.maxWeight);
            const priceMatch = (!rate.minPrice || totalPrice >= rate.minPrice);

            if (weightMatch && priceMatch) {
                localRates.push({
                    id: rate.id,
                    name: rate.name,
                    price: rate.price, // ফ্রি শিপিং হলে ০
                    type: "flat_rate",
                    description: rate.minWeight ? `${rate.minWeight}-${rate.maxWeight}kg` : "Standard"
                });
            }
        });
    });

    // ৩. Transdirect রেট চেক করা (যদি কনফিগ অন থাকে)
    let carrierRates: any[] = [];
    const tdConfig = await db.transdirectConfig.findUnique({ where: { id: "transdirect_config" } });
    
    if (tdConfig?.isEnabled && address.country === "AU") {
        const quoteRes = await getTransdirectQuotes({
            items: transdirectItems,
            receiver: {
                postcode: address.postcode,
                suburb: address.suburb,
                state: address.state
            }
        });

        if (quoteRes.success) {
            carrierRates = quoteRes.quotes;
        }
    }

    // ৪. সব রেট মার্জ করে রিটার্ন করা
    return { 
        success: true, 
        rates: [...localRates, ...carrierRates].sort((a, b) => a.price - b.price) 
    };

  } catch (error) {
    console.error("Shipping Calc Error:", error);
    return { success: false, rates: [] };
  }
}