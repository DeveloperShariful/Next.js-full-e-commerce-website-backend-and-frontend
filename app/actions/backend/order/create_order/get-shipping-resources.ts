// File: app/actions/order/create_order/get-shipping-resources.ts

"use server";

import { db } from "@/lib/prisma";

// Helper to safely convert Decimal to Number
const toNumber = (val: any) => {
    if (!val) return 0;
    if (typeof val === 'object' && 'toNumber' in val) {
        return val.toNumber();
    }
    return Number(val);
};

export async function getShippingResources() {
  try {
    // ১. পিকআপ লোকেশনগুলো আনা
    const pickupLocations = await db.pickupLocation.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
      }
    });

    // ২. শিপিং রেটগুলো আনা
    const rawRates = await db.shippingRate.findMany({
      include: {
        zone: true,
        carrierService: {
          select: {
            name: true,
            isEnabled: true
          }
        }
      }
    });

    // 🔥 Serialize Decimals to Numbers
    const shippingRates = rawRates.map(rate => ({
        ...rate,
        price: toNumber(rate.price),
        minWeight: toNumber(rate.minWeight),
        maxWeight: toNumber(rate.maxWeight),
        minPrice: toNumber(rate.minPrice)
    }));

    return {
      pickupLocations,
      shippingRates
    };
  } catch (error) {
    console.error("GET_SHIPPING_RESOURCES_ERROR:", error);
    return {
      pickupLocations: [],
      shippingRates: []
    };
  }
}