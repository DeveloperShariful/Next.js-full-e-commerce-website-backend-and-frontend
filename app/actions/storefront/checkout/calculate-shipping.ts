// File: app/actions/storefront/checkout/calculate-shipping.ts
"use server";

import { db } from "@/lib/prisma";
import { getTransdirectQuotes } from "./get-transdirect-quotes";

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
    const cart = await db.cart.findUnique({
      where: { id: cartId },
      include: { items: { include: { product: true, variant: true } } }
    });

    if (!cart) return { success: false, rates: [] };

    // 1. Fetch Configs & Boxes
    const [zones, tdConfig, boxes] = await Promise.all([
      db.shippingZone.findMany({
        where: { countries: { has: address.country } },
        include: { rates: true }
      }),
      db.transdirectConfig.findUnique({ where: { id: "transdirect_config" } }),
      db.shippingBox.findMany({ where: { isEnabled: true }, orderBy: { maxWeight: 'asc' } })
    ]);

    let localRates: any[] = [];
    
    // 2. Calculate Weight & Dimensions
    let totalWeight = 0;
    let totalPrice = 0;
    let maxLen = 0, maxWid = 0, maxHgt = 0;

    for (const item of cart.items) {
        const w = item.variant?.weight || item.product.weight || 0.5;
        const q = item.quantity;
        const p = item.variant?.price || item.product.price || 0;
        
        const l = item.variant?.length || item.product.length || 10;
        const wd = item.variant?.width || item.product.width || 10;
        const h = item.variant?.height || item.product.height || 10;

        totalWeight += (w * q);
        totalPrice += (p * q);

        if (l > maxLen) maxLen = l;
        if (wd > maxWid) maxWid = wd;
        if (h > maxHgt) maxHgt = h;
    }

    // 3. Boxing Logic (For Transdirect)
    const transdirectItems = [];
    
    if (tdConfig?.enableOrderBoxing && boxes.length > 0) {
        // Find suitable box
        const suitableBox = boxes.find(b => 
            (b.maxWeight || 1000) >= totalWeight &&
            b.length >= maxLen &&
            b.width >= maxWid &&
            b.height >= maxHgt
        );

        if (suitableBox) {
            // Add box weight
            if (suitableBox.weight) totalWeight += suitableBox.weight;
            
            transdirectItems.push({
                weight: totalWeight,
                length: suitableBox.length,
                width: suitableBox.width,
                height: suitableBox.height,
                quantity: 1,
                description: "Consolidated Box"
            });
        } else {
            // Fallback: Individual items if no box fits
            cart.items.forEach(item => {
                transdirectItems.push({
                    weight: item.variant?.weight || item.product.weight || 0.5,
                    length: item.variant?.length || item.product.length || 10,
                    width: item.variant?.width || item.product.width || 10,
                    height: item.variant?.height || item.product.height || 10,
                    quantity: item.quantity,
                    description: "Item"
                });
            });
        }
    } else {
        // Default: Individual items
        cart.items.forEach(item => {
            transdirectItems.push({
                weight: item.variant?.weight || item.product.weight || 0.5,
                length: item.variant?.length || item.product.length || 10,
                width: item.variant?.width || item.product.width || 10,
                height: item.variant?.height || item.product.height || 10,
                quantity: item.quantity,
                description: "Item"
            });
        });
    }

    // 4. Local Rates Filter
    zones.forEach(zone => {
        zone.rates.forEach(rate => {
            const weightMatch = (!rate.minWeight || totalWeight >= rate.minWeight) && (!rate.maxWeight || totalWeight <= rate.maxWeight);
            const priceMatch = (!rate.minPrice || totalPrice >= rate.minPrice);

            if (weightMatch && priceMatch) {
                localRates.push({
                    id: rate.id,
                    name: rate.name,
                    price: rate.price,
                    type: "flat_rate",
                    description: rate.minWeight ? `${rate.minWeight}-${rate.maxWeight}kg` : "Standard"
                });
            }
        });
    });

    // 5. Transdirect Rates
    let carrierRates: any[] = [];
    if (tdConfig?.isEnabled && address.country === "AU") {
        const quoteRes = await getTransdirectQuotes({
            items: transdirectItems,
            receiver: {
                postcode: address.postcode,
                suburb: address.suburb,
                state: address.state,
                //country: "AU",
                type: "residential"
            }
        });

        if (quoteRes.success) {
            // ✅ FIX: Added '|| []' to handle undefined case
            carrierRates = quoteRes.quotes || [];
        }
    }

    return { 
        success: true, 
        rates: [...localRates, ...carrierRates].sort((a, b) => a.price - b.price) 
    };

  } catch (error) {
    console.error("Shipping Calc Error:", error);
    return { success: false, rates: [] };
  }
}